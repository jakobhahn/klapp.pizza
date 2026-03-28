const { assertAdminPassword, readJsonBody, sendJson, supabaseFetch } = require('../_supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = readJsonBody(req);
    assertAdminPassword(body.password);

    const data = await supabaseFetch('rpc/admin_list_upcoming_reservations', {
      method: 'POST',
      body: JSON.stringify({})
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
