import React from 'react'
import { Result, Button } from 'antd'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/login'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          padding: '20px'
        }}>
          <Result
            status="error"
            title="Something went wrong"
            subTitle={this.state.error?.message || 'An unexpected error occurred'}
            extra={[
              <Button type="primary" key="console" onClick={() => console.log(this.state.errorInfo)}>
                View Details
              </Button>,
              <Button key="buy" onClick={this.handleReset}>
                Go to Login
              </Button>,
            ]}
          >
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <div style={{ 
                marginTop: '20px', 
                padding: '15px', 
                background: '#f5f5f5', 
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '400px'
              }}>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
          </Result>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
