const { assertAdminPassword, readJsonBody, sendJson, supabaseFetch } = require('../_supabase');
const { buildFilterPath } = require('../_flyer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = readJsonBody(req);
    assertAdminPassword(body.password);

    const discountId = String(body.discount_id || '').trim();
    if (!discountId) {
      return sendJson(res, 400, { error: 'Missing discount_id' });
    }

    const payload = body.undo
      ? {
          status: 'issued',
          redeemed_at: null,
          redemption_reference: null,
          redeemed_by_admin: null
        }
      : {
          status: 'redeemed',
          redeemed_at: new Date().toISOString(),
          redemption_reference: String(body.redemption_reference || '').trim() || 'POS',
          redeemed_by_admin: 'admin-password'
        };

    const updated = await supabaseFetch(
      buildFilterPath('discount_codes', { id: `eq.${discountId}` }, { schema: 'joschi' }),
      {
        method: 'PATCH',
        schema: 'joschi',
        body: JSON.stringify(payload)
      }
    );

    return sendJson(res, 200, {
      discount: Array.isArray(updated) ? updated[0] || null : updated || null
    });
  } catch (error) {
    console.error(error);
    return sendJson(res, error.status || 500, {
      error: error.message || 'Failed to update flyer discount status'
    });
  }
};
