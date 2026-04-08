const crypto = require('node:crypto');
const { supabaseFetch } = require('./_supabase');

const FLYER_SESSION_COOKIE = 'joschi_flyer_session';
const FLYER_SESSION_TTL_SECONDS = 90 * 24 * 60 * 60;

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const pairs = header.split(';');
  const cookies = {};

  for (const pair of pairs) {
    const index = pair.indexOf('=');
    if (index === -1) continue;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (key) {
      cookies[key] = decodeURIComponent(value);
    }
  }

  return cookies;
}

function setSessionCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    `${FLYER_SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${FLYER_SESSION_TTL_SECONDS}; Path=/; HttpOnly; SameSite=Lax`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${FLYER_SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`
  );
}

function getSessionToken(req) {
  const cookies = parseCookies(req);
  return cookies[FLYER_SESSION_COOKIE] || '';
}

function buildFilterPath(table, filters, options = {}) {
  const params = new URLSearchParams();
  params.set('select', options.select || '*');

  for (const [key, value] of Object.entries(filters || {})) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, value);
  }

  if (options.order) {
    params.set('order', options.order);
  }

  if (options.limit) {
    params.set('limit', String(options.limit));
  }

  return `${table}?${params.toString()}`;
}

async function fetchFirst(path, options = {}) {
  const data = await supabaseFetch(path, options);
  if (Array.isArray(data)) {
    return data[0] || null;
  }
  return data || null;
}

function normalizeEmail(input) {
  return String(input || '').trim().toLowerCase();
}

function normalizeName(input) {
  return String(input || '').trim().replace(/\s+/g, ' ');
}

function hashValue(input) {
  return crypto.createHash('sha256').update(String(input || ''), 'utf8').digest('hex');
}

function createVerificationCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function createSessionToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function createDiscountCode(percent) {
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `JOSHI${percent}-${suffix}`;
}

function getRequestMeta(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const remote = req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : '';
  const ip = forwarded || remote || '';
  return {
    ipHash: ip ? hashValue(ip) : null,
    userAgent: String(req.headers['user-agent'] || ''),
    referer: String(req.headers.referer || '')
  };
}

function maskEmail(email) {
  const normalized = normalizeEmail(email);
  const parts = normalized.split('@');
  if (parts.length !== 2) return normalized;
  const local = parts[0];
  if (local.length <= 2) {
    return `${local[0] || '*'}*@${parts[1]}`;
  }
  return `${local.slice(0, 2)}***@${parts[1]}`;
}

async function getCampaignBySlug(slug) {
  return fetchFirst(
    buildFilterPath(
      'campaign_redirects',
      {
        slug: `eq.${slug}`,
        is_active: 'eq.true'
      },
      { schema: 'joschi', limit: 1 }
    ),
    { schema: 'joschi' }
  );
}

async function getSessionByToken(token) {
  if (!token) return null;
  const tokenHash = hashValue(token);
  const nowIso = new Date().toISOString();
  return fetchFirst(
    buildFilterPath(
      'flyer_sessions',
      {
        token_hash: `eq.${tokenHash}`,
        expires_at: `gte.${nowIso}`
      },
      { schema: 'joschi', limit: 1 }
    ),
    { schema: 'joschi' }
  );
}

async function getRegistrationById(id) {
  if (!id) return null;
  return fetchFirst(
    buildFilterPath('lead_registrations', { id: `eq.${id}` }, { schema: 'joschi', limit: 1 }),
    { schema: 'joschi' }
  );
}

async function getRegistrationByEmail(campaignId, email) {
  return fetchFirst(
    buildFilterPath(
      'lead_registrations',
      {
        campaign_id: `eq.${campaignId}`,
        email_normalized: `eq.${email}`
      },
      { schema: 'joschi', limit: 1 }
    ),
    { schema: 'joschi' }
  );
}

async function getDiscountByReason(registrationId, reason) {
  return fetchFirst(
    buildFilterPath(
      'discount_codes',
      {
        registration_id: `eq.${registrationId}`,
        reason: `eq.${reason}`
      },
      { schema: 'joschi', order: 'issued_at.desc', limit: 1 }
    ),
    { schema: 'joschi' }
  );
}

async function createScanEvent(payload) {
  return supabaseFetch('scan_events', {
    method: 'POST',
    schema: 'joschi',
    body: JSON.stringify(payload)
  });
}

module.exports = {
  FLYER_SESSION_TTL_SECONDS,
  buildFilterPath,
  clearSessionCookie,
  createDiscountCode,
  createScanEvent,
  createSessionToken,
  createVerificationCode,
  fetchFirst,
  getCampaignBySlug,
  getDiscountByReason,
  getRegistrationByEmail,
  getRegistrationById,
  getRequestMeta,
  getSessionByToken,
  getSessionToken,
  hashValue,
  maskEmail,
  normalizeEmail,
  normalizeName,
  setSessionCookie,
  supabaseFetch
};
