const { assertAdminPassword, readJsonBody, sendJson, supabaseFetch } = require('../_supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = readJsonBody(req);
    assertAdminPassword(body.password);

    const codes = await supabaseFetch('admin_flyer_code_view?select=*&order=issued_at.desc', { schema: 'public' });

    return sendJson(res, 200, {
      codes: Array.isArray(codes) ? codes : []
    });
  } catch (error) {
    console.error(error);
    return sendJson(res, error.status || 500, {
      error: error.message || 'Failed to load flyer discount codes'
    });
  }
};
