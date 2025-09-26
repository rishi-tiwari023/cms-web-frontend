import { useEffect, useState } from 'react'
import { db } from '../firebase'
import { addDoc, collection, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore'
import { apiCall } from '../api/config'

type User = { id: string; username: string; role: string; name: string; email: string; createdAt: string }

type Case = { 
  id: string; 
  title: string; 
  description: string; 
  status: string; 
  assignedTo: string; 
  createdBy: string; 
  createdAt: any; 
  updatedAt: any; 
  progressPercentage: number; 
  documentStatus: string 
}


type NewCase = { title: string; description: string; assignedTo: string }

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [form, setForm] = useState<NewCase>({ title: '', description: '', assignedTo: '' })
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'cases' | 'users' | 'assign'>('overview')

  useEffect(() => {
    // Fetch users from backend API
    apiCall('/api/users')
      .then(setUsers)
      .catch(err => console.error('Failed to fetch users:', err))

    // Fetch cases from Firestore
    const casesQuery = query(collection(db, 'cases'), orderBy('createdAt', 'desc'))
    const unsubscribeCases = onSnapshot(casesQuery, (snapshot) => {
      const casesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Case[]
      setCases(casesData)
    })

    return () => {
      unsubscribeCases()
    }
  }, [])

  const isValid = form.assignedTo && form.title.trim().length > 0

  // Helper functions for analytics
  const getStats = () => {
    const totalUsers = users.length
    const totalCases = cases.length
    const activeCases = cases.filter(c => c.status === 'OPEN' || c.status === 'ASSIGNED').length
    const completedCases = cases.filter(c => c.status === 'CLOSED').length
    const avgProgress = cases.length > 0 ? cases.reduce((sum, c) => sum + c.progressPercentage, 0) / cases.length : 0
    
    return { totalUsers, totalCases, activeCases, completedCases, avgProgress }
  }

  const getCaseStatusData = () => {
    const statusCounts = cases.reduce((acc, case_) => {
      acc[case_.status] = (acc[case_.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return statusCounts
  }

  const getDocumentStatusData = () => {
    const docCounts = cases.reduce((acc, case_) => {
      acc[case_.documentStatus] = (acc[case_.documentStatus] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return docCounts
  }

  const getProgressData = () => {
    const progressRanges = [
      { range: '0-25%', count: 0 },
      { range: '26-50%', count: 0 },
      { range: '51-75%', count: 0 },
      { range: '76-100%', count: 0 }
    ]
    
    cases.forEach(case_ => {
      if (case_.progressPercentage <= 25) progressRanges[0].count++
      else if (case_.progressPercentage <= 50) progressRanges[1].count++
      else if (case_.progressPercentage <= 75) progressRanges[2].count++
      else progressRanges[3].count++
    })
    
    return progressRanges
  }

  async function createCase(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || submitting) return
    setSubmitting(true)
    setMessage(null)
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null') as User | null
      await addDoc(collection(db, 'cases'), {
        title: form.title.trim(),
        description: form.description.trim(),
        status: 'OPEN',
        assignedTo: form.assignedTo,
        createdBy: currentUser?.id || 'admin-1',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        progressPercentage: 0,
        documentStatus: 'NOT_UPLOADED',
      })
      setMessage(`✅ Case assigned successfully: ${form.title} → ${users.find(u => u.id === form.assignedTo)?.name}`)
      setForm({ title: '', description: '', assignedTo: '' })
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const stats = getStats()
  const caseStatusData = getCaseStatusData()
  const documentStatusData = getDocumentStatusData()
  const progressData = getProgressData()

  return (
    <div style={styles.container}>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html, body {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .fade-in { animation: fadeIn 0.6s ease-out; }
        .slide-in { animation: slideIn 0.4s ease-out; }
      `}</style>
      
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>📊 Admin Dashboard</h1>
        <div style={styles.headerUserInfo}>
          <span style={styles.headerUserName}>Welcome, Admin</span>
          <div style={styles.statusDot}></div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={styles.tabContainer}>
        {[
          { id: 'overview', label: '📈 Overview', icon: '📊' },
          { id: 'cases', label: '📋 Cases', icon: '📁' },
          { id: 'users', label: '👥 Users', icon: '👤' },
          { id: 'assign', label: '➕ Assign Case', icon: '📝' }
        ].map(tab => (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="fade-in">
          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={{...styles.statCard, background: '#3b82f6'}}>
              <div style={styles.statIcon}>👥</div>
              <div style={styles.statContent}>
                <div style={styles.statNumber}>{stats.totalUsers}</div>
                <div style={styles.statLabel}>Total Users</div>
              </div>
            </div>
            <div style={{...styles.statCard, background: '#8b5cf6'}}>
              <div style={styles.statIcon}>📁</div>
              <div style={styles.statContent}>
                <div style={styles.statNumber}>{stats.totalCases}</div>
                <div style={styles.statLabel}>Total Cases</div>
              </div>
            </div>
            <div style={{...styles.statCard, background: '#06b6d4'}}>
              <div style={styles.statIcon}>🔄</div>
              <div style={styles.statContent}>
                <div style={styles.statNumber}>{stats.activeCases}</div>
                <div style={styles.statLabel}>Active Cases</div>
              </div>
            </div>
            <div style={{...styles.statCard, background: '#10b981'}}>
              <div style={styles.statIcon}>✅</div>
              <div style={styles.statContent}>
                <div style={styles.statNumber}>{stats.completedCases}</div>
                <div style={styles.statLabel}>Completed</div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div style={styles.chartsGrid}>
            {/* Case Status Chart */}
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>📊 Case Status Distribution</h3>
              <div style={styles.chartContainer}>
                {Object.entries(caseStatusData).map(([status, count]) => (
                  <div key={status} style={styles.chartBar}>
                    <div style={styles.barLabel}>{status}</div>
                    <div style={styles.barContainer}>
                      <div 
                        style={{
                          ...styles.bar,
                          width: `${(count / stats.totalCases) * 100}%`,
                          background: status === 'OPEN' ? '#3b82f6' : status === 'ASSIGNED' ? '#8b5cf6' : '#10b981'
                        }}
                      ></div>
                    </div>
                    <div style={styles.barValue}>{count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Chart */}
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>📈 Progress Distribution</h3>
              <div style={styles.chartContainer}>
                {progressData.map((item, index) => (
                  <div key={item.range} style={styles.chartBar}>
                    <div style={styles.barLabel}>{item.range}</div>
                    <div style={styles.barContainer}>
                      <div 
                        style={{
                          ...styles.bar,
                          width: `${(item.count / stats.totalCases) * 100}%`,
                          background: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'][index]
                        }}
                      ></div>
                    </div>
                    <div style={styles.barValue}>{item.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Status Chart */}
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>📄 Document Status</h3>
              <div style={styles.chartContainer}>
                {Object.entries(documentStatusData).map(([status, count]) => (
                  <div key={status} style={styles.chartBar}>
                    <div style={styles.barLabel}>{status.replace('_', ' ')}</div>
                    <div style={styles.barContainer}>
                      <div 
                        style={{
                          ...styles.bar,
                          width: `${(count / stats.totalCases) * 100}%`,
                          background: status === 'NOT_UPLOADED' ? '#ef4444' : status === 'UPLOADED' ? '#f59e0b' : '#10b981'
                        }}
                      ></div>
                    </div>
                    <div style={styles.barValue}>{count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Average Progress */}
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>📊 Average Progress</h3>
              <div style={styles.progressCircle}>
                <div style={styles.progressCircleInner}>
                  <div style={styles.progressPercentage}>{Math.round(stats.avgProgress)}%</div>
                  <div style={styles.progressLabel}>Overall</div>
                </div>
                <svg style={styles.progressSvg}>
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#e0e0e0"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - stats.avgProgress / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cases Tab */}
      {activeTab === 'cases' && (
        <div className="fade-in">
          <div style={styles.tableCard}>
            <h3 style={styles.tableTitle}>📋 All Cases</h3>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th>Title</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Documents</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map(case_ => (
                    <tr key={case_.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>
                        <div style={styles.caseTitle}>{case_.title}</div>
                        <div style={styles.caseDescription}>{case_.description}</div>
                      </td>
                      <td style={styles.tableCell}>
                        {users.find(u => u.id === case_.assignedTo)?.name || 'Unknown'}
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{
                          ...styles.statusBadge,
                          background: case_.status === 'OPEN' ? '#e3f2fd' : 
                                     case_.status === 'ASSIGNED' ? '#fce4ec' : '#e8f5e9',
                          color: case_.status === 'OPEN' ? '#1976d2' : 
                                case_.status === 'ASSIGNED' ? '#c2185b' : '#388e3c'
                        }}>
                          {case_.status}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.progressBar}>
                          <div style={{
                            ...styles.progressBarFill,
                            width: `${case_.progressPercentage}%`,
                            background: case_.progressPercentage < 30 ? '#ff6b6b' : 
                                      case_.progressPercentage < 70 ? '#ffa726' : '#66bb6a'
                          }}></div>
                        </div>
                        <span style={styles.progressText}>{case_.progressPercentage}%</span>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{
                          ...styles.statusBadge,
                          background: case_.documentStatus === 'NOT_UPLOADED' ? '#ffebee' : 
                                     case_.documentStatus === 'UPLOADED' ? '#fff3e0' : '#e8f5e9',
                          color: case_.documentStatus === 'NOT_UPLOADED' ? '#d32f2f' : 
                                case_.documentStatus === 'UPLOADED' ? '#f57c00' : '#388e3c'
                        }}>
                          {case_.documentStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        {case_.createdAt?.toDate ? 
                          case_.createdAt.toDate().toLocaleDateString() : 
                          'N/A'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="fade-in">
          <div style={styles.tableCard}>
            <h3 style={styles.tableTitle}>👥 All Users</h3>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Cases Assigned</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const userCases = cases.filter(c => c.assignedTo === user.id)
                    return (
                      <tr key={user.id} style={styles.tableRow}>
                        <td style={styles.tableCell}>
                          <div style={styles.tableUserInfo}>
                            <div style={styles.userAvatar}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={styles.tableUserName}>{user.name}</div>
                          </div>
                        </td>
                        <td style={styles.tableCell}>{user.username}</td>
                        <td style={styles.tableCell}>{user.email}</td>
                        <td style={styles.tableCell}>
                          <span style={{
                            ...styles.statusBadge,
                            background: user.role === 'ADMIN' ? '#e3f2fd' : '#fce4ec',
                            color: user.role === 'ADMIN' ? '#1976d2' : '#c2185b'
                          }}>
                            {user.role}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <span style={styles.caseCount}>{userCases.length}</span>
                        </td>
                        <td style={styles.tableCell}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Assign Case Tab */}
      {activeTab === 'assign' && (
        <div className="fade-in">
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>➕ Assign New Case</h3>
            <form onSubmit={createCase} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Case Title</label>
                <input 
                  style={styles.input}
                  placeholder="Enter case title..." 
                  value={form.title} 
                  onChange={e => setForm({ ...form, title: e.target.value })} 
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea 
                  style={styles.textarea}
                  placeholder="Enter case description..." 
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Assign To</label>
                <select 
                  style={styles.select}
                  value={form.assignedTo} 
                  onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                >
                  <option value="">Select a student...</option>
                  {users.filter(u => u.role === 'STUDENT').map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <button 
                type="submit" 
                style={{
                  ...styles.submitButton,
                  opacity: !isValid || submitting ? 0.6 : 1,
                  cursor: !isValid || submitting ? 'not-allowed' : 'pointer'
                }}
                disabled={!isValid || submitting}
              >
                {submitting ? '⏳ Assigning...' : '✅ Assign Case'}
              </button>
            </form>
            {message && (
              <div style={{
                ...styles.message,
                background: message.includes('✅') ? '#e8f5e9' : '#ffebee',
                color: message.includes('✅') ? '#2e7d32' : '#c62828',
                border: `1px solid ${message.includes('✅') ? '#c8e6c9' : '#ffcdd2'}`
              }}>
                {message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    width: '100vw',
    background: '#f8fafc',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '20px 30px',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(10px)',
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 800,
    color: '#1e40af',
  },
  headerUserInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerUserName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#4a5568',
  },
  statusDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '30px',
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '8px',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  },
  tab: {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  activeTab: {
    background: '#3b82f6',
    color: 'white',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    padding: '24px',
    borderRadius: '16px',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    transition: 'transform 0.2s ease',
  },
  statIcon: {
    fontSize: '32px',
    opacity: 0.9,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 800,
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '14px',
    opacity: 0.9,
    fontWeight: 500,
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  chartCard: {
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(10px)',
  },
  chartTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: 700,
    color: '#2d3748',
  },
  chartContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  chartBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  barLabel: {
    minWidth: '80px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#4a5568',
  },
  barContainer: {
    flex: 1,
    height: '20px',
    background: '#f1f5f9',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: '10px',
    transition: 'width 0.3s ease',
  },
  barValue: {
    minWidth: '30px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#2d3748',
    textAlign: 'right',
  },
  progressCircle: {
    position: 'relative',
    width: '120px',
    height: '120px',
    margin: '0 auto',
  },
  progressCircleInner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
  },
  progressPercentage: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#2d3748',
  },
  progressLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 500,
  },
  progressSvg: {
    width: '120px',
    height: '120px',
    transform: 'rotate(-90deg)',
  },
  tableCard: {
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(10px)',
  },
  tableTitle: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    fontWeight: 700,
    color: '#2d3748',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    background: '#f8fafc',
  },
  tableRow: {
    borderBottom: '1px solid #e2e8f0',
    transition: 'background-color 0.2s ease',
  },
  tableCell: {
    padding: '16px 12px',
    fontSize: '14px',
    color: '#4a5568',
  },
  caseTitle: {
    fontWeight: 600,
    color: '#2d3748',
    marginBottom: '4px',
  },
  caseDescription: {
    fontSize: '12px',
    color: '#6b7280',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  progressBar: {
    width: '100px',
    height: '8px',
    background: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '4px',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#4a5568',
  },
  tableUserInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#3b82f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
  },
  tableUserName: {
    fontWeight: 600,
    color: '#2d3748',
  },
  caseCount: {
    background: '#e3f2fd',
    color: '#1976d2',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
  },
  formCard: {
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(10px)',
    maxWidth: '600px',
    margin: '0 auto',
  },
  formTitle: {
    margin: '0 0 24px 0',
    fontSize: '20px',
    fontWeight: 700,
    color: '#2d3748',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#4a5568',
  },
  input: {
    padding: '12px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.2s ease',
    outline: 'none',
  },
  textarea: {
    padding: '12px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    minHeight: '100px',
    resize: 'vertical',
    transition: 'border-color 0.2s ease',
    outline: 'none',
  },
  select: {
    padding: '12px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    transition: 'border-color 0.2s ease',
    outline: 'none',
  },
  submitButton: {
    padding: '14px 24px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },
  message: {
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    marginTop: '16px',
  },
}
