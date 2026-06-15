const { v4: uuidv4 } = require('uuid');

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SHORT_CODE_LENGTH = 6;

/**
 * Generate a random short code of given length
 */
function generateShortCode(length = SHORT_CODE_LENGTH) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

/**
 * Generate a unique short code, checking against the DB for collisions
 */
async function generateUniqueShortCode(pool, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateShortCode();
    const result = await pool.query(
      'SELECT id FROM urls WHERE short_code = $1',
      [code]
    );
    if (result.rows.length === 0) {
      return code;
    }
  }
  // Fallback: use a longer code
  return generateShortCode(SHORT_CODE_LENGTH + 2);
}

/**
 * Validate if a string is a proper URL
 */
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize URL - ensure it has a protocol
 */
function sanitizeUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}

module.exports = { generateUniqueShortCode, generateShortCode, isValidUrl, sanitizeUrl };
