import { useEffect, useState } from 'react'
import { db } from '../firebase'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'

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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (!user) return

    const casesQ = query(collection(db, 'cases'), where('assignedTo', '==', user.id))
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
    <div style={{ padding: 16, maxWidth: 960, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, color: '#0f172a' }}>Student Dashboard (Firestore)</h2>
      <section style={{
        background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 16,
        boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div>Cases: {cases.length}</div>
          <div>Progress Updates: {progress.length}</div>
        </div>
      </section>
      <section style={{
        background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16,
        boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
      }}>
        <ul>
          {cases.map(c => (
            <li key={c.id}>
              <strong>{c.title}</strong> - {c.status}
              {typeof c.progressPercentage === 'number' ? ` (${c.progressPercentage}%)` : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
