import React from 'react'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img src="/pugmark-mark.svg" alt="" width="44" height="44" style={{ display: 'block' }} />
              <span>pugmark</span>
              <span className="mono" style={{ fontSize: 13, color: 'var(--paper-3)', letterSpacing: '0.18em', marginLeft: 2 }}>HRMS</span>
            </div>
            <p className="footer-tag" style={{ marginTop: 20 }}>
              Workforce management for organisations that take their people seriously.
              Four pillars. One platform. Every paw print accounted for.
            </p>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><a href="#">Onboarding</a></li>
              <li><a href="#">Payroll</a></li>
              <li><a href="#">Performance</a></li>
              <li><a href="#">Analytics</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Trust</h4>
            <ul>
              <li><a href="#">Security</a></li>
              <li><a href="#">Compliance</a></li>
              <li><a href="#">SOC 2 · ISO 27001</a></li>
              <li><a href="#">Status</a></li>
            </ul>
          </div>
        </div>

        <div className="developed-by">
          <span className="dev-label">Developed by</span>
          <div className="dev-badges">
            <a className="dev-badge dev-badge-ba" href="#" aria-label="Ba — element 56">
              <span className="dev-num">56</span>
              <span className="dev-sym">Ba</span>
            </a>
            <a className="dev-badge dev-badge-na" href="#" aria-label="Na — element 11">
              <span className="dev-num">11</span>
              <span className="dev-sym">Na</span>
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Pugmark Systems — All rights reserved.</span>
          <span>Crafted with intent · v 4.2</span>
        </div>
      </div>
    </footer>
  )
}
