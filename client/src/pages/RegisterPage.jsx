import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/client';
import toast from 'react-hot-toast';
import { Zap, Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle, Key } from 'lucide-react';

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Contains number', pass: /\d/.test(password) },
    { label: 'Contains letter', pass: /[a-zA-Z]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['', '#ef4444', '#f59e0b', '#10b981'];
  
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
  
  // States
  const [step, setStep] = useState(1); // 1: Details, 2: OTP Verification
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', otp: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const validateStep1 = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Must be at least 8 characters';
    else if (!/\d/.test(form.password)) errs.password = 'Must contain at least one number';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const errs = validateStep1();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});
    try {
      await authAPI.sendOtp({ email: form.email, password: form.password });
      toast.success('Verification code sent to your email!');
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to send OTP';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!form.otp || form.otp.length !== 6) {
      setErrors({ otp: 'Please enter a valid 6-digit code' });
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      // Actually call context register, which we'll need to adapt for OTP.
      // Wait, the AuthContext register method currently just takes (email, password, name).
      // We will need to adapt AuthContext to pass otp as well.
      // Let's call the API directly here to handle the new payload structure nicely, 
      // or we can update the context's register method. Since we can't easily change the context here without a separate chunk,
      // let's just make the raw API call and then manually set the token and user using the context's dispatch or equivalent.
      // Wait, let's look at useAuth. It usually provides a `login` method that takes a token and user.
      
      const { data } = await authAPI.register({
        email: form.email,
        password: form.password,
        name: form.name,
        otp: form.otp
      });
      
      toast.success('Account verified and created! 🎉');
      
      // Save token and reload or use navigate
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      // Force a reload to let AuthContext pick it up, or just navigate to dashboard and it will reload the app context.
      window.location.href = '/dashboard';
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Verification failed';
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

        {step === 1 ? (
          <>
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

            <form className="auth-form" onSubmit={handleSendOtp}>
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
                {loading ? <span className="spinner" /> : 'Send Verification Code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="auth-title">Verify your email</h1>
            <p className="auth-subtitle">We sent a 6-digit code to <strong>{form.email}</strong></p>

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

            <form className="auth-form" onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label className="form-label">Verification Code</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    className={`input ${errors.otp ? 'error' : ''}`}
                    style={{ paddingLeft: '2.4rem', letterSpacing: '4px', fontSize: '1.2rem', textAlign: 'center' }}
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={form.otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setForm(f => ({ ...f, otp: val }));
                      if (errors.otp) setErrors(er => ({ ...er, otp: '' }));
                    }}
                  />
                </div>
                {errors.otp && <span className="form-error" style={{ textAlign: 'center' }}><AlertCircle size={12} />{errors.otp}</span>}
              </div>

              <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.75rem' }}>
                {loading ? <span className="spinner" /> : 'Verify & Create Account'}
              </button>

              <button 
                type="button" 
                className="btn btn-ghost btn-full" 
                onClick={() => setStep(1)} 
                disabled={loading}
                style={{ marginTop: '0.5rem' }}
              >
                ← Back
              </button>
            </form>
          </>
        )}

        {step === 1 && (
          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </div>
        )}
      </div>
    </div>
  );
}
