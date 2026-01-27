import { useState, useCallback } from 'react'
import { Upload, X, Camera, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Assessment, AnalysisResult } from '../types'
import './NewAudit.css'

interface Props {
  onComplete: (assessment: Assessment) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export default function NewAudit({ onComplete, isLoading, setIsLoading }: Props) {
  const [workspaceName, setWorkspaceName] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    addFiles(droppedFiles)
  }, [])

  const addFiles = (newFiles: File[]) => {
    const combined = [...files, ...newFiles].slice(0, 4)
    setFiles(combined)
    
    // Create previews
    combined.forEach((file, i) => {
      if (!previews[i]) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviews(prev => {
            const newPreviews = [...prev]
            newPreviews[i] = e.target?.result as string
            return newPreviews
          })
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!workspaceName.trim()) {
      setError('Please enter a workspace name')
      return
    }
    if (files.length === 0) {
      setError('Please upload at least one image')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Convert images to base64
      const base64Images = await Promise.all(
        files.map(file => new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            // Remove data URL prefix for API
            resolve(result.split(',')[1])
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        }))
      )

      // Call edge function
      const { data, error: fnError } = await supabase.functions.invoke('analyze-5s', {
        body: { images: base64Images, workspace_name: workspaceName }
      })

      if (fnError) throw fnError

      const result = data as AnalysisResult

      // Upload images to storage
      const imageUrls: string[] = []
      for (const file of files) {
        const fileName = `${Date.now()}-${file.name}`
        const { data: uploadData } = await supabase.storage
          .from('5s-images')
          .upload(fileName, file)
        
        if (uploadData) {
          const { data: urlData } = supabase.storage.from('5s-images').getPublicUrl(fileName)
          imageUrls.push(urlData.publicUrl)
        }
      }

      // Save assessment
      const { data: assessment, error: saveError } = await supabase
        .from('assessments_5s')
        .insert([{
          workspace_name: workspaceName,
          images: imageUrls,
          scores: result.scores,
          findings: result.findings,
          recommendations: result.recommendations,
          overall_score: result.overall_score
        }])
        .select()
        .single()

      if (saveError) throw saveError

      onComplete(assessment)
    } catch (err) {
      console.error('Analysis failed:', err)
      setError('Failed to analyze images. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="new-audit">
      <div className="audit-header">
        <h1>New 5S Audit</h1>
        <p>Upload photos of your workspace for AI-powered 5S assessment</p>
      </div>

      <div className="audit-form">
        <div className="form-group">
          <label htmlFor="workspace">Workspace Name</label>
          <input
            id="workspace"
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="e.g., Assembly Line A, Warehouse Zone 3"
          />
        </div>

        <div 
          className={`drop-zone ${isDragging ? 'dragging' : ''} ${files.length > 0 ? 'has-files' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {files.length === 0 ? (
            <>
              <Camera size={48} />
              <h3>Drop workspace photos here</h3>
              <p>or click to browse (max 4 images)</p>
            </>
          ) : (
            <div className="preview-grid">
              {previews.map((preview, i) => (
                <div key={i} className="preview-item">
                  <img src={preview} alt={`Preview ${i + 1}`} />
                  <button className="remove-btn" onClick={() => removeFile(i)}>
                    <X size={16} />
                  </button>
                </div>
              ))}
              {files.length < 4 && (
                <div className="add-more">
                  <Upload size={24} />
                  <span>Add more</span>
                </div>
              )}
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
            className="file-input"
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button 
          className="submit-btn" 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="spinner" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <ClipboardCheck size={20} />
              <span>Run 5S Audit</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function ClipboardCheck(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <path d="m9 14 2 2 4-4"/>
    </svg>
  )
}
