import React from 'react'
import { motion } from 'framer-motion'

export default function CTA() {
  return (
    <section className="cta" id="cta">
      <span className="cta-deco" aria-hidden="true">p</span>

      <motion.div
        className="container cta-content"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="eyebrow" style={{ marginBottom: 36, display: 'inline-flex' }}>
          § 05 — A standing invitation
        </span>

        <h2 className="display">
          Bring your<br />
          <em>workforce</em> home.
        </h2>

        <p>
          A private demonstration with our team, tailored to the shape of your
          organisation. Forty-five minutes. No deck. Just the product.
        </p>

        <div className="cta-actions">
          <a href="#" className="btn-primary">
            <span>Request a demonstration</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
          </a>
          <a href="#" className="btn-ghost">
            <span>Or — read the pricing letter</span>
          </a>
        </div>
      </motion.div>
    </section>
  )
}
