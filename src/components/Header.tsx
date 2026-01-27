import { ClipboardCheck, Plus, LayoutDashboard, History } from 'lucide-react'
import './Header.css'

interface Props {
  onNewAudit: () => void
  onDashboard: () => void
  onHistory: () => void
  currentView: string
}

export default function Header({ onNewAudit, onDashboard, onHistory, currentView }: Props) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo" onClick={onDashboard}>
          <ClipboardCheck size={28} />
          <span>5S Audit</span>
        </div>
        
        <nav className="nav">
          <button 
            className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={onDashboard}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-btn ${currentView === 'history' ? 'active' : ''}`}
            onClick={onHistory}
          >
            <History size={18} />
            <span>History</span>
          </button>
          <button className="new-audit-btn" onClick={onNewAudit}>
            <Plus size={18} />
            <span>New Audit</span>
          </button>
        </nav>
      </div>
    </header>
  )
}
