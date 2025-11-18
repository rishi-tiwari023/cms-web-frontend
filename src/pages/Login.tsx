import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { apiConfig } from '../api/config'

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
      let user: any = null

      // Try API endpoint first if available
      try {
        const apiUrl = apiConfig.endpoints.login
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        })

        if (response.ok) {
          const data = await response.json()
          user = data.user || data
          localStorage.setItem('token', data.token || 'api-token')
        } else if (response.status !== 404) {
          // If API exists but returns error, use that error
          const errorData = await response.json().catch(() => ({ error: 'Login failed' }))
          throw new Error(errorData.error || 'Login failed')
        }
        // If 404, API doesn't exist, fall through to Firestore
      } catch (apiError: any) {
        // If API call fails with network error or 404, try Firestore
        if (apiError.message && !apiError.message.includes('fetch')) {
          throw apiError
        }
        // Continue to Firestore fallback
      }

      // Fallback to Firestore if API didn't work
      if (!user) {
        try {
          const usersRef = collection(db, 'users')
          const q = query(usersRef, where('username', '==', username), where('password', '==', password), limit(1))
          const snap = await getDocs(q)
          if (snap.empty) {
            throw new Error('Invalid credentials')
          }
          const doc = snap.docs[0]
          user = { id: doc.id, ...(doc.data() as any) }
          localStorage.setItem('token', 'firestore-local')
        } catch (firestoreError: any) {
          // Check if it's a permission error
          if (firestoreError.code === 'permission-denied' || 
              firestoreError.message?.includes('permission') || 
              firestoreError.message?.includes('insufficient')) {
            throw new Error('Database access denied. Please contact your administrator to update Firestore security rules to allow reading the users collection.')
          }
          throw firestoreError
        }
      }

      if (!user) {
        throw new Error('Invalid credentials')
      }

      setMessage(`Welcome ${user.name || username}`)
      localStorage.setItem('user', JSON.stringify(user))

      const role = user?.role
      if (role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/student')
      }
    } catch (err: any) {
      setIsError(true)
      // Provide user-friendly error messages
      if (err.message?.includes('permission') || err.message?.includes('insufficient')) {
        setMessage('Access denied. Please contact your administrator.')
      } else {
        setMessage(err.message || 'An error occurred during login')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
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
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .login-card {
            max-width: 90% !important;
            width: 90% !important;
            padding: 24px !important;
            margin: 10px auto !important;
            border-radius: 16px !important;
          }
          .login-title {
            font-size: 28px !important;
          }
          .login-input {
            height: 48px !important;
            font-size: 16px !important;
            padding: 0 16px !important;
          }
          .login-button {
            height: 52px !important;
            font-size: 15px !important;
          }
        }
        
        @media (max-width: 480px) {
          .login-card {
            max-width: 95% !important;
            width: 95% !important;
            padding: 20px !important;
            margin: 5px auto !important;
          }
          .login-title {
            font-size: 24px !important;
          }
          .login-subtitle {
            font-size: 14px !important;
          }
          .login-input {
            height: 44px !important;
            font-size: 15px !important;
          }
          .login-button {
            height: 48px !important;
            font-size: 14px !important;
          }
        }
        
        @media (min-width: 1200px) {
          .login-card {
            max-width: 480px !important;
            padding: 48px !important;
          }
          .login-title {
            font-size: 36px !important;
          }
          .login-input {
            height: 56px !important;
            font-size: 17px !important;
          }
          .login-button {
            height: 60px !important;
            font-size: 17px !important;
          }
        }
      `}</style>
      <div style={styles.page}>
        {/* Decorative background elements */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          animation: 'float 20s ease-in-out infinite',
        }} />
      
      <div
        className="login-card"
        style={{
          ...styles.card,
          boxShadow: isCardHover ? '0 35px 70px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.15)' : styles.card.boxShadow,
          transform: isCardHover ? 'translateY(-5px) scale(1.02)' : 'translateY(0) scale(1)',
        }}
        onMouseEnter={() => setIsCardHover(true)}
        onMouseLeave={() => setIsCardHover(false)}
      >
        <h1 className="login-title" style={styles.title}>Sign in</h1>
        <p className="login-subtitle" style={styles.subtitle}>Use your CMS account to continue</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Username</label>
          <input
            className="login-input"
            style={{
              ...styles.input,
              borderColor: focusedField === 'username' ? '#667eea' : '#e2e8f0',
              boxShadow: focusedField === 'username' ? '0 0 0 4px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(102, 126, 234, 0.15)' : '0 2px 4px rgba(0,0,0,0.05)',
              transform: focusedField === 'username' ? 'translateY(-1px)' : 'translateY(0)',
            }}
            value={username}
            onChange={e => setUsername(e.target.value)}
            onFocus={() => setFocusedField('username')}
            onBlur={() => setFocusedField(null)}
            autoFocus
            placeholder="Enter your username"
          />

          <label style={styles.label}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              className="login-input"
              style={{
                ...styles.input,
                paddingRight: 80,
                borderColor: focusedField === 'password' ? '#667eea' : '#e2e8f0',
                boxShadow: focusedField === 'password' ? '0 0 0 4px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(102, 126, 234, 0.15)' : '0 2px 4px rgba(0,0,0,0.05)',
                transform: focusedField === 'password' ? 'translateY(-1px)' : 'translateY(0)',
              }}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="Enter your password"
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

          <button type="submit" className="login-button" disabled={submitting || !username || !password} style={{
            ...styles.button,
            opacity: submitting || !username || !password ? 0.6 : 1,
            cursor: submitting || !username || !password ? 'not-allowed' : 'pointer',
            transform: submitting || !username || !password ? 'none' : 'translateY(0)',
          }}
            onMouseEnter={(e) => {
              if (!submitting && username && password) {
                e.currentTarget.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.4)'
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)'
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
            }}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    margin: 0,
    boxSizing: 'border-box',
  },
  card: {
    width: '75%',
    maxWidth: '315px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '18px',
    boxShadow: '0 19px 38px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1)',
    padding: '30px',
    border: '1px solid rgba(255,255,255,0.2)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    margin: '0 auto',
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 800,
    color: '#1a202c',
    textAlign: 'center',
    marginBottom: 6,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    marginTop: 0,
    marginBottom: 24,
    color: '#718096',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 500,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  label: {
    fontSize: 11,
    color: '#4a5568',
    fontWeight: 600,
    marginBottom: 6,
    display: 'block',
  },
  input: {
    width: '100%',
    height: 39,
    borderRadius: 12,
    border: '2px solid #e2e8f0',
    padding: '0 15px',
    outline: 'none',
    fontSize: 12,
    color: '#2d3748',
    background: '#ffffff',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  },
  toggle: {
    position: 'absolute',
    right: 16,
    top: 12,
    height: 28,
    minWidth: 50,
    border: '2px solid #e2e8f0',
    borderRadius: 12,
    background: '#f7fafc',
    padding: '0 12px',
    fontSize: 12,
    color: '#4a5568',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    outline: 'none',
    fontWeight: 600,
  },
  message: {
    fontSize: 14,
    borderRadius: 12,
    padding: '16px 20px',
    fontWeight: 500,
    textAlign: 'center',
  },
  button: {
    height: 42,
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 12,
    boxShadow: '0 6px 19px rgba(102, 126, 234, 0.3)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },
}
