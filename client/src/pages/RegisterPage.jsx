import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle } from 'lucide-react';

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Contains number', pass: /\d/.test(password) },
    { label: 'Contains letter', pass: /[a-zA-Z]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['', '#ef4444', '#f59e0b', '#10b981'];
  const labels = ['', 'Weak', 'Fair', 'Strong'];

  if (!password) return null;
  return (
    <div style={{ marginTop: '0.4rem' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.4rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= score ? colors[score] : 'var(--bg-elevated)', transition: 'all 0.3s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {checks.map(c => (
          <span key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: c.pass ? 'var(--success-light)' : 'var(--text-muted)' }}>
            <CheckCircle size={11} /> {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Must be at least 8 characters';
    else if (!/\d/.test(form.password)) errs.password = 'Must contain at least one number';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});
    try {
      await register(form.email, form.password, form.name);
      toast.success('Account created! Welcome to LinkZap 🎉');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }));
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="brand-icon"><Zap size={18} /></div>
          <span>LinkZap</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start shortening links and tracking analytics</p>

        {errors.general && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem',
            fontSize: '0.875rem', color: '#fca5a5',
          }}>
            <AlertCircle size={16} /> {errors.general}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                className={`input ${errors.name ? 'error' : ''}`}
                style={{ paddingLeft: '2.4rem' }}
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange('name')}
              />
            </div>
            {errors.name && <span className="form-error"><AlertCircle size={12} />{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                className={`input ${errors.email ? 'error' : ''}`}
                style={{ paddingLeft: '2.4rem' }}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange('email')}
              />
            </div>
            {errors.email && <span className="form-error"><AlertCircle size={12} />{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                className={`input ${errors.password ? 'error' : ''}`}
                style={{ paddingLeft: '2.4rem', paddingRight: '2.75rem' }}
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters with a number"
                value={form.password}
                onChange={handleChange('password')}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrength password={form.password} />
            {errors.password && <span className="form-error"><AlertCircle size={12} />{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                className={`input ${errors.confirm ? 'error' : ''}`}
                style={{ paddingLeft: '2.4rem' }}
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={handleChange('confirm')}
              />
            </div>
            {errors.confirm && <span className="form-error"><AlertCircle size={12} />{errors.confirm}</span>}
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.75rem' }}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
