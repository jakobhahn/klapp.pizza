const { assertAdminPassword, readJsonBody, sendJson, supabaseFetch } = require('../_supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = readJsonBody(req);
    assertAdminPassword(body.password);

    const reservationId = String(body.reservation_id || '').trim();
    if (!reservationId) {
      return sendJson(res, 400, { error: 'Missing reservation_id' });
    }

    const data = await supabaseFetch('rpc/admin_confirm_reservation', {
      method: 'POST',
      body: JSON.stringify({
        reservation_id_input: reservationId
      })
    });

    return sendJson(res, 200, {
      reservation: data
    });
  } catch (error) {
    console.error(error);
    return sendJson(res, error.status || 500, {
      error: error.message || 'Failed to confirm reservation'
    });
  }
};
