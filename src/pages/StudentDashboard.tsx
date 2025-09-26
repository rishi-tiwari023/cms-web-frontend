import { useEffect, useState } from 'react'
import { db, storage } from '../firebase'
import { collection, doc, onSnapshot, orderBy, query, where, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

type CaseItem = {
  id: string
  title: string
  description: string
  status: string
  progressPercentage?: number
}

type ProgressItem = {
  id: string
  caseId: string
  userId: string
  createdAt: any
}

export default function StudentDashboard() {
  const [cases, setCases] = useState<CaseItem[]>([])
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null') as { id: string; name?: string } | null
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null)
  const [editPercent, setEditPercent] = useState<number>(0)
  const [editNotes, setEditNotes] = useState<string>('')
  const [uploading, setUploading] = useState<boolean>(false)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (!user) return

    const casesQ = query(
      collection(db, 'cases'),
      where('assignedTo', '==', user.id),
      orderBy('createdAt', 'desc')
    )
    const unsubCases = onSnapshot(casesQ, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as CaseItem[]
      setCases(list)
    })

    const progressQ = query(collection(db, 'progress'), where('userId', '==', user.id), orderBy('createdAt', 'desc'))
    const unsubProgress = onSnapshot(progressQ, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as ProgressItem[]
      setProgress(list)
    })

    return () => { unsubCases(); unsubProgress(); }
  }, [])

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🎓 Student Dashboard</h1>
        <div style={styles.userInfo}>
          <span style={styles.userName}>Welcome{currentUser?.name ? `, ${currentUser.name}` : ''}</span>
          <div style={styles.statusDot}></div>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={{...styles.statCard, background: '#3b82f6'}}>
          <div style={styles.statIcon}>📁</div>
          <div style={styles.statContent}>
            <div style={styles.statNumber}>{cases.length}</div>
            <div style={styles.statLabel}>My Cases</div>
          </div>
        </div>
        <div style={{...styles.statCard, background: '#10b981'}}>
          <div style={styles.statIcon}>📝</div>
          <div style={styles.statContent}>
            <div style={styles.statNumber}>{progress.length}</div>
            <div style={styles.statLabel}>Progress Updates</div>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div style={styles.tableCard}>
        <h3 style={styles.tableTitle}>📋 My Cases</h3>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th>Title</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map(c => (
                <tr key={c.id} style={styles.tableRow}>
                  <td style={styles.tableCell}>
                    <div style={styles.caseTitle}>{c.title}</div>
                    <div style={styles.caseDescription}>{c.description}</div>
                  </td>
                  <td style={styles.tableCell}>
                    <span style={{
                      ...styles.statusBadge,
                      background: c.status === 'OPEN' ? '#e3f2fd' : c.status === 'ASSIGNED' ? '#fce4ec' : '#e8f5e9',
                      color: c.status === 'OPEN' ? '#1976d2' : c.status === 'ASSIGNED' ? '#c2185b' : '#388e3c'
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.progressBar}>
                      <div style={{
                        ...styles.progressBarFill,
                        width: `${c.progressPercentage ?? 0}%`,
                        background: (c.progressPercentage ?? 0) < 30 ? '#ff6b6b' : (c.progressPercentage ?? 0) < 70 ? '#ffa726' : '#66bb6a'
                      }}></div>
                    </div>
                    <span style={styles.progressText}>{c.progressPercentage ?? 0}%</span>
                  </td>
                  <td style={styles.tableCell}>
                    <button style={styles.actionBtn} onClick={() => {
                      setEditingCaseId(c.id)
                      setEditPercent(c.progressPercentage ?? 0)
                      setEditNotes('')
                    }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingCaseId && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>🛠️ Update Progress / Upload</h3>
              <button style={styles.closeBtn} aria-label="Close" onClick={() => { setEditingCaseId(null); setEditNotes(''); setEditPercent(0); }}>✕</button>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Progress</label>
                <input type="range" min={0} max={100} value={editPercent}
                  onChange={e => setEditPercent(Number(e.target.value) || 0)}
                  style={{ width: 240 }} />
                <div style={styles.rangeValue}>{editPercent}%</div>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.label}>Notes</label>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} style={{ ...styles.input, minHeight: 80 }} placeholder="What changed?" />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Attach Document (optional)</label>
                <input type="file" accept="*/*" onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file || !currentUser || !editingCaseId) return
                try {
                  setUploading(true)
                  const fileRef = ref(storage, `case-documents/${editingCaseId}/${Date.now()}-${file.name}`)
                  await uploadBytes(fileRef, file)
                  const url = await getDownloadURL(fileRef)
                  // Update case with document URL and status
                  await updateDoc(doc(db, 'cases', editingCaseId), {
                    documentStatus: 'UPLOADED',
                    documentUrl: url,
                    updatedAt: serverTimestamp(),
                  })
                } finally {
                  setUploading(false)
                }
              }} />
                {uploading && <div style={styles.hint}>Uploading...</div>}
              </div>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.primaryBtn} disabled={uploading} onClick={async () => {
              if (!currentUser || !editingCaseId) return
              // Add progress entry
              await addDoc(collection(db, 'progress'), {
                caseId: editingCaseId,
                userId: currentUser.id,
                progressPercentage: editPercent,
                notes: editNotes || null,
                createdAt: serverTimestamp(),
              })
              // Update case percentage
              await updateDoc(doc(db, 'cases', editingCaseId), {
                progressPercentage: editPercent,
                updatedAt: serverTimestamp(),
              })
              setEditingCaseId(null)
              setEditNotes('')
              setEditPercent(0)
              }}>Save</button>
              <button style={styles.secondaryBtn} onClick={() => {
              setEditingCaseId(null)
              setEditNotes('')
              setEditPercent(0)
              }}>Cancel</button>
            </div>
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
    padding: 20,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    background: '#ffffff',
    padding: '16px 24px',
    borderRadius: 12,
    boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    color: '#1e293b',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  userName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#475569',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.18)'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    padding: 18,
    borderRadius: 12,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 8px 28px rgba(0,0,0,0.12)'
  },
  statIcon: {
    fontSize: 26,
    opacity: 0.95,
  },
  statContent: { flex: 1 },
  statNumber: { fontSize: 24, fontWeight: 800, marginBottom: 2 },
  statLabel: { fontSize: 12, opacity: 0.95, fontWeight: 600 },
  tableCard: {
    background: '#ffffff',
    padding: 18,
    borderRadius: 12,
    boxShadow: '0 8px 28px rgba(0,0,0,0.10)'
  },
  tableTitle: { margin: '0 0 14px 0', fontSize: 18, fontWeight: 700, color: '#1f2937' },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { background: '#f8fafc' },
  tableRow: { borderBottom: '1px solid #e2e8f0' },
  tableCell: { padding: '12px 10px', fontSize: 14, color: '#374151' },
  caseTitle: { fontWeight: 600, color: '#111827', marginBottom: 4 },
  caseDescription: { fontSize: 12, color: '#6b7280', maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  statusBadge: { padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' },
  progressBar: { width: 120, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progressBarFill: { height: '100%', borderRadius: 4, transition: 'width 0.3s ease' },
  progressText: { fontSize: 12, fontWeight: 700, color: '#4b5563' },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 50,
  },
  modalCard: {
    width: '100%',
    maxWidth: 560,
    background: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    padding: 18,
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' },
  closeBtn: {
    border: 'none',
    background: '#f3f4f6',
    color: '#374151',
    borderRadius: 8,
    padding: '6px 10px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  formCard: { background: '#ffffff', borderRadius: 12, padding: 16, boxShadow: '0 8px 28px rgba(0,0,0,0.10)' },
  formTitle: { margin: '0 0 12px 0', fontSize: 16, fontWeight: 700, color: '#111827' },
  formRow: { display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 700, color: '#4b5563' },
  input: { border: '2px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', outline: 'none', fontSize: 13 },
  rangeValue: { fontSize: 12, fontWeight: 700, color: '#374151', marginTop: 4 },
  hint: { fontSize: 12, color: '#6b7280', marginTop: 6 },
  modalActions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 },
  primaryBtn: { padding: '10px 14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
  secondaryBtn: { padding: '10px 14px', background: '#e5e7eb', color: '#111827', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
  actionBtn: { padding: '8px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
}
