export interface Assessment {
  id: string
  workspace_name: string
  images: string[]
  scores: ScoreBreakdown
  findings: Findings
  recommendations: string[]
  overall_score: number
  created_at: string
}

export interface ScoreBreakdown {
  sort: number
  set_in_order: number
  shine: number
  standardize: number
  sustain: number
}

export interface Findings {
  sort: Finding[]
  set_in_order: Finding[]
  shine: Finding[]
  standardize: Finding[]
  sustain: Finding[]
}

export interface Finding {
  observation: string
  location: string
  severity: 'minor' | 'moderate' | 'major'
}

export interface AnalysisResult {
  scores: ScoreBreakdown
  findings: Findings
  recommendations: string[]
  overall_score: number
  summary: string
}
