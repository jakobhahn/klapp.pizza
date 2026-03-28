const { readJsonBody, sendJson, supabaseFetch } = require('../_supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = readJsonBody(req);
    const email = String(body.email || '').trim().toLowerCase();

    if (!email) {
      return sendJson(res, 400, { error: 'Missing email' });
    }

    const data = await supabaseFetch('rpc/lookup_reservations_by_email', {
      method: 'POST',
      body: JSON.stringify({
        email_input: email
      })
    });

    return sendJson(res, 200, {
      reservations: Array.isArray(data) ? data : []
    });
  } catch (error) {
    console.error(error);
    return sendJson(res, error.status || 500, {
      error: error.message || 'Failed to load reservations'
    });
  }
};
