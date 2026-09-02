import React, { useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import gsap from 'gsap'

function OrbitViz() {
  return (
    <div className="viz-orbit" aria-hidden="true">
      <div className="o-ring r3" />
      <div className="o-ring r2" />
      <div className="o-ring r1" />
      <div className="o-center" />
      <motion.div
        className="o-dot d1"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{ originX: 0, originY: 0 }}
      />
      <div className="o-dot d2" />
      <div className="o-dot d3" />
    </div>
  )
}

function BarsViz() {
  const heights = [38, 52, 44, 64, 58, 72, 68, 82, 88, 78, 94]
  return (
    <div className="viz-bars" aria-hidden="true">
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className={`b ${i === heights.length - 1 ? 'accent' : ''}`}
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: `${h}%`, transformOrigin: 'bottom' }}
        />
      ))}
    </div>
  )
}

function NodesViz() {
  return (
    <div className="viz-nodes" aria-hidden="true">
      <svg viewBox="0 0 300 130" preserveAspectRatio="none">
        <path d="M 30 14 Q 150 14 240 50" stroke="rgba(244,236,221,0.18)" strokeWidth="1" strokeDasharray="2 3" fill="none" />
        <path d="M 240 50 Q 200 90 120 116" stroke="rgba(212,165,116,0.5)" strokeWidth="1" fill="none" />
        <path d="M 120 116 Q 60 90 30 14" stroke="rgba(244,236,221,0.18)" strokeWidth="1" strokeDasharray="2 3" fill="none" />
      </svg>
      <span className="node n1">request</span>
      <span className="node n2">approved · 0.4s</span>
      <span className="node n3">payroll</span>
    </div>
  )
}

function NumberViz() {
  return (
    <div className="viz-number" aria-hidden="true">
      94<sup>%</sup>
    </div>
  )
}

export default function Features() {
  const ref = useRef(null)

  return (
    <section className="section" id="platform" ref={ref}>
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <span className="eyebrow">§ 01 — The platform</span>
          </div>
          <div>
            <h2>
              A complete suite,<br />
              <em>quietly composed.</em>
            </h2>
            <p style={{ marginTop: 24 }}>
              Four pillars. One coherent surface. Pugmark replaces the patchwork of point
              solutions with a single, considered system — designed for HR teams who refuse
              to compromise on craft.
            </p>
          </div>
        </motion.div>

        <div className="features-grid">
          <FeatureCard
            num="F.01"
            span="span-7"
            accent="orange"
            title={<>People <em>at the centre</em></>}
            body="An employee directory that earns its name. Profiles, org charts, and lifecycle events — all linked, all live, all designed."
            viz={<OrbitViz />}
          />

          <FeatureCard
            num="F.02"
            span="span-5"
            accent="green"
            title={<>Performance, <em>made visible</em></>}
            body="Quarterly check-ins, 360 reviews, and goal tracking, distilled into a single timeline per person."
            viz={<BarsViz />}
          />

          <FeatureCard
            num="F.03"
            span="span-5"
            accent="red"
            title={<>Payroll, <em>automated</em></>}
            body="Multi-country payroll runs that approve themselves. Reconciled, audited, and filed without manual intervention."
            viz={<NodesViz />}
          />

          <FeatureCard
            num="F.04"
            span="span-7"
            accent="blue"
            title={<>Engagement, <em>measured honestly</em></>}
            body="Pulse surveys with statistically meaningful sample sizes. Sentiment analysis that respects nuance. Reports your leadership will actually read."
            viz={<NumberViz />}
          />
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ num, span, accent, title, body, viz }) {
  return (
    <motion.div
      className={`feature-card ${span}`}
      data-accent={accent}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <div>
        <span className="feature-num">{num}</span>
        <h3 className="display">{title}</h3>
        <p>{body}</p>
      </div>
      <div className="feature-visual">{viz}</div>
    </motion.div>
  )
}
