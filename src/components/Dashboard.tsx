import { ClipboardCheck, Plus } from 'lucide-react'
import type { Assessment } from '../types'
import ScoreGauge from './ScoreGauge'
import './Dashboard.css'

interface Props {
  assessments: Assessment[]
  onNewAudit: () => void
  onViewAssessment: (assessment: Assessment) => void
}

export default function Dashboard({ assessments, onNewAudit, onViewAssessment }: Props) {
  const latestAssessment = assessments[0]
  const averageScore = assessments.length > 0 
    ? Math.round(assessments.reduce((sum, a) => sum + a.overall_score, 0) / assessments.length)
    : 0

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

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>5S Dashboard</h1>
          <p>Track your workplace organization performance</p>
        </div>
        <button className="new-audit-btn-lg" onClick={onNewAudit}>
          <Plus size={20} />
          <span>New Audit</span>
        </button>
      </div>

      {assessments.length === 0 ? (
        <div className="empty-state">
          <ClipboardCheck size={64} />
          <h2>No audits yet</h2>
          <p>Start your first 5S workplace audit to see your scores and tracking</p>
          <button className="start-btn" onClick={onNewAudit}>
            Start First Audit
          </button>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Latest Score</div>
              <div className="stat-value" style={{ color: getScoreColor(latestAssessment.overall_score) }}>
                {latestAssessment.overall_score}
                <span className="grade">{getGrade(latestAssessment.overall_score)}</span>
              </div>
              <div className="stat-sub">{latestAssessment.workspace_name}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Average Score</div>
              <div className="stat-value" style={{ color: getScoreColor(averageScore) }}>
                {averageScore}
                <span className="grade">{getGrade(averageScore)}</span>
              </div>
              <div className="stat-sub">across {assessments.length} audit{assessments.length !== 1 ? 's' : ''}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Total Audits</div>
              <div className="stat-value">{assessments.length}</div>
              <div className="stat-sub">completed</div>
            </div>
          </div>

          {latestAssessment && (
            <div className="latest-section">
              <h2>Latest Assessment</h2>
              <div className="latest-card" onClick={() => onViewAssessment(latestAssessment)}>
                <div className="latest-scores">
                  <ScoreGauge score={latestAssessment.overall_score} size={140} />
                </div>
                <div className="latest-breakdown">
                  <h3>{latestAssessment.workspace_name}</h3>
                  <p className="audit-date">
                    {new Date(latestAssessment.created_at).toLocaleDateString()}
                  </p>
                  <div className="breakdown-bars">
                    {Object.entries(latestAssessment.scores).map(([key, score]) => (
                      <div key={key} className="bar-row">
                        <span className="bar-label">{formatLabel(key)}</span>
                        <div className="bar-track">
                          <div 
                            className="bar-fill" 
                            style={{ 
                              width: `${score}%`,
                              background: `var(--${key.replace('_', '-')})`
                            }} 
                          />
                        </div>
                        <span className="bar-value">{score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="recent-section">
            <h2>Recent Audits</h2>
            <div className="recent-list">
              {assessments.slice(0, 5).map(assessment => (
                <div 
                  key={assessment.id} 
                  className="recent-item"
                  onClick={() => onViewAssessment(assessment)}
                >
                  <div className="recent-info">
                    <div className="recent-name">{assessment.workspace_name}</div>
                    <div className="recent-date">
                      {new Date(assessment.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div 
                    className="recent-score"
                    style={{ color: getScoreColor(assessment.overall_score) }}
                  >
                    {assessment.overall_score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function formatLabel(key: string): string {
  return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
