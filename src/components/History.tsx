import type { Assessment } from '../types'
import { Calendar } from 'lucide-react'
import './History.css'

interface Props {
  assessments: Assessment[]
  onViewAssessment: (assessment: Assessment) => void
}

export default function History({ assessments, onViewAssessment }: Props) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--success)'
    if (score >= 60) return 'var(--warning)'
    return 'var(--danger)'
  }

  const getGrade = (score: number) => {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  // Group by month
  const groupedByMonth = assessments.reduce((groups, assessment) => {
    const date = new Date(assessment.created_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!groups[key]) groups[key] = []
    groups[key].push(assessment)
    return groups
  }, {} as Record<string, Assessment[]>)

  const formatMonth = (key: string) => {
    const [year, month] = key.split('-')
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  return (
    <div className="history">
      <div className="history-header">
        <h1>Audit History</h1>
        <p>{assessments.length} total assessment{assessments.length !== 1 ? 's' : ''}</p>
      </div>

      {assessments.length === 0 ? (
        <div className="empty-history">
          <p>No audits recorded yet</p>
        </div>
      ) : (
        <div className="history-timeline">
          {Object.entries(groupedByMonth).map(([month, monthAssessments]) => (
            <div key={month} className="month-group">
              <h2 className="month-label">{formatMonth(month)}</h2>
              <div className="month-items">
                {monthAssessments.map(assessment => (
                  <div 
                    key={assessment.id}
                    className="history-item"
                    onClick={() => onViewAssessment(assessment)}
                  >
                    <div 
                      className="history-score"
                      style={{ color: getScoreColor(assessment.overall_score) }}
                    >
                      {assessment.overall_score}
                      <span className="history-grade">{getGrade(assessment.overall_score)}</span>
                    </div>
                    <div className="history-details">
                      <div className="history-name">{assessment.workspace_name}</div>
                      <div className="history-meta">
                        <span>
                          <Calendar size={14} />
                          {new Date(assessment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="history-mini-scores">
                      {Object.entries(assessment.scores).map(([key, score]) => (
                        <div key={key} className="mini-score">
                          <div 
                            className="mini-bar"
                            style={{ 
                              height: `${score}%`,
                              background: `var(--${key.replace('_', '-')})`
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
