const { hasMailConfig, sendFlyerDiscountEmail } = require('../_mailer');
const { sendJson } = require('../_supabase');
const {
  createDiscountCode,
  createSessionToken,
  getCampaignBySlug,
  getDiscountByReason,
  getRegistrationById,
  getSessionByToken,
  getSessionToken,
  hashValue,
  setSessionCookie,
  supabaseFetch
} = require('../_flyer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const slug = 'flyer';
    const token = getSessionToken(req);
    const session = await getSessionByToken(token);

    if (!session) {
      return sendJson(res, 401, { error: 'Session expired' });
    }

    const campaign = await getCampaignBySlug(slug);
    const registration = await getRegistrationById(session.registration_id);

    if (!campaign || !registration || !registration.email_verified_at) {
      return sendJson(res, 404, { error: 'Registration not found' });
    }

    const welcomeDiscount = await getDiscountByReason(registration.id, 'welcome_registration');
    if (!welcomeDiscount || welcomeDiscount.status !== 'redeemed') {
      return sendJson(res, 409, {
        error: 'Repeat-visit code is only available after the welcome code has been redeemed'
      });
    }

    let repeatDiscount = await getDiscountByReason(registration.id, 'repeat_visit');
    if (!repeatDiscount) {
      if (!hasMailConfig()) {
        return sendJson(res, 500, { error: 'SMTP is not configured' });
      }

      const inserted = await supabaseFetch('discount_codes', {
        method: 'POST',
        schema: 'joschi',
        body: JSON.stringify({
          campaign_id: campaign.id,
          registration_id: registration.id,
          code: createDiscountCode(5),
          discount_percent: 5,
          reason: 'repeat_visit',
          status: 'issued',
          eligible_after_redemption_id: welcomeDiscount.id
        })
      });
      repeatDiscount = Array.isArray(inserted) ? inserted[0] : inserted;

      await sendFlyerDiscountEmail({
        name: registration.name,
        email: registration.email_normalized,
        code: repeatDiscount.code,
        discountPercent: 5,
        note: 'Dieser Code gilt fuer deinen naechsten separaten Besuch.'
      });
    }

    const sessionToken = createSessionToken();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    await supabaseFetch(
      require('../_flyer').buildFilterPath('flyer_sessions', { id: `eq.${session.id}` }, { schema: 'joschi' }),
      {
        method: 'PATCH',
        schema: 'joschi',
        body: JSON.stringify({
          token_hash: hashValue(sessionToken),
          expires_at: expiresAt
        })
      }
    );

    setSessionCookie(res, sessionToken);

    return sendJson(res, 200, {
      message: 'Repeat-visit code sent',
      code: repeatDiscount.code,
      status: repeatDiscount.status
    });
  } catch (error) {
    console.error(error);
    return sendJson(res, error.status || 500, {
      error: error.message || 'Failed to issue repeat-visit code'
    });
  }
};
