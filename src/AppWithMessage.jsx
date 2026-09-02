import React, { useEffect } from 'react'
import { App as AntApp } from 'antd'
import { setAntdMessage } from './utils/antdMessage'
import App from './App'

/**
 * Wraps App and exposes antd's message API to a global holder so Redux slices
 * and other non-component code can use it (fixes "Static function can not
 * consume context" warning).
 */
export default function AppWithMessage() {
  const { message } = AntApp.useApp()
  useEffect(() => {
    setAntdMessage(message)
  }, [message])
  return <App />
}
