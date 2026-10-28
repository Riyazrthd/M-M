// Indus Fire Safety Private Limited - Production QR URL & Token Resolver Helper
// Implements Master Prompt & Fix QR Scanning specifications:
// - Permanent URL structure: https://riyazrthd.github.io/M-M/qr/UNIQUE_TOKEN
// - Canonical production domain detection
// - Universal token parsing for phone cameras, web browsers, and in-app scanners

export const PRODUCTION_DOMAIN = 'https://riyazrthd.github.io/M-M';

/**
 * Returns the canonical base URL for the deployed application.
 * Defaults to the live deployed GitHub Pages domain so that printed physical labels
 * scanned with any smartphone camera always open the live production application.
 */
export function getAppBaseUrl() {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || '';
    const origin = window.location.origin || '';
    if (hostname.includes('github.io')) {
      return 'https://riyazrthd.github.io/M-M';
    }
    // For localhost or mock environments, default physical printed tags to production domain so mobile camera works over cellular/Wi-Fi
    if (hostname === 'localhost' || hostname === '127.0.0.1' || !hostname) {
      return 'https://riyazrthd.github.io/M-M';
    }
    // For other custom production domains or company intranet
    const cleanPath = (window.location.pathname || '').replace(/\/+$/, '');
    return `${origin}${cleanPath}` || PRODUCTION_DOMAIN;
  }
  return PRODUCTION_DOMAIN;
}

/**
 * Build the exact permanent URL for a QR code token.
 * Complies strictly with the prompt requirement:
 * https://YOUR-ACTUAL-APP-DOMAIN/qr/UNIQUE_TOKEN
 * 
 * @param {string} token - Unique permanent QR token (e.g. 'IFS-QR-000001')
 * @param {Object} options - Customization options
 * @returns {string} Fully qualified production URL
 */
export function buildQRScanUrl(token, options = {}) {
  if (!token) return getAppBaseUrl();
  const clean = String(token).trim();
  const baseUrl = options.baseUrl || getAppBaseUrl();
  return `${baseUrl.replace(/\/+$/, '')}/qr/${encodeURIComponent(clean)}`;
}

/**
 * Parse a raw scanned input string into its canonical QR token.
 * Handles:
 * 1. Standard URL: https://riyazrthd.github.io/M-M/qr/IFS-QR-000001
 * 2. Query URL: https://riyazrthd.github.io/M-M/?qr=IFS-QR-000001 or ?scan=...
 * 3. Hash URL: https://riyazrthd.github.io/M-M/#/qr/IFS-QR-000001
 * 4. Legacy URL: https://riyazrthd.github.io/M-M/docs/?scan=POS-AIL-001
 * 5. Direct token: "IFS-QR-000001", "QR-POS-AIL-001", "POS-AIL-001"
 * 
 * @param {string} input - Scanned payload from camera or user input
 * @returns {string} Clean decoded token
 */
export function parseScannedQRToken(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();

  // 1. Path-based route: /qr/TOKEN, /scan/TOKEN, /pos/TOKEN, /tag/TOKEN
  const pathMatch = trimmed.match(/(?:\/qr\/|\/scan\/|\/pos\/|\/tag\/)([^\/\?\#\s]+)/i);
  if (pathMatch && pathMatch[1]) {
    return decodeURIComponent(pathMatch[1]).trim();
  }

  // 2. Query param based URL: ?qr=TOKEN, ?scan=TOKEN, ?pos=TOKEN, ?id=TOKEN, ?token=TOKEN
  try {
    if (trimmed.includes('?') || trimmed.includes('&')) {
      const queryString = trimmed.includes('?') ? trimmed.split('?')[1] : trimmed;
      const params = new URLSearchParams(queryString.split('#')[0]);
      const tokenParam = params.get('qr') || params.get('scan') || params.get('pos') || params.get('id') || params.get('token');
      if (tokenParam) return decodeURIComponent(tokenParam).trim();
    }
  } catch (e) {}

  // 3. Hash-based route: #/qr/TOKEN
  const hashMatch = trimmed.match(/#(?:.*?\/)?(?:qr|scan|pos)\/([^\/\?\#\s]+)/i);
  if (hashMatch && hashMatch[1]) {
    return decodeURIComponent(hashMatch[1]).trim();
  }

  // 4. Raw token or position code: e.g. "IFS-QR-000001", "QR-POS-AIL-001", "POS-AIL-001"
  return trimmed;
}
