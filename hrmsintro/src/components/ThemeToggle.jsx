import React from 'react'
import useTheme from '../hooks/useTheme.js'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isLight = theme === 'light'

  return (
    <button
      type="button"
      onClick={toggle}
      className={`theme-toggle ${isLight ? 'is-light' : 'is-dark'}`}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      <span className="tt-icon tt-moon" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="11" height="11" fill="none">
          <path
            d="M13 9.2A5 5 0 0 1 6.8 3a5 5 0 1 0 6.2 6.2Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="tt-icon tt-sun" aria-hidden="true">
        <svg
          viewBox="0 0 16 16"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        >
          <circle cx="8" cy="8" r="2.6" />
          <path d="M8 1.5v1.6M8 12.9v1.6M14.5 8h-1.6M3.1 8H1.5M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1M12.6 12.6l-1.1-1.1M4.5 4.5 3.4 3.4" />
        </svg>
      </span>
      <span className="tt-thumb" aria-hidden="true" />
    </button>
  )
}
