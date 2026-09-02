/**
 * Drop-in replacement for `resize-observer-polyfill`, aliased in vite.config.js.
 *
 * Several rc-* packages (rc-resize-observer, and through it Table, Select,
 * Tabs, Overflow…) depend on that polyfill, so its ~33kB rode along in the
 * chunk the login screen downloads. ResizeObserver has been native since
 * Chrome 64 / Firefox 69 / Safari 13.1 (March 2020), which is below the
 * floor this app already assumes elsewhere, so the polyfill is dead weight.
 *
 * The no-op fallback exists only so a browser without it degrades to
 * "layout does not react to resize" instead of throwing at module scope and
 * taking the whole page down.
 */
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const ResizeObserverImpl =
  typeof globalThis !== 'undefined' && globalThis.ResizeObserver
    ? globalThis.ResizeObserver
    : NoopResizeObserver

export default ResizeObserverImpl
