import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'

const STATS = [
  { value: 2400, suffix: '+',  accent: 'orange', label: 'Organisations placing their trust in Pugmark worldwide' },
  { value: 1.4,  suffix: 'M',  accent: 'green',  decimals: 1, label: 'Employees managed across our platform every day' },
  { value: 99.98, suffix: '%', accent: 'red',    decimals: 2, label: 'Uptime over the last twelve months · audited' },
  { value: 38,   suffix: ' min', accent: 'blue', label: 'Median onboarding time for a new employee record' }
]

function StatNum({ value, suffix = '', decimals = 0 }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obj = { v: 0 }
    const tween = gsap.to(obj, {
      v: value,
      duration: 2.2,
      ease: 'expo.out',
      scrollTrigger: undefined,
      onUpdate: () => {
        const formatted = decimals > 0
          ? obj.v.toFixed(decimals)
          : Math.round(obj.v).toLocaleString('en-US')
        el.textContent = formatted
      },
      paused: true
    })

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            tween.play()
            io.disconnect()
          }
        })
      },
      { threshold: 0.3 }
    )
    io.observe(el)

    return () => {
      io.disconnect()
      tween.kill()
    }
  }, [value, decimals])

  return (
    <>
      <span ref={ref}>0</span>
      <em>{suffix}</em>
    </>
  )
}

export default function Stats() {
  return (
    <section className="stats" id="evidence">
      <div className="container">
        <div className="section-head" style={{ marginBottom: 80 }}>
          <div>
            <span className="eyebrow">§ 03 — The evidence</span>
          </div>
          <div>
            <h2 className="display">
              Numbers, <em>not adjectives.</em>
            </h2>
          </div>
        </div>

        <div className="stats-grid">
          {STATS.map((s, i) => (
            <div className="stat" key={i} data-accent={s.accent}>
              <div className="stat-num display">
                <StatNum value={s.value} suffix={s.suffix} decimals={s.decimals || 0} />
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
