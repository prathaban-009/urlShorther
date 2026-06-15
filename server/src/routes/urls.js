const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const csv = require('csv-parser');
const QRCode = require('qrcode');
const { Readable } = require('stream');
const { pool } = require('../db/pool');
const { authenticateToken } = require('../utils/jwt');
const { generateUniqueShortCode, isValidUrl, sanitizeUrl } = require('../utils/shortCode');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// Validation
const createUrlValidation = [
  body('originalUrl').notEmpty().withMessage('URL is required'),
  body('customAlias')
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Alias can only contain letters, numbers, hyphens, and underscores')
    .isLength({ min: 3, max: 50 })
    .withMessage('Alias must be 3-50 characters'),
  body('title').optional().trim().isLength({ max: 500 }),
  body('expiresAt').optional().isISO8601().withMessage('Invalid expiry date format'),
];

// Helper: build full short URL
function buildShortUrl(code) {
  return `${BASE_URL}/${code}`;
}

// Helper: format URL row for API response
function formatUrl(row, clickCount = 0) {
  return {
    id: row.id,
    originalUrl: row.original_url,
    shortCode: row.custom_alias || row.short_code,
    shortUrl: buildShortUrl(row.custom_alias || row.short_code),
    title: row.title,
    expiresAt: row.expires_at,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    totalClicks: parseInt(clickCount, 10) || 0,
  };
}

