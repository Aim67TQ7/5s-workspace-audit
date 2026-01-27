import type { ScoreBreakdown } from '../types'
import './RadarChart.css'

interface Props {
  scores: ScoreBreakdown
  size?: number
  showLabels?: boolean
}

const categories = [
  { key: 'sort', label: 'Sort', angle: -90 },
  { key: 'set_in_order', label: 'Set in Order', angle: -18 },
  { key: 'sustain', label: 'Sustain', angle: 54 },
  { key: 'standardize', label: 'Standardize', angle: 126 },
  { key: 'shine', label: 'Shine', angle: 198 },
] as const

export default function RadarChart({ scores, size = 300, showLabels = true }: Props) {
  const center = size / 2
  const maxRadius = (size / 2) - 40

  const polarToCartesian = (angle: number, radius: number) => {
    const radian = (angle * Math.PI) / 180
    return {
      x: center + radius * Math.cos(radian),
      y: center + radius * Math.sin(radian)
    }
  }

  // Generate grid rings (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [20, 40, 60, 80, 100]
  
  // Generate polygon points for scores
  const getScorePoints = () => {
    return categories.map(cat => {
      const score = scores[cat.key as keyof ScoreBreakdown] || 0
      const radius = (score / 100) * maxRadius
      return polarToCartesian(cat.angle, radius)
    })
  }

  const scorePoints = getScorePoints()
  const scorePath = scorePoints.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ') + ' Z'

  // Grid lines (spokes)
  const spokes = categories.map(cat => {
    const end = polarToCartesian(cat.angle, maxRadius)
    return { start: { x: center, y: center }, end, label: cat.label, angle: cat.angle }
  })

  // Grid polygons
  const gridPolygons = gridLevels.map(level => {
    const radius = (level / 100) * maxRadius
    const points = categories.map(cat => polarToCartesian(cat.angle, radius))
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
  })

  return (
    <div className="radar-chart">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {gridPolygons.map((path, i) => (
          <path
            key={i}
            d={path}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
            opacity={0.3 + i * 0.1}
          />
        ))}

        {/* Spokes */}
        {spokes.map((spoke, i) => (
          <line
            key={i}
            x1={spoke.start.x}
            y1={spoke.start.y}
            x2={spoke.end.x}
            y2={spoke.end.y}
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.5"
          />
        ))}

        {/* Score polygon fill */}
        <path
          d={scorePath}
          fill="var(--primary)"
          fillOpacity="0.25"
          stroke="var(--primary)"
          strokeWidth="2"
        />

        {/* Score points */}
        {scorePoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="var(--primary)"
            stroke="white"
            strokeWidth="2"
          />
        ))}

        {/* Labels */}
        {showLabels && spokes.map((spoke, i) => {
          const labelRadius = maxRadius + 25
          const pos = polarToCartesian(spoke.angle, labelRadius)
          const score = scores[categories[i].key as keyof ScoreBreakdown] || 0
          
          return (
            <g key={i}>
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="radar-label"
                fontSize="12"
                fill="var(--text)"
              >
                {spoke.label}
              </text>
              <text
                x={pos.x}
                y={pos.y + 14}
                textAnchor="middle"
                dominantBaseline="middle"
                className="radar-score"
                fontSize="11"
                fill="var(--text-muted)"
                fontWeight="600"
              >
                {score}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
