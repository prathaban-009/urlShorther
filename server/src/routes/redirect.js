const express = require('express');
const UAParser = require('ua-parser-js');
const { pool } = require('../db/pool');

const router = express.Router();

/**
 * GET /:shortCode — Redirect to original URL and track analytics
 */
router.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  // Skip system paths
  if (['api', 'favicon.ico', 'robots.txt', 'sitemap.xml'].includes(shortCode)) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    // Find URL by short code or custom alias
    const result = await pool.query(
      `SELECT * FROM urls WHERE (short_code = $1 OR custom_alias = $1) AND is_active = TRUE`,
      [shortCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link Not Found</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f0f1a; color: #fff; }
            .container { text-align: center; }
            h1 { font-size: 4rem; margin: 0; color: #a78bfa; }
            p { color: #94a3b8; font-size: 1.1rem; }
            a { color: #a78bfa; text-decoration: none; border: 1px solid #a78bfa; padding: 0.5rem 1.5rem; border-radius: 8px; display: inline-block; margin-top: 1rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>404</h1>
            <p>This short link doesn't exist or has been removed.</p>
            <a href="http://localhost:5173">Go Home</a>
          </div>
        </body>
        </html>
      `);
    }

    const url = result.rows[0];

    // Check if link has expired
    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link Expired</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f0f1a; color: #fff; }
            .container { text-align: center; }
            h1 { font-size: 2rem; margin: 0; color: #f87171; }
            p { color: #94a3b8; font-size: 1.1rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⏰ Link Expired</h1>
            <p>This short link has expired and is no longer available.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Parse user agent
    const userAgentString = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgentString);
    const ua = parser.getResult();

    const browser = ua.browser?.name || null;
    const os = ua.os?.name || null;
    let deviceType = 'desktop';
    if (ua.device?.type === 'mobile') deviceType = 'mobile';
    else if (ua.device?.type === 'tablet') deviceType = 'tablet';

    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || null;
    const referrer = req.headers['referer'] || req.headers['referrer'] || null;

    // Track analytics asynchronously (don't block redirect)
    setImmediate(async () => {
      try {
        // Try to get geolocation from IP
        let country = null;
        let city = null;
        if (ipAddress && ipAddress !== '::1' && ipAddress !== '127.0.0.1') {
          try {
            const geoResponse = await fetch(`http://ip-api.com/json/${ipAddress}?fields=country,city,status`, {
              signal: AbortSignal.timeout(2000),
            });
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              if (geoData.status === 'success') {
                country = geoData.country;
                city = geoData.city;
              }
            }
          } catch {
            // Geo lookup failed, continue without it
          }
        }

        await pool.query(
          `INSERT INTO analytics (url_id, ip_address, user_agent, referrer, country, city, device_type, browser, os)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [url.id, ipAddress, userAgentString, referrer, country, city, deviceType, browser, os]
        );
      } catch (analyticsErr) {
        console.error('Analytics tracking failed:', analyticsErr);
      }
    });

    // Redirect to original URL
    res.redirect(301, url.original_url);
  } catch (err) {
    console.error('Redirect error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
