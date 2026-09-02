import React from 'react'

const ITEMS = [
  'Onboarding',
  'Payroll',
  'Performance',
  'Time & Attendance',
  'Recruiting',
  'People Analytics',
  'Compliance',
  'Engagement',
  'Compensation',
  'Learning'
]

export default function Marquee() {
  const repeated = [...ITEMS, ...ITEMS]
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {repeated.map((item, i) => (
          <span className="marquee-item" key={i}>{item}</span>
        ))}
      </div>
    </div>
  )
}
