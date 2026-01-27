import type { Assessment } from '../types'
import './TrendChart.css'

interface Props {
  assessments: Assessment[]
  height?: number
}

export default function TrendChart({ assessments, height = 200 }: Props) {
  if (assessments.length < 2) {
    return (
      <div className="trend-chart trend-empty">
        <p>Need at least 2 audits to show trends</p>
      </div>
    )
  }

  // Take last 10 assessments, reversed for chronological order
  const data = [...assessments].slice(0, 10).reverse()
  
  const width = 400
  const padding = { top: 20, right: 20, bottom: 40, left: 40 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const minScore = Math.min(...data.map(a => a.overall_score)) - 5
  const maxScore = Math.max(...data.map(a => a.overall_score)) + 5
  const scoreRange = maxScore - minScore

  const getX = (index: number) => padding.left + (index / (data.length - 1)) * chartWidth
  const getY = (score: number) => padding.top + chartHeight - ((score - minScore) / scoreRange) * chartHeight

  // Generate line path
  const linePath = data.map((a, i) => {
    const x = getX(i)
    const y = getY(a.overall_score)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  // Generate area path
  const areaPath = `${linePath} L ${getX(data.length - 1)} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`

  // Y-axis ticks
  const yTicks = [0, 25, 50, 75, 100].filter(t => t >= minScore && t <= maxScore)

  // Calculate trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2))
  const secondHalf = data.slice(Math.floor(data.length / 2))
  const firstAvg = firstHalf.reduce((sum, a) => sum + a.overall_score, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, a) => sum + a.overall_score, 0) / secondHalf.length
  const trend = secondAvg - firstAvg

  return (
    <div className="trend-chart">
      <div className="trend-header">
        <h4>Score Trend</h4>
        <span className={`trend-indicator ${trend >= 0 ? 'positive' : 'negative'}`}>
          {trend >= 0 ? '↗' : '↘'} {Math.abs(trend).toFixed(1)} pts
        </span>
      </div>
      
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yTicks.map(tick => (
          <g key={tick}>
            <line
              x1={padding.left}
              y1={getY(tick)}
              x2={width - padding.right}
              y2={getY(tick)}
              stroke="var(--border)"
              strokeDasharray="4,4"
              opacity="0.5"
            />
            <text
              x={padding.left - 8}
              y={getY(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fill="var(--text-muted)"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path
          d={areaPath}
          fill="var(--primary)"
          opacity="0.1"
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((a, i) => (
          <g key={a.id}>
            <circle
              cx={getX(i)}
              cy={getY(a.overall_score)}
              r="4"
              fill="var(--primary)"
              stroke="white"
              strokeWidth="2"
            />
            {/* X-axis labels for first and last */}
            {(i === 0 || i === data.length - 1) && (
              <text
                x={getX(i)}
                y={height - 10}
                textAnchor="middle"
                fontSize="9"
                fill="var(--text-muted)"
              >
                {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            )}
          </g>
        ))}
      </svg>

      <div className="trend-stats">
        <div className="trend-stat">
          <span className="stat-value">{data[data.length - 1].overall_score}</span>
          <span className="stat-label">Latest</span>
        </div>
        <div className="trend-stat">
          <span className="stat-value">{Math.round(data.reduce((s, a) => s + a.overall_score, 0) / data.length)}</span>
          <span className="stat-label">Average</span>
        </div>
        <div className="trend-stat">
          <span className="stat-value">{Math.max(...data.map(a => a.overall_score))}</span>
          <span className="stat-label">Best</span>
        </div>
      </div>
    </div>
  )
}
