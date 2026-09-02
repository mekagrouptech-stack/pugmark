import React from 'react'
import { motion } from 'framer-motion'

const STEPS = [
  {
    num: '01',
    title: <>Onboard <em>with intent</em></>,
    desc: 'Day-one workflows that prepare contracts, provision tooling, and assign a buddy — before the new hire opens their laptop.',
    meta: 'Avg. 3.4 days saved · per hire'
  },
  {
    num: '02',
    title: <>Manage <em>the lifecycle</em></>,
    desc: 'Promotions, transfers, leaves, and compensation reviews handled in one continuous record — never spreadsheets, never email threads.',
    meta: 'One record · cradle to alumni'
  },
  {
    num: '03',
    title: <>Engage <em>the workforce</em></>,
    desc: 'Pulse surveys, recognition, and learning paths woven into the day-to-day, not bolted on as a quarterly afterthought.',
    meta: '94% participation · industry avg. 41%'
  },
  {
    num: '04',
    title: <>Grow <em>the organisation</em></>,
    desc: 'Workforce planning, succession mapping, and headcount modelling — turned from quarterly board theatre into a continuous practice.',
    meta: '24 months · forward visibility'
  }
]

export default function Process() {
  return (
    <section className="section process" id="process">
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <span className="eyebrow">§ 02 — The arc</span>
          </div>
          <div>
            <h2>
              From first day,<br />
              <em>to fifteenth year.</em>
            </h2>
            <p style={{ marginTop: 24 }}>
              Pugmark shapes itself around the full arc of employment — not just the
              transactions, but the moments of meaning that compound into a career.
            </p>
          </div>
        </motion.div>

        <div className="process-list">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              className="process-row"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="process-num">{step.num}</span>
              <h3 className="process-title display">{step.title}</h3>
              <p className="process-desc">{step.desc}</p>
              <span className="process-meta">{step.meta}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
