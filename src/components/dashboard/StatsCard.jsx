import React, { useState } from 'react'
import { Card } from 'antd'
import { useNavigate } from 'react-router-dom'

/**
 * Reusable Stats Card Component - Professional Dashboard Style
 * Displays a KPI with value, title, and a gradient icon chip.
 */
const StatsCard = ({
  title,
  value,
  icon,
  color = '#2563eb',
  onClick,
  suffix,
  prefix,
  precision,
  valueStyle = {},
  loading = false,
  ...props
}) => {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  const handleClick = () => {
    if (onClick) {
      if (typeof onClick === 'string') {
        navigate(onClick)
      } else {
        onClick()
      }
    }
  }

  const displayValue =
    typeof value === 'number' && precision !== undefined ? value.toFixed(precision) : value

  const clickable = !!onClick

  return (
    <Card
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      loading={loading}
      style={{
        cursor: clickable ? 'pointer' : 'default',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        borderRadius: 16,
        border: '1px solid #eef1f6',
        transform: hovered && clickable ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow:
          hovered && clickable
            ? '0 12px 28px rgba(15, 23, 42, 0.12)'
            : '0 2px 10px rgba(15, 23, 42, 0.06)',
      }}
      bodyStyle={{ padding: '20px 22px' }}
      {...props}
    >
      {/* left accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: `linear-gradient(180deg, ${color}, ${color}99)`,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              color: '#64748b',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.15,
              marginTop: 6,
              ...valueStyle,
            }}
          >
            {prefix}
            {displayValue}
            {suffix && (
              <span style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', marginLeft: 5 }}>
                {suffix}
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            width: 52,
            height: 52,
            flexShrink: 0,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 6px 16px ${color}45`,
          }}
        >
          <span style={{ fontSize: 24, color: '#fff' }}>{icon}</span>
        </div>
      </div>
    </Card>
  )
}

export default StatsCard
