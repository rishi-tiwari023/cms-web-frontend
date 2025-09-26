import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall } from '../api/config'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isCardHover, setIsCardHover] = useState(false)
  const [focusedField, setFocusedField] = useState<null | 'username' | 'password'>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setIsError(false)
    setSubmitting(true)
    try {
      const data = await apiCall('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      setMessage(`Welcome ${data.user?.name || username}`)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      const role = data.user?.role
      if (role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/student')
      }
    } catch (err: any) {
      setIsError(true)
      setMessage(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={styles.page}>
      <div
        style={{
          ...styles.card,
          boxShadow: isCardHover ? '0 16px 40px rgba(37,99,235,0.18)' : styles.card.boxShadow,
          borderColor: isCardHover ? '#93c5fd' : '#e5e7eb',
        }}
        onMouseEnter={() => setIsCardHover(true)}
        onMouseLeave={() => setIsCardHover(false)}
      >
        <h1 style={styles.title}>Sign in</h1>
        <p style={styles.subtitle}>Use your CMS account to continue</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Username</label>
          <input
            style={{
              ...styles.input,
              marginBottom: 10,
              borderColor: focusedField === 'username' ? '#2563eb' : '#d1d5db',
              boxShadow: focusedField === 'username' ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none',
            }}
            value={username}
            onChange={e => setUsername(e.target.value)}
            onFocus={() => setFocusedField('username')}
            onBlur={() => setFocusedField(null)}
            autoFocus
          />

          <label style={styles.label}>Password</label>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input
              style={{
                ...styles.input,
                paddingRight: 90,
                borderColor: focusedField === 'password' ? '#2563eb' : '#d1d5db',
                boxShadow: focusedField === 'password' ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none',
              }}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowPassword(s => !s)}
              style={styles.toggle}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {message && (
            <div style={{
              ...styles.message,
              color: isError ? '#b3261e' : '#1b5e20',
              background: isError ? '#fdecea' : '#e8f5e9',
              border: `1px solid ${isError ? '#f5c6cb' : '#c8e6c9'}`,
            }}>
              {message}
            </div>
          )}

          <button type="submit" disabled={submitting || !username || !password} style={{
            ...styles.button,
            opacity: submitting || !username || !password ? 0.7 : 1,
            cursor: submitting || !username || !password ? 'not-allowed' : 'pointer',
          }}
            onMouseEnter={(e) => ((e.currentTarget.style.boxShadow = '0 8px 22px rgba(37,99,235,0.25)'))}
            onMouseLeave={(e) => ((e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)'))}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #f9fafb 0%, #eef2f7 100%)',
    padding: 16,
    width: '28vw',
  },
  card: {
    width: '100%',
    maxWidth: 720,
    background: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    padding: 28,
    border: '1px solid #e5e7eb',
    transition: 'box-shadow 180ms ease, border-color 180ms ease',
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 700,
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  form: {
    display: 'grid',
    gap: 12,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
  },
  input: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    border: '1px solid #d1d5db',
    padding: '0 14px',
    outline: 'none',
    fontSize: 15,
    color: '#111827',
    background: '#ffffff',
    transition: 'box-shadow 160ms ease, border-color 160ms ease',
  },
  toggle: {
    position: 'absolute',
    right: 10,
    top: 6,
    height: 28,
    minWidth: 44,
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    background: '#f9fafb',
    padding: '0 8px',
    fontSize: 12,
    color: '#374151',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'border-color 160ms ease, box-shadow 160ms ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    outline: 'none',
    marginLeft: 6,
  },
  message: {
    fontSize: 13,
    borderRadius: 8,
    padding: '10px 12px',
  },
  button: {
    height: 46,
    borderRadius: 10,
    border: '1px solid #2563eb',
    background: 'linear-gradient(180deg,#3b82f6 0%,#2563eb 100%)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: 15,
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    transition: 'box-shadow 180ms ease',
  },
}
