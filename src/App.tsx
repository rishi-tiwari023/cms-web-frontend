import { Link } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <>
      <h1>CMS Web</h1>
      <nav style={{ display: 'flex', gap: 12 }}>
        <Link to="/login">Login</Link>
        <Link to="/student">Student Dashboard</Link>
        <Link to="/admin">Admin Dashboard</Link>
      </nav>
    </>
  )
}

export default App
