/**
 * Holds the antd message API from App.useApp() so Redux slices and other
 * non-component code can show messages with theme/context support.
 * Set by AppWithMessage (inside AntApp); use getAntdMessage() in thunks/slices.
 */
let messageApi = null

export function setAntdMessage(api) {
  messageApi = api
}

export function getAntdMessage() {
  return messageApi
}