// POST /api/urls — Create a short URL
router.post('/', authenticateToken, createUrlValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let { originalUrl, customAlias, title, expiresAt } = req.body;

  // Sanitize URL
  originalUrl = sanitizeUrl(originalUrl.trim());

  if (!isValidUrl(originalUrl)) {
    return res.status(400).json({ error: 'Invalid URL format. Must start with http:// or https://' });
  }

  try {
    // Check custom alias uniqueness
    if (customAlias) {
      const aliasCheck = await pool.query(
        'SELECT id FROM urls WHERE custom_alias = $1 OR short_code = $1',
        [customAlias]
      );
      if (aliasCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Custom alias already taken' });
      }
    }

    // Generate unique short code
    const shortCode = await generateUniqueShortCode(pool);

    const result = await pool.query(
      `INSERT INTO urls (user_id, original_url, short_code, custom_alias, title, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, originalUrl, shortCode, customAlias || null, title || null, expiresAt || null]
    );

    const url = result.rows[0];
    res.status(201).json({ message: 'Short URL created', url: formatUrl(url, 0) });
  } catch (err) {
    console.error('Create URL error:', err);
    res.status(500).json({ error: 'Failed to create short URL' });
  }
});

// GET /api/urls — List all URLs for current user
router.get('/', authenticateToken, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  try {
    let query = `
      SELECT u.*, COUNT(a.id) AS click_count
      FROM urls u
      LEFT JOIN analytics a ON a.url_id = u.id
      WHERE u.user_id = $1
    `;
    const params = [req.user.id];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.original_url ILIKE $${params.length} OR u.short_code ILIKE $${params.length} OR u.custom_alias ILIKE $${params.length} OR u.title ILIKE $${params.length})`;
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) FROM urls WHERE user_id = $1
      ${search ? `AND (original_url ILIKE $2 OR short_code ILIKE $2 OR custom_alias ILIKE $2 OR title ILIKE $2)` : ''}
    `;
    const countParams = search ? [req.user.id, `%${search}%`] : [req.user.id];

    const [urlsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    const urls = urlsResult.rows.map((row) => formatUrl(row, row.click_count));

    res.json({
      urls,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('List URLs error:', err);
    res.status(500).json({ error: 'Failed to fetch URLs' });
  }
});

// GET /api/urls/:id — Get single URL details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.*, COUNT(a.id) AS click_count
       FROM urls u
       LEFT JOIN analytics a ON a.url_id = u.id
       WHERE u.id = $1 AND u.user_id = $2
       GROUP BY u.id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'URL not found' });
    }

    res.json({ url: formatUrl(result.rows[0], result.rows[0].click_count) });
  } catch (err) {
    console.error('Get URL error:', err);
    res.status(500).json({ error: 'Failed to fetch URL' });
  }
});

// PATCH /api/urls/:id — Edit a URL
router.patch('/:id', authenticateToken, [
  body('originalUrl').optional().notEmpty(),
  body('title').optional().trim().isLength({ max: 500 }),
  body('expiresAt').optional().isISO8601(),
  body('isActive').optional().isBoolean(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { originalUrl, title, expiresAt, isActive } = req.body;

  try {
    // Verify ownership
    const check = await pool.query('SELECT id FROM urls WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (originalUrl !== undefined) {
      const sanitized = sanitizeUrl(originalUrl.trim());
      if (!isValidUrl(sanitized)) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
      updates.push(`original_url = $${paramIndex++}`);
      params.push(sanitized);
    }
    if (title !== undefined) { updates.push(`title = $${paramIndex++}`); params.push(title); }
    if (expiresAt !== undefined) { updates.push(`expires_at = $${paramIndex++}`); params.push(expiresAt || null); }
    if (isActive !== undefined) { updates.push(`is_active = $${paramIndex++}`); params.push(isActive); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    params.push(req.params.id, req.user.id);

    const result = await pool.query(
      `UPDATE urls SET ${updates.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`,
      params
    );

    res.json({ message: 'URL updated', url: formatUrl(result.rows[0]) });
  } catch (err) {
    console.error('Update URL error:', err);
    res.status(500).json({ error: 'Failed to update URL' });
  }
});

// DELETE /api/urls/:id — Delete a URL
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM urls WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'URL not found' });
    }

    res.json({ message: 'URL deleted successfully' });
  } catch (err) {
    console.error('Delete URL error:', err);
    res.status(500).json({ error: 'Failed to delete URL' });
  }
});

// GET /api/urls/:id/analytics — Detailed analytics
router.get('/:id/analytics', authenticateToken, async (req, res) => {
  try {
    // Verify ownership
    const urlResult = await pool.query(
      `SELECT u.*, COUNT(a.id) AS total_clicks, MAX(a.visited_at) AS last_visited
       FROM urls u
       LEFT JOIN analytics a ON a.url_id = u.id
       WHERE u.id = $1 AND u.user_id = $2
       GROUP BY u.id`,
      [req.params.id, req.user.id]
    );

    if (urlResult.rows.length === 0) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const urlData = urlResult.rows[0];

    // Recent visits (last 50)
    const recentVisits = await pool.query(
      `SELECT visited_at, ip_address, country, city, device_type, browser, os, referrer
       FROM analytics WHERE url_id = $1
       ORDER BY visited_at DESC LIMIT 50`,
      [req.params.id]
    );

    // Daily clicks (last 30 days)
    const dailyClicks = await pool.query(
      `SELECT DATE(visited_at) AS date, COUNT(*) AS clicks
       FROM analytics
       WHERE url_id = $1 AND visited_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(visited_at)
       ORDER BY date ASC`,
      [req.params.id]
    );

    // Device breakdown
    const deviceBreakdown = await pool.query(
      `SELECT device_type, COUNT(*) AS count
       FROM analytics WHERE url_id = $1 AND device_type IS NOT NULL
       GROUP BY device_type ORDER BY count DESC`,
      [req.params.id]
    );

    // Browser breakdown
    const browserBreakdown = await pool.query(
      `SELECT browser, COUNT(*) AS count
       FROM analytics WHERE url_id = $1 AND browser IS NOT NULL
       GROUP BY browser ORDER BY count DESC LIMIT 10`,
      [req.params.id]
    );

    // Country breakdown
    const countryBreakdown = await pool.query(
      `SELECT country, COUNT(*) AS count
       FROM analytics WHERE url_id = $1 AND country IS NOT NULL
       GROUP BY country ORDER BY count DESC LIMIT 10`,
      [req.params.id]
    );

    res.json({
      url: formatUrl(urlData, urlData.total_clicks),
      stats: {
        totalClicks: parseInt(urlData.total_clicks, 10) || 0,
        lastVisited: urlData.last_visited,
        recentVisits: recentVisits.rows,
        dailyClicks: dailyClicks.rows,
        deviceBreakdown: deviceBreakdown.rows,
        browserBreakdown: browserBreakdown.rows,
        countryBreakdown: countryBreakdown.rows,
      },
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/urls/:id/qr — Generate QR code as PNG
router.get('/:id/qr', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT short_code, custom_alias FROM urls WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const { short_code, custom_alias } = result.rows[0];
    const shortUrl = buildShortUrl(custom_alias || short_code);

    const qrBuffer = await QRCode.toBuffer(shortUrl, {
      type: 'png',
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `attachment; filename="qr-${short_code}.png"`);
    res.send(qrBuffer);
  } catch (err) {
    console.error('QR code error:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// POST /api/urls/bulk — Bulk URL shortening via CSV
router.post('/bulk', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'CSV file is required' });
  }

  const results = [];
  const errors = [];
  const client = await pool.connect();

  try {
    const readable = Readable.from(req.file.buffer.toString());
    const rows = [];

    await new Promise((resolve, reject) => {
      readable
        .pipe(csv({ headers: ['url', 'title', 'alias'], skipLines: 0 }))
        .on('data', (data) => rows.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    await client.query('BEGIN');

    for (const row of rows) {
      const rawUrl = (row.url || '').trim();
      if (!rawUrl) continue;

      const originalUrl = sanitizeUrl(rawUrl);
      if (!isValidUrl(originalUrl)) {
        errors.push({ url: rawUrl, error: 'Invalid URL format' });
        continue;
      }

      try {
        const shortCode = await generateUniqueShortCode(pool);
        const customAlias = row.alias ? row.alias.trim() : null;

        const result = await client.query(
          `INSERT INTO urls (user_id, original_url, short_code, custom_alias, title)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (short_code) DO NOTHING
           RETURNING *`,
          [req.user.id, originalUrl, shortCode, customAlias || null, row.title || null]
        );

        if (result.rows.length > 0) {
          results.push(formatUrl(result.rows[0], 0));
        }
      } catch (rowErr) {
        errors.push({ url: rawUrl, error: rowErr.message });
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ created: results.length, results, errors });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Bulk upload error:', err);
    res.status(500).json({ error: 'Bulk upload failed' });
  } finally {
    client.release();
  }
});

module.exports = router;
