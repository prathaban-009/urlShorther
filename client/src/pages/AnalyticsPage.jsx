import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { urlsAPI } from '../api/client';
import toast from 'react-hot-toast';
import {
  ArrowLeft, BarChart2, Clock, MousePointer, Globe, Monitor,
  Smartphone, Tablet, Copy, CheckCircle, ExternalLink, QrCode, Download, X
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1a1a3e', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '8px', padding: '0.6rem 0.9rem', fontSize: '0.8rem' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</p>
        <p style={{ color: 'var(--primary-light)', fontWeight: 700 }}>{payload[0].value} clicks</p>
      </div>
    );
  }
  return null;
};

function StatCard({ icon, label, value, sub, color = 'var(--primary-light)' }) {
  return (
    <div className="stat-card" style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ color }}>{icon}</span>
        <p className="stat-label" style={{ margin: 0 }}>{label}</p>
      </div>
      <p className="stat-value" style={{ fontSize: '1.75rem' }}>{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}

function BreakdownCard({ title, icon, data, keyField, valueField = 'count' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => parseInt(d[valueField])));

  return (
    <div className="chart-card">
      <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {icon} {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {data.slice(0, 8).map((item, i) => {
          const count = parseInt(item[valueField]);
          const pct = max > 0 ? (count / max * 100) : 0;
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{item[keyField] || 'Unknown'}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{count}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeviceIcon({ type }) {
  if (type === 'mobile') return <Smartphone size={14} />;
  if (type === 'tablet') return <Tablet size={14} />;
  return <Monitor size={14} />;
}

export default function AnalyticsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    urlsAPI.analytics(id)
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopy = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.url.shortUrl);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };


  if (loading) {
    return (
      <div className="loading-screen">
        <span className="spinner-large" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <h2>URL not found</h2>
        <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>← Back to Dashboard</Link>
      </div>
    );
  }

  const { url, stats } = data;

  // Fill missing days in daily clicks chart
  const chartData = (() => {
    const map = {};
    stats.dailyClicks.forEach(d => { map[d.date] = parseInt(d.clicks); });
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = format(d, 'yyyy-MM-dd');
      result.push({ date: format(d, 'MMM d'), clicks: map[key] || 0 });
    }
    return result;
  })();

  const deviceData = stats.deviceBreakdown.map(d => ({
    name: d.device_type || 'Unknown',
    value: parseInt(d.count),
  }));

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      {/* Back */}
      <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      {/* URL Info Card */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.04))', borderColor: 'rgba(124,58,237,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {url.title || url.shortCode}
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.6rem' }}>
              {url.originalUrl}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <a href={url.shortUrl} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--primary-light)', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
                {url.shortUrl}
              </a>
              <button className="btn btn-icon-sm btn-ghost" onClick={handleCopy}>
                {copied ? <CheckCircle size={14} color="var(--success-light)" /> : <Copy size={14} />}
              </button>
              <a href={url.shortUrl} target="_blank" rel="noopener noreferrer" className="btn btn-icon-sm btn-ghost">
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowQr(true)}>
              <QrCode size={15} /> QR Code
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="analytics-stats" style={{ marginBottom: '1.5rem' }}>
        <StatCard icon={<MousePointer size={18} />} label="Total Clicks" value={stats.totalClicks.toLocaleString()} color="var(--primary-light)" />
        <StatCard
          icon={<Clock size={18} />}
          label="Last Visited"
          value={stats.lastVisited ? formatDistanceToNow(new Date(stats.lastVisited), { addSuffix: true }) : 'Never'}
          sub={stats.lastVisited ? format(new Date(stats.lastVisited), 'MMM d, yyyy HH:mm') : ''}
          color="var(--accent-light)"
        />
        <StatCard icon={<BarChart2 size={18} />} label="Created" value={format(new Date(url.createdAt), 'MMM d, yyyy')}
          sub={formatDistanceToNow(new Date(url.createdAt), { addSuffix: true })} color="var(--success-light)" />
        <StatCard icon={<Globe size={18} />} label="Countries" value={stats.countryBreakdown.length} color="var(--warning)" />
      </div>

      {/* Daily Clicks Chart */}
      <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="chart-title">📈 Daily Clicks — Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="clicks" stroke="#7c3aed" strokeWidth={2.5} fill="url(#clickGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown Grid */}
      <div className="breakdown-grid" style={{ marginBottom: '1.5rem' }}>
        {/* Device Pie */}
        {deviceData.length > 0 && (
          <div className="chart-card">
            <h3 className="chart-title">📱 Device Types</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  paddingAngle={4} dataKey="value" nameKey="name">
                  {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val) => [`${val} clicks`, '']} contentStyle={{ background: '#1a1a3e', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '8px', fontSize: '0.8rem' }} />
                <Legend iconSize={10} formatter={(val) => <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <BreakdownCard title="Browsers" icon={<Monitor size={14} />} data={stats.browserBreakdown} keyField="browser" />
        <BreakdownCard title="Countries" icon={<Globe size={14} />} data={stats.countryBreakdown} keyField="country" />
      </div>

      {/* Recent Visits Table */}
      {stats.recentVisits.length > 0 && (
        <div className="chart-card">
          <h3 className="chart-title">🕐 Recent Visit History</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Device</th>
                  <th>Browser</th>
                  <th>Country</th>
                  <th>Referrer</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentVisits.map((visit, i) => (
                  <tr key={i}>
                    <td>
                      <div>{format(new Date(visit.visited_at), 'MMM d, HH:mm')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatDistanceToNow(new Date(visit.visited_at), { addSuffix: true })}
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <DeviceIcon type={visit.device_type} />
                        <span style={{ textTransform: 'capitalize' }}>{visit.device_type || '—'}</span>
                      </span>
                    </td>
                    <td>{visit.browser || '—'}</td>
                    <td>
                      {visit.country ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Globe size={13} /> {visit.city ? `${visit.city}, ` : ''}{visit.country}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {visit.referrer ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '200px' }}>
                          {visit.referrer}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.recentVisits.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon"><BarChart2 size={28} /></div>
          <p className="empty-title">No visits yet</p>
          <p className="empty-desc">Share your short link to start tracking analytics.</p>
        </div>
      )}

      {/* QR Modal */}
      {showQr && data && (
        <QrModal url={data.url} onClose={() => setShowQr(false)} />
      )}
    </div>
  );
}

// ── QR Modal (inline for Analytics page) ────────────────────────────
function QrModal({ url, onClose }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl;
    const token = localStorage.getItem('token');
    fetch(urlsAPI.qrUrl(url.id), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        setImgSrc(objectUrl);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url.id]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imgSrc;
    a.download = `qr-${url.shortCode}.png`;
    a.click();
    toast.success('QR code downloaded!');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '360px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <QrCode size={18} /> QR Code
          </h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{
          background: 'white', borderRadius: '16px', padding: '1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '220px', marginBottom: '1rem',
          border: '4px solid rgba(124,58,237,0.15)',
        }}>
          {loading && <span className="spinner-large" style={{ borderTopColor: '#7c3aed' }} />}
          {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>Failed to load QR code</p>}
          {imgSrc && !loading && (
            <img src={imgSrc} alt={`QR Code for ${url.shortUrl}`}
              style={{ width: '200px', height: '200px', imageRendering: 'pixelated' }} />
          )}
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--primary-light)', fontWeight: 700, marginBottom: '0.35rem', wordBreak: 'break-all' }}>
          {url.shortUrl}
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          → {url.originalUrl}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={handleDownload} disabled={!imgSrc || loading}>
            <Download size={16} /> Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
