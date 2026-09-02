import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Backend lives on :5000 in development. Shared by `vite dev` and `vite preview`
// so a production build can be exercised locally against the real API.
const apiProxy = {
  '/api': { target: 'http://localhost:5000', changeOrigin: true },
  '/storage': { target: 'http://localhost:5000', changeOrigin: true },
  '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
}

// The login screen is a lazy route, which keeps ~265kB of form/antd code out
// of the entry chunk — but it also means the browser cannot know the login
// chunk exists until the entry has downloaded, parsed and run. That is a whole
// extra round trip in front of the first screen every visitor sees.
//
// Vite emits <link rel="modulepreload"> only for the entry's *static* imports,
// so this plugin adds them for the login route's chunks too: the browser starts
// fetching them in parallel with the entry instead of after it. Everything
// preloaded here — antd's Form, Input, Button — is used on every other screen
// as well, so a signed-in user deep-linking past /login is not paying for
// bytes they will not need.
const preloadLoginRoute = () => ({
  name: 'preload-login-route',
  enforce: 'post',
  apply: 'build',
  transformIndexHtml(_html, ctx) {
    if (!ctx.bundle) return

    const entry = Object.values(ctx.bundle).find((c) => c.type === 'chunk' && c.isEntry)
    const loginChunk = Object.values(ctx.bundle).find(
      (c) => c.type === 'chunk' && c.facadeModuleId?.replace(/\\/g, '/').endsWith('/pages/auth/Login.jsx')
    )
    if (!loginChunk) return

    // Walk the login chunk's static imports; skip whatever the entry already
    // pulls in, since Vite has emitted a preload for those.
    const alreadyPreloaded = new Set([entry?.fileName, ...(entry?.imports ?? [])])
    const needed = new Set()
    const walk = (fileName) => {
      if (!fileName || needed.has(fileName) || alreadyPreloaded.has(fileName)) return
      needed.add(fileName)
      ctx.bundle[fileName]?.imports?.forEach(walk)
    }
    walk(loginChunk.fileName)

    return [...needed].map((fileName) => ({
      tag: 'link',
      attrs: { rel: 'modulepreload', crossorigin: true, href: `/${fileName}` },
      injectTo: 'head',
    }))
  },
})

export default defineConfig({
  plugins: [react(), preloadLoginRoute()],

  resolve: {
    alias: {
      // rc-resize-observer (and everything built on it — Table, Select, Tabs,
      // Overflow) pulls in resize-observer-polyfill, ~33kB in the chunk the
      // login screen waits on. See src/utils/resizeObserverShim.js.
      'resize-observer-polyfill': fileURLToPath(
        new URL('./src/utils/resizeObserverShim.js', import.meta.url)
      ),
    },
  },

  build: {
    // The browsers this app targets all speak 2020-era syntax natively, so
    // there is no reason to ship esbuild's down-levelled output — native
    // optional chaining / nullish coalescing / async are smaller and faster
    // to parse than the helper-laden equivalents.
    target: 'es2020',

    // esbuild minification is ~20x faster than terser and within a few percent
    // on size for this app.
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Split the long-lived vendor code away from app code so a routine
        // deploy does not invalidate 1MB+ of unchanged library bytes, and so
        // the page-one download skips libraries only used deep in the app.
        manualChunks(id) {
          // Vite's dynamic-import preload helper is a virtual module that every
          // lazy route depends on. Left unassigned, Rollup folds it into an
          // arbitrary vendor chunk — and because the entry needs the helper,
          // that whole chunk gets pulled into the entry's static graph. Pinning
          // it to the core chunk keeps single-page libraries genuinely lazy.
          if (id.includes('vite/preload-helper')) return 'vendor-react'

          if (!id.includes('node_modules')) return

          // Only the runtime every screen needs is pinned by hand. Naming a
          // chunk forces every module in it into any graph that touches it, so
          // a hand-written list is actively harmful for the rest: rules matched
          // on top-level package names miss transitive deps (canvg, pako and
          // core-js arrive via jspdf; decimal.js-light and es-toolkit via
          // recharts), those strays land in a catch-all "vendor" chunk, and the
          // catch-all is reachable from the entry — so page-one ends up paying
          // for the PDF and charting stacks anyway.
          //
          // Everything not listed here returns undefined and Rollup assigns it
          // by real reachability: a module reached only from a lazy route stays
          // in that route's chunk.
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('react-router') ||
            id.includes('@remix-run/router') ||
            id.includes('/scheduler/')
          )
            return 'vendor-react'
          if (id.includes('redux') || id.includes('immer') || id.includes('reselect'))
            return 'vendor-redux'
          if (id.includes('/axios/')) return 'vendor-axios'

          return undefined
        },
      },
    },
  },

  esbuild: {
    // Strip debug noise from production bundles only; dev keeps every log.
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },

  server: {
    // Pre-bundle the dependencies the first screen needs so the very first dev
    // page load does not stall on on-demand optimisation.
    warmup: {
      clientFiles: ['./src/main.jsx', './src/pages/auth/Login.jsx', './src/layouts/DashboardLayout.jsx'],
    },
    proxy: apiProxy,
  },

  preview: {
    proxy: apiProxy,
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'antd',
      '@ant-design/icons',
      'axios',
      'dayjs',
    ],
    // Only ever needed by one page each — leaving them out keeps the dev
    // server's cold start short.
    //
    // leaflet is NOT in this list despite being single-page: it is CJS-only
    // (package.json declares just `main: dist/leaflet-src.js` — no `module`, no
    // `exports`), so excluding it skips the optimizer's CJS→ESM conversion and
    // the browser gets a module with no default binding. `import L from
    // 'leaflet'` then dies with "does not provide an export named 'default'".
    // Production is unaffected either way — Rollup's commonjs plugin handles it
    // at build time — so this breaks dev only.
    exclude: ['reactflow', 'recharts', 'xlsx', 'jspdf', 'html2canvas'],
  },
})
