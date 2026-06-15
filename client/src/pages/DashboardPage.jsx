import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { urlsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Plus, Copy, Trash2, BarChart2, ExternalLink, Search, ChevronDown,
  ChevronUp, Link2, QrCode, CheckCircle, Edit2, X, Clock, Calendar,
  Upload, Zap, RefreshCw, Download
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

// ── Create URL Form ──────────────────────────────────────────────────
function CreateUrlForm({ onCreated }) {
  const [form, setForm] = useState({ originalUrl: '', customAlias: '', title: '', expiresAt: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.originalUrl.trim()) errs.originalUrl = 'URL is required';
    if (form.customAlias && !/^[a-zA-Z0-9_-]{3,50}$/.test(form.customAlias)) {
      errs.customAlias = '3–50 chars, letters/numbers/hyphens only';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    try {
      const payload = { originalUrl: form.originalUrl.trim() };
      if (form.customAlias) payload.customAlias = form.customAlias.trim();
      if (form.title) payload.title = form.title.trim();
      if (form.expiresAt) payload.expiresAt = form.expiresAt;
      const { data } = await urlsAPI.create(payload);
      toast.success('Short URL created!');
      setForm({ originalUrl: '', customAlias: '', title: '', expiresAt: '' });
      setShowAdvanced(false);
      onCreated(data.url);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to create URL';
      toast.error(msg);
      if (msg.includes('alias')) setErrors({ customAlias: msg });
    } finally {
      setLoading(false);
    }
  };

  const hc = (f) => (e) => { setForm(p => ({ ...p, [f]: e.target.value })); if (errors[f]) setErrors(er => ({ ...er, [f]: '' })); };

  return (
    <div className="create-form-card">
      <h2 className="create-form-title"><Plus size={18} /> Shorten a New URL</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <input
              className={`input ${errors.originalUrl ? 'error' : ''}`}
              placeholder="https://your-very-long-url.com/goes/here"
              value={form.originalUrl}
              onChange={hc('originalUrl')}
            />
            {errors.originalUrl && <span className="form-error" style={{ marginTop: '0.3rem' }}>{errors.originalUrl}</span>}
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : <><Zap size={16} /> Shorten</>}
          </button>
        </div>

        <button type="button" className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Advanced options
        </button>

        {showAdvanced && (
          <div className="advanced-fields">
            <div className="form-group">
              <label className="form-label">Custom alias</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>linkzap/</span>
                <input className={`input ${errors.customAlias ? 'error' : ''}`} style={{ paddingLeft: '4.5rem' }}
                  placeholder="my-link" value={form.customAlias} onChange={hc('customAlias')} />
              </div>
              {errors.customAlias && <span className="form-error">{errors.customAlias}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Link title (optional)</label>
              <input className="input" placeholder="Campaign name…" value={form.title} onChange={hc('title')} />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry date (optional)</label>
              <input className="input" type="datetime-local" value={form.expiresAt} onChange={hc('expiresAt')} />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

// ── Bulk Upload Modal ────────────────────────────────────────────────
function BulkUploadModal({ onClose, onCreated }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await urlsAPI.bulk(fd);
      setResult(data);
      if (data.created > 0) {
        toast.success(`${data.created} URLs created!`);
        onCreated();
      }
    } catch (err) {
      toast.error('Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Bulk URL Upload</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Upload a CSV file with columns: <code style={{ color: 'var(--primary-light)' }}>url, title, alias</code>
          </p>
          <div style={{
            border: '2px dashed var(--border)', borderRadius: '12px', padding: '2rem',
            textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)',
          }}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}
          >
            <Upload size={28} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {file ? file.name : 'Click to upload or drag & drop CSV'}
            </p>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
              onChange={e => setFile(e.target.files[0])} />
          </div>

          {result && (
            <div style={{ fontSize: '0.85rem' }}>
              <p style={{ color: 'var(--success-light)' }}>✅ {result.created} URLs created</p>
              {result.errors?.length > 0 && <p style={{ color: 'var(--danger-light)' }}>⚠️ {result.errors.length} errors</p>}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpload} disabled={!file || loading}>
              {loading ? <span className="spinner" /> : <><Upload size={16} /> Upload</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit URL Modal ───────────────────────────────────────────────────
function EditUrlModal({ url, onClose, onUpdated }) {
  const [form, setForm] = useState({ originalUrl: url.originalUrl, title: url.title || '' });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await urlsAPI.update(url.id, { originalUrl: form.originalUrl, title: form.title });
      toast.success('URL updated!');
      onUpdated(data.url);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Edit URL</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Destination URL</label>
            <input className="input" value={form.originalUrl} onChange={e => setForm(f => ({ ...f, originalUrl: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Optional title" />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── QR Code Modal ────────────────────────────────────────────────────
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

        {/* QR Image */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '220px',
          marginBottom: '1rem',
          border: '4px solid rgba(124,58,237,0.15)',
        }}>
          {loading && <span className="spinner-large" style={{ borderTopColor: '#7c3aed' }} />}
          {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>Failed to load QR code</p>}
          {imgSrc && !loading && (
            <img
              src={imgSrc}
              alt={`QR Code for ${url.shortUrl}`}
              style={{ width: '200px', height: '200px', imageRendering: 'pixelated' }}
            />
          )}
        </div>

        {/* Short URL label */}
        <p style={{ fontSize: '0.85rem', color: 'var(--primary-light)', fontWeight: 700, marginBottom: '0.35rem', wordBreak: 'break-all' }}>
          {url.shortUrl}
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          → {url.originalUrl}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={!imgSrc || loading}
          >
            <Download size={16} /> Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}

// ── URL Card ─────────────────────────────────────────────────────────
function UrlCard({ url, onDelete, onEdit, onShowQr }) {
  const [copied, setCopied] = useState(false);
  const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3001';

  const handleCopy = () => {
    navigator.clipboard.writeText(url.shortUrl);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete this short link?\n${url.shortUrl}`)) return;
    try {
      await urlsAPI.delete(url.id);
      toast.success('URL deleted');
      onDelete(url.id);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDownloadQR = async () => {
    setQrLoading(true);
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(urlsAPI.qrUrl(url.id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await resp.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `qr-${url.shortCode}.png`;
      a.click();
      toast.success('QR code downloaded!');
    } catch {
      toast.error('Failed to download QR code');
    } finally {
      setQrLoading(false);
    }
  };

  const isExpired = url.expiresAt && new Date(url.expiresAt) < new Date();

  return (
    <div className="url-card">
      <div className="url-card-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <p className="url-card-title">{url.title || url.originalUrl}</p>
            {isExpired && <span className="badge badge-danger"><Clock size={10} /> Expired</span>}
            {url.expiresAt && !isExpired && <span className="badge badge-warning"><Clock size={10} /> Expires {format(new Date(url.expiresAt), 'MMM d')}</span>}
          </div>
          <p className="url-card-original">{url.originalUrl}</p>
        </div>
      </div>

      <div className="url-card-short">
        <Link2 size={14} color="var(--primary-light)" style={{ flexShrink: 0 }} />
        <a href={url.shortUrl} target="_blank" rel="noopener noreferrer" className="url-card-short-link">
          {url.shortUrl}
        </a>
      </div>

      <div className="url-card-footer">
        <span className="chip">
          <BarChart2 size={12} /> {url.totalClicks} clicks
        </span>
        <span className="chip">
          <Calendar size={12} /> {formatDistanceToNow(new Date(url.createdAt), { addSuffix: true })}
        </span>

        <div className="url-card-actions">
          <button className={`btn btn-icon btn-secondary ${copied ? 'copy-success' : ''}`} onClick={handleCopy} title="Copy short URL">
            {copied ? <CheckCircle size={15} color="var(--success-light)" /> : <Copy size={15} />}
          </button>
          <Link to={`/analytics/${url.id}`} className="btn btn-icon btn-secondary" title="View analytics">
            <BarChart2 size={15} />
          </Link>
          <button className="btn btn-icon btn-secondary" onClick={() => onEdit(url)} title="Edit URL">
            <Edit2 size={15} />
          </button>
          <button className="btn btn-icon btn-secondary" onClick={() => onShowQr(url)} title="Show QR code">
            <QrCode size={15} />
          </button>
          <a className="btn btn-icon btn-secondary" href={url.shortUrl} target="_blank" rel="noopener noreferrer" title="Open link">
            <ExternalLink size={15} />
          </a>
          <button className="btn btn-icon btn-danger" onClick={handleDelete} title="Delete URL">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Page ───────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const [urls, setUrls] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editUrl, setEditUrl] = useState(null);
  const [showBulk, setShowBulk] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);
  const searchTimeout = useRef();

  const fetchUrls = useCallback(async (page = 1, q = search) => {
    setLoading(true);
    try {
      const { data } = await urlsAPI.list({ page, limit: 20, search: q });
      setUrls(data.urls);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load URLs');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchUrls(1); }, []);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearch(q);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchUrls(1, q), 400);
  };

  const handleCreated = (newUrl) => {
    setUrls(prev => [newUrl, ...prev]);
    setPagination(p => ({ ...p, total: p.total + 1 }));
  };

  const handleDelete = (id) => {
    setUrls(prev => prev.filter(u => u.id !== id));
    setPagination(p => ({ ...p, total: Math.max(0, p.total - 1) }));
  };

  const handleUpdated = (updated) => {
    setUrls(prev => prev.map(u => u.id === updated.id ? updated : u));
    setEditUrl(null);
  };

  const totalClicks = urls.reduce((sum, u) => sum + (u.totalClicks || 0), 0);

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">My Links</h1>
          <p className="page-subtitle">Welcome back, {user?.name || user?.email} 👋</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowBulk(true)}>
          <Upload size={16} /> Bulk Upload
        </button>
      </div>

      {/* Stats Row */}
      <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <p className="stat-label">Total Links</p>
          <p className="stat-value">{pagination.total}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Clicks</p>
          <p className="stat-value">{totalClicks.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg. Clicks/Link</p>
          <p className="stat-value">{pagination.total > 0 ? (totalClicks / urls.length).toFixed(1) : '0'}</p>
        </div>
      </div>

      {/* Create Form */}
      <CreateUrlForm onCreated={handleCreated} />

      {/* Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="search-wrapper" style={{ flex: 1 }}>
          <Search size={16} className="search-icon" />
          <input className="input search-input" placeholder="Search links by URL, alias, or title…" value={search} onChange={handleSearchChange} />
        </div>
        <button className="btn btn-ghost btn-icon" onClick={() => fetchUrls(1)} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* URL List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <span className="spinner-large" />
        </div>
      ) : urls.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Link2 size={32} /></div>
          <p className="empty-title">{search ? 'No links found' : 'No links yet'}</p>
          <p className="empty-desc">{search ? 'Try a different search term.' : 'Create your first short link above!'}</p>
        </div>
      ) : (
        <div className="url-list">
          {urls.map(url => (
            <UrlCard key={url.id} url={url} onDelete={handleDelete} onEdit={setEditUrl} onShowQr={setQrUrl} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-secondary btn-sm" disabled={pagination.page <= 1}
            onClick={() => fetchUrls(pagination.page - 1)}>← Prev</button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchUrls(pagination.page + 1)}>Next →</button>
        </div>
      )}

      {/* Modals */}
      {editUrl && <EditUrlModal url={editUrl} onClose={() => setEditUrl(null)} onUpdated={handleUpdated} />}
      {showBulk && <BulkUploadModal onClose={() => setShowBulk(false)} onCreated={() => { fetchUrls(1); setShowBulk(false); }} />}
      {qrUrl && <QrModal url={qrUrl} onClose={() => setQrUrl(null)} />}
    </div>
  );
}
