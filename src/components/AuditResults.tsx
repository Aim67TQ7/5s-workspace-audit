import { ArrowLeft, RefreshCw } from 'lucide-react'
import type { Assessment } from '../types'
import ScoreGauge from './ScoreGauge'
import './AuditResults.css'

interface Props {
  assessment: Assessment
  onBack: () => void
  onNewAudit: () => void
}

const categoryColors: Record<string, string> = {
  sort: 'var(--sort)',
  set_in_order: 'var(--set-in-order)',
  shine: 'var(--shine)',
  standardize: 'var(--standardize)',
  sustain: 'var(--sustain)',
}

const categoryDescriptions: Record<string, string> = {
  sort: 'Remove unnecessary items from the workspace',
  set_in_order: 'Organize remaining items for easy access',
  shine: 'Clean and inspect the workspace regularly',
  standardize: 'Create standards for organization and cleanliness',
  sustain: 'Maintain and continuously improve standards',
}

export default function AuditResults({ assessment, onBack, onNewAudit }: Props) {
  const formatCategory = (key: string) => 
    key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return (
    <div className="audit-results">
      <div className="results-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="results-actions">
          <button className="action-btn" onClick={onNewAudit}>
            <RefreshCw size={18} />
            <span>New Audit</span>
          </button>
        </div>
      </div>

      <div className="results-title">
        <h1>{assessment.workspace_name}</h1>
        <p>{new Date(assessment.created_at).toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })}</p>
      </div>

      <div className="results-grid">
        <div className="overall-section">
          <ScoreGauge score={assessment.overall_score} size={180} />
          <h2>Overall Score</h2>
        </div>

        <div className="breakdown-section">
          <h3>Category Breakdown</h3>
          <div className="category-list">
            {Object.entries(assessment.scores).map(([key, score]) => (
              <div key={key} className="category-item">
                <div className="category-header">
                  <div 
                    className="category-dot"
                    style={{ background: categoryColors[key] }}
                  />
                  <span className="category-name">{formatCategory(key)}</span>
                  <span 
                    className="category-score"
                    style={{ color: categoryColors[key] }}
                  >
                    {score}
                  </span>
                </div>
                <div className="category-bar">
                  <div 
                    className="category-fill"
                    style={{ 
                      width: `${score}%`,
                      background: categoryColors[key]
                    }}
                  />
                </div>
                <p className="category-desc">{categoryDescriptions[key]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {assessment.images && assessment.images.length > 0 && (
        <div className="images-section">
          <h3>Assessed Images</h3>
          <div className="images-grid">
            {assessment.images.map((url, i) => (
              <img key={i} src={url} alt={`Workspace ${i + 1}`} />
            ))}
          </div>
        </div>
      )}

      <div className="findings-section">
        <h3>Detailed Findings</h3>
        {Object.entries(assessment.findings).map(([key, findings]) => (
          findings.length > 0 && (
            <div key={key} className="findings-category">
              <div className="findings-header">
                <div 
                  className="category-dot"
                  style={{ background: categoryColors[key] }}
                />
                <span>{formatCategory(key)}</span>
              </div>
              <ul className="findings-list">
                {findings.map((finding: { observation: string; location?: string; severity: string }, i: number) => (
                  <li key={i} className={`finding-item severity-${finding.severity}`}>
                    <span className="finding-text">{finding.observation}</span>
                    {finding.location && (
                      <span className="finding-location">📍 {finding.location}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )
        ))}
      </div>

      {assessment.recommendations && assessment.recommendations.length > 0 && (
        <div className="recommendations-section">
          <h3>Recommendations</h3>
          <ul className="recommendations-list">
            {assessment.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
