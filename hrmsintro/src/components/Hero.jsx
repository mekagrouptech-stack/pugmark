import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'

const HEADLINE = [
  ['Workforce'],
  ['intelligence,'],
  ['re', { italic: 'imagined.' }]
]

export default function Hero() {
  const headlineRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero .word', {
        yPercent: 110,
        rotate: 4,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.08,
        delay: 0.2
      })
      gsap.from('.hero-meta, .hero-sub, .hero-actions', {
        y: 24,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.12,
        delay: 0.85
      })
      gsap.from(panelRef.current, {
        opacity: 0,
        x: 60,
        duration: 1.4,
        ease: 'expo.out',
        delay: 0.6
      })
      gsap.from('.panel-row', {
        opacity: 0,
        x: 20,
        duration: 0.7,
        ease: 'expo.out',
        stagger: 0.08,
        delay: 1.0
      })
      gsap.from('.panel-chart .bar', {
        scaleY: 0,
        transformOrigin: 'bottom',
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.04,
        delay: 1.2
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <section className="hero">
      <span className="hero-deco" aria-hidden="true">01</span>
      <div className="container">
        <div className="hero-grid">
          <div>
            <div className="hero-meta">
              <span className="dot" aria-hidden="true" />
              <span>Pugmark HRMS · Edition 2026</span>
              <span style={{ opacity: 0.4 }}>—</span>
              <span>Built for growing teams</span>
            </div>

            <h1 className="display" ref={headlineRef}>
              {HEADLINE.map((line, i) => (
                <span className="line" key={i}>
                  {line.map((part, j) =>
                    typeof part === 'string' ? (
                      <span className="word" key={j}>
                        {part}
                        {j < line.length - 1 ? ' ' : ''}
                      </span>
                    ) : (
                      <span className="word" key={j}>
                        <em>{part.italic}</em>
                      </span>
                    )
                  )}
                </span>
              ))}
            </h1>

            <p className="hero-sub">
              One system for onboarding, payroll, performance, and people analytics —
              built around the four pillars that move every modern workforce forward.
              Track every paw print your people leave behind.
            </p>

            <div className="hero-actions">
              <a href="#cta" className="btn-primary">
                <span>Begin the tour</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="1.4"/>
                </svg>
              </a>
              <a href="#process" className="btn-ghost">
                <span className="play" aria-hidden="true">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M2 1L9 5L2 9V1Z" />
                  </svg>
                </span>
                <span>Watch the film · 2:14</span>
              </a>
            </div>
          </div>

          <motion.div
            className="hero-panel"
            ref={panelRef}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="panel-header">
              <span className="panel-title">Headcount</span>
              <span className="panel-tag">LIVE · Q2</span>
            </div>

            <div>
              <div className="panel-stat">2,847</div>
              <div className="panel-stat-sub">Active employees · +124 this quarter</div>
            </div>

            <div className="panel-chart" aria-hidden="true">
              {[44, 58, 51, 68, 62, 76, 70, 84, 88, 80, 94, 100].map((h, i) => (
                <div
                  key={i}
                  className="bar"
                  style={{ height: `${h}%`, opacity: 0.3 + (i / 12) * 0.7 }}
                />
              ))}
            </div>

            <div className="panel-rows">
              <div className="panel-row">
                <div className="name">
                  <span className="avatar">A</span>
                  <span>Amara Okafor</span>
                </div>
                <span className="status ok">ONBOARDED</span>
              </div>
              <div className="panel-row">
                <div className="name">
                  <span className="avatar b">H</span>
                  <span>Henrik Vogt</span>
                </div>
                <span className="status">REVIEW · 17:00</span>
              </div>
              <div className="panel-row">
                <div className="name">
                  <span className="avatar c">M</span>
                  <span>Mira Saleh</span>
                </div>
                <span className="status ok">PAYROLL OK</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
