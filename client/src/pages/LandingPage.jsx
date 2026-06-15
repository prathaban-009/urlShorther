import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { urlsAPI } from '../api/client';
import toast from 'react-hot-toast';
import { Zap, BarChart2, Shield, Clock, Copy, ExternalLink, Link2, ArrowRight, CheckCircle } from 'lucide-react';

const FEATURES = [
  { icon: <Zap size={20} />, title: 'Instant Shortening', desc: 'Transform any long URL into a clean, shareable link in milliseconds.' },
  { icon: <BarChart2 size={20} />, title: 'Powerful Analytics', desc: 'Track clicks, devices, locations, and trends with beautiful dashboards.' },
  { icon: <Shield size={20} />, title: 'Secure & Private', desc: 'Your links are protected. Only you can see your analytics data.' },
  { icon: <Clock size={20} />, title: 'Link Expiry', desc: 'Set expiry dates for time-sensitive campaigns and promotional links.' },
  { icon: <Copy size={20} />, title: 'Custom Aliases', desc: 'Create memorable short links with your own custom alias.' },
  { icon: <ExternalLink size={20} />, title: 'QR Codes', desc: 'Generate QR codes for every link — perfect for offline campaigns.' },
];

function HeroShortener() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShorten = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    if (!url.trim()) return;
    setLoading(true);
    try {
      const { data } = await urlsAPI.create({ originalUrl: url.trim() });
      setResult(data.url);
      toast.success('Short URL created!');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to shorten URL';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="hero-shortener">
      <form onSubmit={handleShorten}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: '200px', fontSize: '1rem', padding: '0.85rem 1.1rem' }}
            type="url"
            placeholder="Paste your long URL here..."
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading || !url.trim()}>
            {loading ? <span className="spinner" /> : <><Zap size={18} /> Shorten</>}
          </button>
        </div>
      </form>

      {result && (
        <div style={{
          marginTop: '1rem',
          background: 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          animation: 'slideUp 0.3s ease',
        }}>
          <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0 }} />
          <a href={result.shortUrl} target="_blank" rel="noopener noreferrer"
            style={{ color: '#a78bfa', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', flex: 1 }}>
            {result.shortUrl}
          </a>
          <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <Link to="/dashboard" className="btn btn-ghost btn-sm">
            Dashboard <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {!isAuthenticated && (
        <p style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          <Link to="/register" style={{ color: 'var(--primary-light)' }}>Sign up free</Link> to save your links and view analytics
        </p>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: '999px', padding: '0.3rem 1rem', fontSize: '0.82rem',
            color: 'var(--primary-light)', marginBottom: '1.5rem',
          }}>
            <Zap size={14} /> URL Shortener with Analytics
          </div>
          <h1 className="hero-title">
            Short Links,<br />
            <span className="gradient-text">Big Insights</span>
          </h1>
          <p className="hero-subtitle">
            Create branded short URLs, track every click in real time, and unlock powerful analytics — all in one sleek dashboard.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-xl">
              Start for Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-xl">
              Sign In
            </Link>
          </div>
          <HeroShortener />
        </div>
      </section>

      {/* Features */}
      <section style={{ borderTop: '1px solid var(--border)', background: 'rgba(124,58,237,0.02)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', padding: '3rem 0 1rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Everything You Need
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Powerful features to manage and grow your links
            </p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '5rem 0', textAlign: 'center' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.08))',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '24px',
            padding: '3rem 2rem',
          }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
              Ready to get started?
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Join thousands of users managing their links with LinkZap
            </p>
            <Link to="/register" className="btn btn-primary btn-xl">
              Create Free Account <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
