import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { ConfigProvider, App as AntApp, message as antdMessage } from 'antd'
import { store } from './app/store'
import App from './AppWithMessage'
import ErrorBoundary from './components/ErrorBoundary'
import { installHttpMethodOverride } from './utils/httpMethodOverride'
import './index.css'

// Apache (cPanel) blocks PUT/PATCH/DELETE to the API — send them as POST with
// an override header instead. Must run before any request is made.
installHttpMethodOverride()

// Suppress scanner/extension-probe messages globally (e.g. password managers
// sometimes fetch /403.shtml, /wp-login.php, etc. The backend's 404 handler
// echoes the path back and callsites surface `data.message` in toasts.)
const PROBE_MSG_PATTERN = /\.(shtml|asp|aspx|php|cgi|jsp|env|git|bak|old|sql)\b|wp-login|wp-admin|phpmyadmin|Route \/\S+\.(shtml|php|asp|aspx)/i
;['error', 'warning', 'info', 'success'].forEach((level) => {
  const original = antdMessage[level].bind(antdMessage)
  antdMessage[level] = (content, ...rest) => {
    const text = typeof content === 'string' ? content : content?.content
    if (typeof text === 'string' && PROBE_MSG_PATTERN.test(text)) {
      if (import.meta.env.DEV) console.warn('[probe] suppressed message:', text)
      return
    }
    return original(content, ...rest)
  }
})

// Check for critical errors before rendering
try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <Provider store={store}>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#2563eb',
                colorInfo: '#2563eb',
                colorSuccess: '#16a34a',
                colorWarning: '#f59e0b',
                colorError: '#ef4444',
                colorTextBase: '#0f172a',
                borderRadius: 10,
                fontFamily:
                  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
                controlHeight: 38,
                boxShadowSecondary: '0 4px 16px rgba(15, 23, 42, 0.08)',
              },
              components: {
                Layout: {
                  siderBg: '#fff',
                  triggerBg: '#fff',
                  triggerColor: 'rgba(0,0,0,0.65)',
                  headerBg: '#fff',
                },
                Card: {
                  borderRadiusLG: 16,
                  boxShadowTertiary: '0 2px 10px rgba(15, 23, 42, 0.06)',
                },
                Button: {
                  borderRadius: 10,
                  controlHeight: 38,
                  fontWeight: 600,
                  primaryShadow: '0 4px 12px rgba(37, 99, 235, 0.28)',
                },
                Menu: {
                  itemBorderRadius: 10,
                  itemMarginInline: 8,
                  itemHeight: 42,
                  itemSelectedBg: '#eff4ff',
                  itemSelectedColor: '#2563eb',
                  itemActiveBg: '#f1f5f9',
                },
                Table: {
                  headerBg: '#f8fafc',
                  headerColor: '#475569',
                  borderColor: '#eef1f6',
                  rowHoverBg: '#f8fafc',
                },
                Input: { borderRadius: 10, controlHeight: 38 },
                Select: { borderRadius: 10, controlHeight: 38 },
                Tag: { borderRadiusSM: 6 },
              },
            }}
          >
            <AntApp>
              <App />
            </AntApp>
          </ConfigProvider>
        </Provider>
      </ErrorBoundary>
    </React.StrictMode>
  )
} catch (error) {
  console.error('Fatal error during app initialization:', error)
  document.getElementById('root').innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; flex-direction: column; font-family: Arial, sans-serif;">
      <h1 style="color: #ff4d4f;">Application Error</h1>
      <p style="color: #666;">Failed to initialize the application.</p>
      <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin-top: 20px; max-width: 800px; overflow: auto;">
        ${error.toString()}
        ${error.stack || ''}
      </pre>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Reload Page
      </button>
    </div>
  `
}
