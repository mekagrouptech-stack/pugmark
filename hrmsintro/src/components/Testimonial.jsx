import React from 'react'
import { motion } from 'framer-motion'

export default function Testimonial() {
  return (
    <section className="testimonial section" id="clients">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="eyebrow" style={{ marginBottom: 40, display: 'inline-flex' }}>
            § 04 — From a director of people
          </span>

          <blockquote className="t-quote display">
            <span className="mark">“</span>
            We had spent a decade collecting HR tools the way some companies collect
            office furniture — accidentally. Pugmark gave us back the discipline of a
            single source of truth, and the dignity of an interface our team actually
            wants to open in the morning.
          </blockquote>

          <div className="t-attribution">
            <div className="t-avatar">EM</div>
            <div>
              <div className="t-name">Elena Marchetti</div>
              <div className="t-role">Chief People Officer · Lumenstein Group</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
