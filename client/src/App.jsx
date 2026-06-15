import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="page-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute><DashboardPage /></ProtectedRoute>
              } />
              <Route path="/analytics/:id" element={
                <ProtectedRoute><AnalyticsPage /></ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer style={{
            borderTop: '1px solid rgba(124,58,237,0.15)',
            background: 'rgba(8,8,24,0.95)',
            backdropFilter: 'blur(12px)',
          }}>
            {/* Gradient accent line */}
            <div style={{
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #7c3aed, #06b6d4, transparent)',
            }} />

            <div className="container" style={{ padding: '1.5rem 1.5rem 1rem' }}>
              {/* Main row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1rem',
              }}>
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: 28, height: 28,
                    background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                    borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 900, color: 'white',
                  }}>⚡</div>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                    LinkZap
                  </span>
                  <span style={{
                    background: 'rgba(124,58,237,0.15)',
                    border: '1px solid rgba(124,58,237,0.3)',
                    borderRadius: '999px',
                    padding: '0.1rem 0.55rem',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#a78bfa',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}>v1.0</span>
                </div>

                {/* Owner info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: '#475569' }}>Built &amp; designed with</span>
                  <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>♥</span>
                  <span style={{ fontSize: '0.8rem', color: '#475569' }}>by</span>
                  <span style={{
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    background: 'linear-gradient(135deg, #a78bfa, #67e8f9)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>Yashiladevi</span>
                  <span style={{ color: '#334155', fontSize: '0.75rem' }}>·</span>
                  <a
                    href="mailto:yashiladevi09@gmail.com"
                    style={{
                      fontSize: '0.8rem',
                      color: '#64748b',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                    onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                  >
                    ✉ yashiladevi09@gmail.com
                  </a>
                </div>
              </div>

              {/* Bottom divider + copyright */}
              <div style={{
                borderTop: '1px solid rgba(124,58,237,0.08)',
                paddingTop: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                <p style={{ fontSize: '0.75rem', color: '#334155', margin: 0 }}>
                  © {new Date().getFullYear()} LinkZap. All rights reserved. Owner: <strong style={{ color: '#475569' }}>Yashiladevi</strong>
                </p>
                <p style={{ fontSize: '0.72rem', color: '#334155', margin: 0 }}>
                  URL Shortener · Analytics · QR Codes · Hackathon Project
                </p>
              </div>
            </div>
          </footer>

        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#0f0f2a',
              color: '#f1f5f9',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              borderRadius: '10px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#0f0f2a' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0f0f2a' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
