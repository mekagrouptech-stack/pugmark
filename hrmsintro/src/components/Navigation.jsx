import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import ThemeToggle from './ThemeToggle.jsx'

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      className={`nav ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container nav-inner">
        <a href="#" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <img src="/pugmark-mark.svg" alt="" />
          </span>
          <span className="brand-text">pugmark</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--paper-3)', letterSpacing: '0.2em', marginLeft: 4 }}>
            HRMS
          </span>
        </a>

        <div className="nav-links">
          <a href="#platform">Platform</a>
          <a href="#process">Process</a>
          <a href="#evidence">Evidence</a>
          <a href="#clients">Clients</a>
        </div>

        <div className="nav-right">
          <ThemeToggle />
          <a href="#cta" className="nav-cta">
            Request access
            <span className="arr">→</span>
          </a>
        </div>
      </div>
    </motion.nav>
  )
}
