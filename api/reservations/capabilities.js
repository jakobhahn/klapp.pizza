const { sendJson } = require('../_supabase');
const {
  getReservationCapabilities,
  isValidDateString
} = require('../_reservation-rules');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const date = String((req.query && req.query.date) || '').trim();
  if (date && !isValidDateString(date)) {
    return sendJson(res, 400, { error: 'Invalid date. Use YYYY-MM-DD.' });
  }

  return sendJson(res, 200, getReservationCapabilities(date || null));
};
