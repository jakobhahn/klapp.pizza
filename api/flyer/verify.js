const { hasMailConfig, sendFlyerDiscountEmail } = require('../_mailer');
const { readJsonBody, sendJson, supabaseFetch } = require('../_supabase');
const {
  buildFilterPath,
  createDiscountCode,
  createSessionToken,
  fetchFirst,
  getCampaignBySlug,
  getDiscountByReason,
  getRegistrationByEmail,
  hashValue,
  normalizeEmail,
  setSessionCookie
} = require('../_flyer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = readJsonBody(req);
    const slug = 'flyer';
    const email = normalizeEmail(body.email);
    const code = String(body.code || '').trim();
    const campaign = await getCampaignBySlug(slug);

    if (!campaign) {
      return sendJson(res, 404, { error: 'Campaign not found' });
    }

    if (!email || !code) {
      return sendJson(res, 400, { error: 'Missing email or code' });
    }

    const registration = await getRegistrationByEmail(campaign.id, email);
    if (!registration) {
      return sendJson(res, 404, { error: 'Registration not found' });
    }

    const verification = await fetchFirst(
      buildFilterPath(
        'email_verification_codes',
        {
          registration_id: `eq.${registration.id}`,
          consumed_at: 'is.null',
          expires_at: `gte.${new Date().toISOString()}`
        },
        { schema: 'joschi', order: 'created_at.desc', limit: 1 }
      ),
      { schema: 'joschi' }
    );

    if (!verification) {
      return sendJson(res, 400, { error: 'Verification code expired or missing' });
    }

    const attempts = Number(verification.attempt_count || 0);
    if (attempts >= 5) {
      return sendJson(res, 429, { error: 'Too many verification attempts' });
    }

    if (verification.code_hash !== hashValue(code)) {
      await supabaseFetch(
        buildFilterPath('email_verification_codes', { id: `eq.${verification.id}` }, { schema: 'joschi' }),
        {
          method: 'PATCH',
          schema: 'joschi',
          body: JSON.stringify({
            attempt_count: attempts + 1
          })
        }
      );
      return sendJson(res, 400, { error: 'Invalid verification code' });
    }

    const nowIso = new Date().toISOString();

    await supabaseFetch(
      buildFilterPath('email_verification_codes', { id: `eq.${verification.id}` }, { schema: 'joschi' }),
      {
        method: 'PATCH',
        schema: 'joschi',
        body: JSON.stringify({
          consumed_at: nowIso,
          attempt_count: attempts + 1
        })
      }
    );

    await supabaseFetch(
      buildFilterPath('lead_registrations', { id: `eq.${registration.id}` }, { schema: 'joschi' }),
      {
        method: 'PATCH',
        schema: 'joschi',
        body: JSON.stringify({
          email_verified_at: registration.email_verified_at || nowIso,
          last_scan_at: nowIso
        })
      }
    );

    if (!hasMailConfig()) {
      return sendJson(res, 500, { error: 'SMTP is not configured' });
    }

    let welcomeDiscount = await getDiscountByReason(registration.id, 'welcome_registration');
    if (!welcomeDiscount) {
      const inserted = await supabaseFetch('discount_codes', {
        method: 'POST',
        schema: 'joschi',
        body: JSON.stringify({
          campaign_id: campaign.id,
          registration_id: registration.id,
          code: createDiscountCode(10),
          discount_percent: 10,
          reason: 'welcome_registration',
          status: 'issued'
        })
      });
      welcomeDiscount = Array.isArray(inserted) ? inserted[0] : inserted;

      await sendFlyerDiscountEmail({
        name: registration.name,
        email,
        code: welcomeDiscount.code,
        discountPercent: 10,
        note: 'Das ist dein einmaliger Willkommensrabatt.'
      });
    }

    const sessionToken = createSessionToken();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    await supabaseFetch('flyer_sessions', {
      method: 'POST',
      schema: 'joschi',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify({
        registration_id: registration.id,
        token_hash: hashValue(sessionToken),
        expires_at: expiresAt
      })
    });

    setSessionCookie(res, sessionToken);

    return sendJson(res, 200, {
      message: 'Verified',
      targetUrl: campaign.target_url,
      welcomeDiscountSent: true,
      welcomeDiscountCode: welcomeDiscount.code
    });
  } catch (error) {
    console.error(error);
    return sendJson(res, error.status || 500, {
      error: error.message || 'Failed to verify flyer user'
    });
  }
};
