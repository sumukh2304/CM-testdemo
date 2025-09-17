import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getGenres, createGenre, getLanguages, createLanguage, createContent, createStreaming, getCreatorAnalytics, getPresignedUpload, getCreatorApproval } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import SiteFooter from '../../components/SiteFooter'
import SiteHeader from '../../components/SiteHeader'
import Toast from '../../components/Toast'
import './Creator.css'

export default function Creator() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [myContent, setMyContent] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null)
  const [activeTab, setActiveTab] = useState<'upload' | 'content' | 'analytics'>('upload')
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    type: 'movie',
    genreId: '',
    newGenre: '',
    langId: '',
    newLang: '',
    duration: '',
    ageRating: 'PG',
    thumbnailUrl: ''
  })
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [genres, setGenres] = useState<Array<{ genreId: string; genre: string }>>([])
  const [languages, setLanguages] = useState<Array<{ langId: string; lang: string }>>([])
  const [analytics, setAnalytics] = useState<any | null>(null)

  // Upload a file to S3 via backend presigned URL
  const uploadToS3 = async (type: 'video' | 'thumbnail', file: File): Promise<string> => {
    const presign = await getPresignedUpload(type, file.name, file.type || 'application/octet-stream')
    await fetch(presign.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    return presign.publicUrl as string
  }

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      navigate('/login')
      return
    }
    
    if (user.role !== 'creator') {
      navigate('/home')
      return
    }
    
    // Ensure creator is approved before allowing access
    (async () => {
      try {
        const approval = await getCreatorApproval(user.userId)
        if ((approval?.approved || '').toString().toLowerCase() !== 'yes') {
          setToast({ message: 'Your creator account is not approved yet.', type: 'error' })
          navigate('/home')
          return
        }
      } catch (e) {
        console.warn('Failed to fetch creator approval, denying access by default', e)
        setToast({ message: 'Unable to verify creator approval. Please try again later.', type: 'error' })
        navigate('/home')
        return
      }

      // Only load data after approval check passes
      loadMyContent()
      loadMetadata()
      loadAnalytics()
    })()
  }, [navigate, user, authLoading])

  const loadMetadata = async () => {
    try {
      const [g, l] = await Promise.all([getGenres(), getLanguages()])
      setGenres(g.genres || [])
      setLanguages(l.languages || [])
    } catch (e) {
      console.warn('Failed to load metadata', e)
    }
  }

  const loadAnalytics = async () => {
    try {
      if (!user) return
      const data = await getCreatorAnalytics(user.userId, 28)
      setAnalytics(data)
    } catch (e) {
      console.warn('Failed to load analytics', e)
    }
  }

  const loadMyContent = async () => {
    setLoading(true)
    try {
      if (!user) return
      
      const response = await api.get('/content', { 
        params: { uploadedBy: user.userId, limit: 100 } 
      })
      setMyContent(response.data?.content || [])
    } catch (err: any) {
      console.error('Failed to load content:', err)
      setToast({ message: 'Failed to load your content', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      let genreId = uploadForm.genreId
      if (!genreId && uploadForm.newGenre.trim()) {
        const g = await createGenre(uploadForm.newGenre.trim())
        genreId = g.genreId
      }

      let langId = uploadForm.langId
      if (!langId && uploadForm.newLang.trim()) {
        const l = await createLanguage(uploadForm.newLang.trim())
        langId = l.langId
      }

      const payload: any = {
        title: uploadForm.title,
        type: uploadForm.type,
        status: 'draft',
        uploadedBy: user.userId,
        ageRating: uploadForm.ageRating,
        duration: uploadForm.duration,
        thumbnailUrl: uploadForm.thumbnailUrl,
        genreId: genreId || undefined,
        langId: langId || undefined,
      }

      const created = await createContent(payload)
      const contentId = created?.content?.contentId
      // Per request: Do not save the uploaded video URL into DB/streaming. Only upload to S3.
      
      setToast({ message: 'Content uploaded successfully! Awaiting admin approval.', type: 'success' })
      setUploadForm({
        title: '',
        type: 'movie',
        genreId: '',
        newGenre: '',
        langId: '',
        newLang: '',
        duration: '',
        ageRating: 'PG',
        thumbnailUrl: ''
      })
      setVideoUrl('')
      setCurrentStep(1)
      setActiveTab('content')
      loadMyContent()
      loadAnalytics()
    } catch (err: any) {
      console.error('Failed to upload content:', err)
      setToast({ message: 'Failed to upload content', type: 'error' })
    }
  }

  const deleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return
    
    try {
      await api.delete(`/content/${contentId}`)
      setMyContent(myContent.filter(c => c.contentId !== contentId))
      setToast({ message: 'Content deleted successfully', type: 'success' })
    } catch (err: any) {
      console.error('Failed to delete content:', err)
      setToast({ message: 'Failed to delete content', type: 'error' })
    }
  }

  return (
    <div className="creator-studio">
      <SiteHeader mode="creator" />
      {toast && <Toast {...toast} />}

      <main>
        {/* Hero Section */}
        <div className="creator-hero">
          <div className="main-container">
            <h1 className="fade-in">Creator Studio</h1>
            <p className="fade-in">Upload, manage, and analyze your content with professional tools designed for creators</p>
          </div>
        </div>

        <div className="main-container">
          {/* Navigation Tabs */}
          <div className="nav-tabs-container">
            <div className="nav-tabs">
              {[
                { key: 'upload', label: 'Upload', icon: '📤', desc: 'Create new content' },
                { key: 'content', label: 'My Content', icon: '🎬', desc: 'Manage library', count: myContent.length },
                { key: 'analytics', label: 'Analytics', icon: '📊', desc: 'View performance' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
                >
                  <span className="nav-tab-icon">{tab.icon}</span>
                  <div className="nav-tab-content">
                    <div className="nav-tab-label">{tab.label}</div>
                    <div className="nav-tab-desc">{tab.desc}</div>
                  </div>
                  {tab.count !== null && tab.count !== undefined && tab.count > 0 && (
                    <span className="nav-tab-count">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="content-card fade-in">
              <div className="card-header">
                <div>
                  <h2>Upload New Content</h2>
                  <p>Step {currentStep} of 2: {currentStep === 1 ? 'Content Details' : 'Review & Publish'}</p>
                </div>
                <div className="progress-container">
                  <div className="progress-label">Progress</div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                        style={{ width: `${(currentStep / 2) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="form-container">
                {currentStep === 1 && (
                  <form onSubmit={(e) => { e.preventDefault(); setCurrentStep(2) }} className="slide-in">
                    <div className="form-grid">
                      <div className="form-section">
                        <div className="form-group">
                          <label className="form-label">Content Title *</label>
                          <input
                            type="text"
                            required
                            className="form-input"
                            placeholder="Enter a compelling title for your content"
                            value={uploadForm.title}
                            onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                          <div className="form-group">
                            <label className="form-label">Content Type</label>
                            <select
                              className="form-select"
                              value={uploadForm.type}
                              onChange={(e) => setUploadForm({...uploadForm, type: e.target.value})}
                            >
                              <option value="movie">🎬 Movie</option>
                              <option value="series">📺 TV Series</option>
                              <option value="short">🎞️ Short Film</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Age Rating</label>
                            <select
                              className="form-select"
                              value={uploadForm.ageRating}
                              onChange={(e) => setUploadForm({...uploadForm, ageRating: e.target.value})}
                            >
                              <option value="G">G - General Audiences</option>
                              <option value="PG">PG - Parental Guidance</option>
                              <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                              <option value="R">R - Restricted</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                          <div className="form-group">
                            <label className="form-label">Genre</label>
                            <select
                              className="form-select"
                              value={uploadForm.genreId}
                              onChange={(e) => setUploadForm({ ...uploadForm, genreId: e.target.value })}
                            >
                              <option value="">Select existing genre</option>
                              {genres.map(g => (<option key={g.genreId} value={g.genreId}>{g.genre}</option>))}
                            </select>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Or create new genre"
                              value={uploadForm.newGenre}
                              onChange={(e) => setUploadForm({ ...uploadForm, newGenre: e.target.value })}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Language</label>
                            <select
                              className="form-select"
                              value={uploadForm.langId}
                              onChange={(e) => setUploadForm({ ...uploadForm, langId: e.target.value })}
                            >
                              <option value="">Select existing language</option>
                              {languages.map(l => (<option key={l.langId} value={l.langId}>{l.lang}</option>))}
                            </select>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Or create new language"
                              value={uploadForm.newLang}
                              onChange={(e) => setUploadForm({ ...uploadForm, newLang: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Duration</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., 120 minutes or 2h 30m"
                            value={uploadForm.duration}
                            onChange={(e) => setUploadForm({...uploadForm, duration: e.target.value})}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Thumbnail</label>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <input
                                type="url"
                                className="form-input"
                                placeholder="https://your-cdn.com/thumbnail.webp"
                                value={uploadForm.thumbnailUrl}
                                onChange={(e) => setUploadForm({...uploadForm, thumbnailUrl: e.target.value})}
                              />
                            </div>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="file"
                                id="thumbnail-upload"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return
                                  try {
                                    setLoading(true)
                                    const s3Url = await uploadToS3('thumbnail', file)
                                    setUploadForm({ ...uploadForm, thumbnailUrl: s3Url })
                                    setToast({ message: 'Thumbnail uploaded to S3', type: 'success' })
                                  } catch (err) {
                                    console.error('Thumbnail upload failed', err)
                                    setToast({ message: 'Thumbnail upload failed', type: 'error' })
                                  } finally {
                                    setLoading(false)
                                  }
                                }}
                              />
                              <label
                                htmlFor="thumbnail-upload"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  padding: '1rem 1.5rem',
                                  backgroundColor: '#CC5500',
                                  color: 'white',
                                  borderRadius: '12px',
                                  cursor: 'pointer',
                                  fontWeight: '600',
                                  fontSize: '0.875rem',
                                  transition: 'all 0.3s ease',
                                  border: 'none'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.backgroundColor = '#a34400'
                                  e.currentTarget.style.transform = 'translateY(-2px)'
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor = '#CC5500'
                                  e.currentTarget.style.transform = 'translateY(0)'
                                }}
                              >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Upload
                              </label>
                            </div>
                          </div>
                          {uploadForm.thumbnailUrl && (
                            <div style={{ marginTop: '1rem', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
                              <img 
                                src={uploadForm.thumbnailUrl} 
                                alt="Thumbnail preview" 
                                style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Single Video Upload (S3) */}
                        <div className="form-group">
                          <label className="form-label">Video</label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
                            <input
                              type="url"
                              className="form-input"
                              placeholder={`https://s3.amazonaws.com/your-video-bucket/uploads/videos/<file>.m3u8`}
                              value={videoUrl}
                              onChange={(e) => setVideoUrl(e.target.value)}
                            />
                            <div>
                              <input
                                type="file"
                                id={`video-upload-single`}
                                accept="video/*,application/vnd.apple.mpegurl,.m3u8"
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return
                                  try {
                                    setLoading(true)
                                    const s3Url = await uploadToS3('video', file)
                                    setVideoUrl(s3Url)
                                    setToast({ message: `Video uploaded to S3`, type: 'success' })
                                  } catch (err) {
                                    console.error(`Video upload failed`, err)
                                    setToast({ message: `Video upload failed`, type: 'error' })
                                  } finally {
                                    setLoading(false)
                                  }
                                }}
                              />
                              <label
                                htmlFor={`video-upload-single`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  padding: '0.8rem 1rem',
                                  backgroundColor: '#708238',
                                  color: 'white',
                                  borderRadius: '12px',
                                  cursor: 'pointer',
                                  fontWeight: '600',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.3s ease',
                                  border: 'none'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.backgroundColor = '#5c6d2f'
                                  e.currentTarget.style.transform = 'translateY(-2px)'
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor = '#708238'
                                  e.currentTarget.style.transform = 'translateY(0)'
                                }}
                              >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Upload Video
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="tips-sidebar">
                        <div className="tips-header">
                          <span style={{ fontSize: '1.5rem' }}>💡</span>
                          <h3>Upload Tips</h3>
                        </div>
                        <div className="tips-list">
                          <div className="tip-item">
                            <div className="tip-icon">🎨</div>
                            <div className="tip-content">
                              <h4>High-Quality Thumbnail</h4>
                              <p>Use 16:9 aspect ratio, minimum 1280×720px. Upload from your device or use a URL</p>
                            </div>
                          </div>
                          <div className="tip-item">
                            <div className="tip-icon">📝</div>
                            <div className="tip-content">
                              <h4>Accurate Metadata</h4>
                              <p>Choose correct type, genre, and language for better discovery</p>
                            </div>
                          </div>
                          <div className="tip-item">
                            <div className="tip-icon">📤</div>
                            <div className="tip-content">
                              <h4>Quick Upload</h4>
                              <p>Fill in the details and review - video URLs can be added later</p>
                            </div>
                          </div>
                          <div className="tip-item">
                            <div className="tip-icon">✅</div>
                            <div className="tip-content">
                              <h4>Admin Approval</h4>
                              <p>Content will be approved by admin. Choose the options correctly and upload the video correctly.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="button-group">
                      <button
                        type="button"
                        onClick={() => { 
                          setUploadForm({ title: '', type: 'movie', genreId: '', newGenre: '', langId: '', newLang: '', duration: '', ageRating: 'PG', thumbnailUrl: '' }); 
                        }}
                        style={{
                          padding: '0.875rem 1.5rem',
                          borderRadius: '12px',
                          fontWeight: '600',
                          fontSize: '0.875rem',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          backgroundColor: '#CC5500',
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#b91c1c'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(220, 38, 38, 0.4)'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#CC5500'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)'
                        }}
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reset Form
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                      >
                        Next: Review & Publish
                        <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </form>
                )}

                {currentStep === 2 && (
                  <div className="slide-in">
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#1f2937', margin: '0 0 0.5rem 0' }}>Review Your Content</h3>
                      <p style={{ color: '#6b7280', margin: '0' }}>Double-check everything before publishing</p>
                    </div>

                    <div className="review-grid">
                      <div className="review-card" style={{ gridColumn: '1 / -1', maxWidth: '800px', margin: '0 auto' }}>
                        <div className="review-card-header">
                          <span style={{ fontSize: '1.5rem' }}>📝</span>
                          <h4>Content Details</h4>
                        </div>
                        <div className="review-list">
                          {[
                            { label: 'Title', value: uploadForm.title || 'Not provided' },
                            { label: 'Type', value: uploadForm.type },
                            { label: 'Duration', value: uploadForm.duration || 'Not specified' },
                            { label: 'Age Rating', value: uploadForm.ageRating },
                            { label: 'Genre', value: uploadForm.newGenre || genres.find(g => g.genreId === uploadForm.genreId)?.genre || 'Not specified' },
                            { label: 'Language', value: uploadForm.newLang || languages.find(l => l.langId === uploadForm.langId)?.lang || 'Not specified' },
                          ].map(({ label, value }) => (
                            <div key={label} className="review-item">
                              <span className="review-label">{label}:</span>
                              <span className="review-value">{value}</span>
                            </div>
                          ))}
                        </div>
                        {uploadForm.thumbnailUrl && (
                          <div style={{ marginTop: '1.5rem' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.75rem' }}>Thumbnail Preview:</div>
                            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
                              <img 
                                src={uploadForm.thumbnailUrl} 
                                alt="Thumbnail preview" 
                                style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                              />
                            </div>
                          </div>
                        )}
                        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#dbeafe', border: '2px solid #93c5fd', borderRadius: '12px' }}>
                          <div style={{ fontSize: '0.875rem', color: '#1e40af' }}>
                            <strong>Note:</strong> Your content will be submitted for review before going live. You can add video URLs later through the content management system.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="button-group">
                      <button
                        onClick={() => setCurrentStep(1)}
                        style={{
                          padding: '0.875rem 1.5rem',
                          borderRadius: '12px',
                          fontWeight: '600',
                          fontSize: '0.875rem',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          backgroundColor: '#CC5500',
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#b91c1c'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(220, 38, 38, 0.4)'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#CC5500'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)'
                        }}
                      >
                        <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Details
                      </button>
                      <form onSubmit={handleUpload} style={{ display: 'inline' }}>
                        <button
                          type="submit"
                          className="btn btn-success"
                        >
                          <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Publish Content
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="content-card fade-in">
              <div className="card-header">
                <div>
                  <h2 className="library-title">My Content Library</h2>
                  <p className="library-subtitle">{myContent.length} content {myContent.length === 1 ? 'item' : 'items'}</p>
                </div>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="btn btn-primary"
                >
                  <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Upload
                </button>
              </div>

              <div className="content-library">
                {loading ? (
                  <div className="empty-state">
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60px' }}>
                      <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTop: '4px solid #CC5500', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    </div>
                    <p style={{ color: '#6b7280', margin: '1rem 0 0 0' }}>Loading your content...</p>
                  </div>
                ) : myContent.length > 0 ? (
                  <div className="content-grid">
                    {myContent.map((item) => (
                      <div key={item.contentId} className="content-item">
                        <div style={{ position: 'relative' }}>
                          {item.thumbnailUrl ? (
                            <img 
                              src={item.thumbnailUrl} 
                              alt={item.title} 
                              className="content-thumbnail"
                            />
                          ) : (
                            <div className="content-placeholder">🎬</div>
                          )}
                          <div className={`content-status ${item.status}`}>
                            {item.status}
                          </div>
                        </div>
                        <div className="content-info">
                          <h3 className="content-title">{item.title}</h3>
                          <div className="content-meta">
                            <div className="content-meta-item">
                              <span className="capitalize">{item.type}</span>
                              {item.genre && (
                                <>
                                  <span>•</span>
                                  <span>{item.genre}</span>
                                </>
                              )}
                            </div>
                            <div className="content-meta-item">
                              <span>{item.duration || 'No duration'}</span>
                              {item.ageRating && (
                                <>
                                  <span>•</span>
                                  <span>{item.ageRating}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="content-actions">
                            <button
                              onClick={() => deleteContent(item.contentId)}
                              className="btn-delete"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🎬</div>
                    <h3 className="empty-title">No content yet</h3>
                    <p className="empty-description">Start building your content library by uploading your first video or movie.</p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="btn btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 auto' }}
                    >
                      <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Upload Your First Content
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="content-card fade-in">
              <div className="card-header">
                <div>
                  <h2>Performance Analytics</h2>
                  <p>Last 28 days performance overview</p>
                </div>
                <button
                  onClick={loadAnalytics}
                  className="btn btn-secondary"
                >
                  <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>

              <div style={{ padding: '2rem' }}>
                {analytics ? (
                  <div className="analytics-grid">
                    {[
                      { 
                        label: 'Total Content', 
                        value: analytics.summary?.totalContent || 0, 
                        icon: '🎬', 
                        color: 'blue',
                        desc: 'Published items'
                      },
                      { 
                        label: 'Total Views', 
                        value: analytics.summary?.totalViews || 0, 
                        icon: '👀', 
                        color: 'green',
                        desc: 'All time views'
                      },
                      { 
                        label: 'Recent Views', 
                        value: analytics.summary?.viewsLastNDays || 0, 
                        icon: '📈', 
                        color: 'purple',
                        desc: 'Last 28 days'
                      },
                      { 
                        label: 'Avg Rating', 
                        value: (analytics.summary?.avgRating || 0).toFixed(1), 
                        icon: '⭐', 
                        color: 'yellow',
                        desc: 'User ratings'
                      },
                    ].map(({ label, value, icon, color, desc }) => (
                      <div key={label} className="analytics-card">
                        <div className="analytics-header">
                          <div className={`analytics-icon ${color}`}>
                            {icon}
                          </div>
                          <div className="analytics-value">{value}</div>
                        </div>
                        <div>
                          <div className="analytics-label">{label}</div>
                          <div className="analytics-description">{desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <h3 className="empty-title">No analytics data</h3>
                    <p className="empty-description">Analytics will appear here once you have published content and received views.</p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="btn btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 auto' }}
                    >
                      <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Upload Content
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <SiteFooter />
    </div>
  )
}