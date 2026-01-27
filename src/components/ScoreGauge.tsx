import './ScoreGauge.css'

interface Props {
  score: number
  size?: number
}

export default function ScoreGauge({ score, size = 120 }: Props) {
  const getColor = () => {
    if (score >= 80) return 'var(--success)'
    if (score >= 60) return 'var(--warning)'
    return 'var(--danger)'
  }

  const getGrade = () => {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  const circumference = 2 * Math.PI * 45
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="score-gauge" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100">
        <circle
          className="gauge-bg"
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
        />
        <circle
          className="gauge-fill"
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ stroke: getColor() }}
        />
      </svg>
      <div className="gauge-text">
        <span className="gauge-score">{score}</span>
        <span className="gauge-grade" style={{ color: getColor() }}>{getGrade()}</span>
      </div>
    </div>
  )
}
