import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import type { Assessment } from './types'
import Header from './components/Header'
import NewAudit from './components/NewAudit'
import AuditResults from './components/AuditResults'
import History from './components/History'
import Dashboard from './components/Dashboard'
import './App.css'

type View = 'dashboard' | 'new' | 'results' | 'history'

function App() {
  const [view, setView] = useState<View>('dashboard')
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadAssessments()
  }, [])

  const loadAssessments = async () => {
    const { data } = await supabase
      .from('assessments_5s')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setAssessments(data)
  }

  const handleNewAudit = () => {
    setCurrentAssessment(null)
    setView('new')
  }

  const handleAuditComplete = (assessment: Assessment) => {
    setCurrentAssessment(assessment)
    setAssessments(prev => [assessment, ...prev])
    setView('results')
  }

  const handleViewAssessment = (assessment: Assessment) => {
    setCurrentAssessment(assessment)
    setView('results')
  }

  return (
    <div className="app">
      <Header 
        onNewAudit={handleNewAudit}
        onDashboard={() => setView('dashboard')}
        onHistory={() => setView('history')}
        currentView={view}
      />
      
      <main className="main">
        {view === 'dashboard' && (
          <Dashboard 
            assessments={assessments} 
            onNewAudit={handleNewAudit}
            onViewAssessment={handleViewAssessment}
          />
        )}
        {view === 'new' && (
          <NewAudit 
            onComplete={handleAuditComplete}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}
        {view === 'results' && currentAssessment && (
          <AuditResults 
            assessment={currentAssessment}
            onBack={() => setView('dashboard')}
            onNewAudit={handleNewAudit}
          />
        )}
        {view === 'history' && (
          <History 
            assessments={assessments}
            onViewAssessment={handleViewAssessment}
          />
        )}
      </main>
    </div>
  )
}

export default App
