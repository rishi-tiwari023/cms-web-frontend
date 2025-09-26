import { useEffect, useState } from 'react'
import { db } from '../firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { apiCall } from '../api/config'

type User = { id: string; username: string; role: string; name: string }

type NewCase = { title: string; description: string; assignedTo: string }

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState<NewCase>({ title: '', description: '', assignedTo: '' })
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Fetch users from backend API
    apiCall('/api/users')
      .then(setUsers)
      .catch(err => console.error('Failed to fetch users:', err))
  }, [])

  const isValid = form.assignedTo && form.title.trim().length > 0

  async function createCase(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || submitting) return
    setSubmitting(true)
    setMessage(null)
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null') as User | null
      const docRef = await addDoc(collection(db, 'cases'), {
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
      setMessage(`Assigned: ${form.title} -> ${form.assignedTo} (id: ${docRef.id})`)
      setForm({ title: '', description: '', assignedTo: '' })
    } catch (err: any) {
      setMessage(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 960, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, color: '#0f172a' }}>Admin Dashboard</h2>

      <section style={{
        background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 16,
        boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
      }}>
        <h3 style={{ marginTop: 0, color: '#111827' }}>Users</h3>
        <ul>
          {users.map(u => (
            <li key={u.id}>{u.name} ({u.username}) - {u.role}</li>
          ))}
        </ul>
      </section>

      <section style={{
        background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16,
        boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
      }}>
        <h3 style={{ marginTop: 0, color: '#111827' }}>Assign Case (Firestore)</h3>
        <form onSubmit={createCase} style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
            <option value="">Assign to...</option>
            {users.filter(u => u.role === 'STUDENT').map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <button type="submit" disabled={!isValid || submitting}>{submitting ? 'Assigning...' : 'Assign'}</button>
        </form>
        {message && <p style={{ color: '#166534' }}>{message}</p>}
      </section>
    </div>
  )
}
