import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import SiteHeader from '../../components/SiteHeader'
import SiteFooter from '../../components/SiteFooter'
import Toast from '../../components/Toast'

export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    if (authLoading) return // Wait for auth to load
    
    if (!user) {
      navigate('/login')
      return
    }
    
    // Check if user has admin access (either admin role or admin email)
    const hasAdminAccess = user.role === 'admin' || user.email.toLowerCase().startsWith('admin')
    if (!hasAdminAccess) {
      navigate('/home')
      return
    }
  }, [navigate])

  const login = () => {
    // Simple admin password check
    if (password === 'admin123' || password === 'Adm1n#2024_Strong_Pass!') {
      setAuthed(true)
    } else {
      setToast({ message: 'Invalid admin password', type: 'error' })
    }
  }

  useEffect(() => {
    if (!authed) return
    
    const loadData = async () => {
      setLoading(true)
      try {
        // Load pending content for approval
        const contentRes = await api.get('/content', { params: { status: 'draft', limit: 100 } })
        setPending(contentRes.data?.content || [])
        
        // Load all users
        const usersRes = await api.get('/users')
        setUsers(usersRes.data?.users || [])
        
      } catch (err: any) {
        console.error('Failed to load admin data:', err)
        setToast({ message: 'Failed to load data', type: 'error' })
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [authed])

  const approve = async (id: string) => {
    try {
      await api.put(`/content/${id}`, { status: 'published' })
      setPending(pending.filter(p => p.contentId !== id))
      setToast({ message: 'Content approved successfully', type: 'success' })
    } catch (err: any) {
      console.error('Failed to approve content:', err)
      setToast({ message: 'Failed to approve content', type: 'error' })
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      await api.delete(`/users/${userId}`)
      setUsers(users.filter(u => u.userId !== userId))
      setToast({ message: 'User deleted successfully', type: 'success' })
    } catch (err: any) {
      console.error('Failed to delete user:', err)
      setToast({ message: 'Failed to delete user', type: 'error' })
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-black">
        <SiteHeader />
        {toast && <Toast {...toast} />}
        <div className="pt-20 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
              <h1 className="text-2xl font-bold text-white text-center mb-6">Admin Access</h1>
              <p className="text-zinc-400 text-center mb-6">Enter admin password to continue</p>
              <div className="space-y-4">
                <input 
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-600" 
                  type="password" 
                  placeholder="Admin Password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && login()}
                />
                <button 
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-lg transition-colors" 
                  onClick={login}
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <SiteHeader />
      {toast && <Toast {...toast} />}
      
      <main className="pt-20 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>
          
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-zinc-400 mt-2">Loading...</p>
            </div>
          )}
          
          {!loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pending Content Approvals */}
              <div className="bg-zinc-900 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Pending Approvals ({pending.length})
                </h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pending.map((item) => (
                    <div key={item.contentId} className="flex items-center justify-between bg-zinc-800 rounded-lg p-3">
                      <div>
                        <div className="font-medium text-white">{item.title}</div>
                        <div className="text-sm text-zinc-400">{item.type} • {item.genre}</div>
                      </div>
                      <button 
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-colors" 
                        onClick={() => approve(item.contentId)}
                      >
                        Approve
                      </button>
                    </div>
                  ))}
                  {pending.length === 0 && (
                    <div className="text-zinc-400 text-center py-4">No pending items</div>
                  )}
                </div>
              </div>
              
              {/* User Management */}
              <div className="bg-zinc-900 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  User Management ({users.length})
                </h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {users.map((user) => (
                    <div key={user.userId} className="flex items-center justify-between bg-zinc-800 rounded-lg p-3">
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-sm text-zinc-400">{user.email}</div>
                        <div className="text-xs text-zinc-500">{user.role}</div>
                      </div>
                      <button 
                        className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm transition-colors" 
                        onClick={() => deleteUser(user.userId)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="text-zinc-400 text-center py-4">No users found</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <SiteFooter />
    </div>
  )
}