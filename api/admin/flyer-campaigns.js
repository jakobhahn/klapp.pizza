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

    if (body.update && body.campaign_id) {
      const payload = {};
      if (body.target_url) payload.target_url = String(body.target_url).trim();
      if (typeof body.is_active === 'boolean') payload.is_active = body.is_active;
      if (body.label) payload.label = String(body.label).trim();
      if (body.description !== undefined) payload.description = String(body.description || '').trim();

      await supabaseFetch(
        buildFilterPath('campaign_redirects', { id: `eq.${body.campaign_id}` }, { schema: 'joschi' }),
        {
          method: 'PATCH',
          schema: 'joschi',
          body: JSON.stringify(payload)
        }
      );
    }

    const campaigns = await supabaseFetch(
      buildFilterPath('campaign_redirects', {}, { schema: 'joschi', order: 'created_at.asc' }),
      { schema: 'joschi' }
    );

    return sendJson(res, 200, {
      campaigns: Array.isArray(campaigns) ? campaigns : []
    });
  } catch (error) {
    console.error(error);
    return sendJson(res, error.status || 500, {
      error: error.message || 'Failed to load flyer campaigns'
    });
  }
};
