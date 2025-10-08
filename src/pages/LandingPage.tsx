import { Link } from 'react-router-dom'
import './LandingPage.css'

function LandingPage() {
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="logo-section">
            <div className="logo-container">
              <img src="/logo.png" alt="RMLNLU CMS Logo" className="logo" />
            </div>
            <div className="text-content">
              <h1 className="university-name">Case Management System for</h1>
              <p className="university-subtitle">Dr. Ram Manohar Lohiya National Law University, Lucknow, Uttar Pradesh, India</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h2 className="hero-title">Welcome to the RMLNLU Case Management System</h2>
              <p className="hero-subtitle">
                Access your cases and stay connected with the university community.<br />
                Please log in to your account to continue.
              </p>
               <div className="hero-actions">
                 <Link to="/login" className="btn btn-primary">Get Started</Link>
               </div>
            </div>
            <div className="hero-visual">
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about">
        <div className="container">
          <div className="about-content">
            <h3 className="section-title">About the University</h3>
            <div className="about-text">
              <p>
                The year 1987 saw the beginnings of the tectonic shift in perceptions about law as a career 
                from one of the least attractive careers, to one of the most sought after, with the establishment 
                of the National Law School, Bangalore. It was a time of hope for the legal fraternity. The concept 
                of a national institution to act as a pace-setter and a testing ground for bold experiments in 
                legal education came up before the Bar Council of India in the context of the Council's statutory 
                responsibility for maintaining standards in professional legal education (under the Advocates Act).
              </p>
              <p>
                Dr. Ram Manohar Lohiya National Law University, was established by an Act of Govt. of Uttar Pradesh 
                in 2005, U.P. Act No.28 of 2005 and came into being on 4th of January 2006 to meet up the new 
                challenges in legal field and to strengthen the vision that was given by the establishment of first 
                National Law School of the country.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h3 className="section-title">Why Choose RMLNLU?</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎓</div>
              <h4>Excellence in Education</h4>
              <p>World-class legal education with experienced faculty and modern curriculum</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚖️</div>
              <h4>Legal Expertise</h4>
              <p>Comprehensive legal training with practical exposure and research opportunities</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌟</div>
              <h4>Innovation</h4>
              <p>Pioneering legal education reforms and cutting-edge research initiatives</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">2005</div>
              <div className="stat-label">Commenced From</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">1200+</div>
              <div className="stat-label">On Campus Students</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">25+</div>
              <div className="stat-label">Faculty</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">10</div>
              <div className="stat-label">Programmes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4 className="footer-heading">About This System</h4>
            <p className="footer-text">
              This Case Management System is developed for Dr. Ram Manohar Lohiya National Law University, Lucknow to streamline case and document management for students, faculty, and administrators.
            </p>
          </div>
          <div className="footer-section">
            <h4 className="footer-heading">Admin Phone No. (Official Website)</h4>
            <p className="footer-text">
              +91-522-2425902, 2425903
            </p>
          </div>
          <div className="footer-section">
            <h4 className="footer-heading">University Website</h4>
            <p className="footer-text">
              <a href="https://www.rmlnlu.ac.in" className="footer-link" target="_blank" rel="noopener noreferrer">
                www.rmlnlu.ac.in
              </a>
            </p>
          </div>
        </div>
        <div className="footer-divider"></div>
        <div className="footer-bottom">
          <p className="footer-bottom-text">
            This Case Management System is a project for Dr. Ram Manohar Lohiya National Law University, Lucknow, UP, India.
          </p>
          <p className="footer-bottom-text">
            For queries related to the CMS, please contact the system administrator at <a href="mailto:2k23.cscys2311038@gmail.com" className="footer-link">cms-support@.in</a>.
          </p>
        </div>
        <div className="scroll-to-top">
          <button className="scroll-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            ↑
          </button>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
