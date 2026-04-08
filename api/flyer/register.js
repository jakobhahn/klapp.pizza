const { hasMailConfig, sendFlyerVerificationCodeEmail } = require('../_mailer');
const { readJsonBody, sendJson, supabaseFetch } = require('../_supabase');
const {
  buildFilterPath,
  createVerificationCode,
  getCampaignBySlug,
  getRegistrationByEmail,
  getRequestMeta,
  hashValue,
  normalizeEmail,
  normalizeName
} = require('../_flyer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = readJsonBody(req);
    const slug = 'flyer';
    const name = normalizeName(body.name);
    const email = normalizeEmail(body.email);
    const marketingConsent = Boolean(body.marketing_consent);
    const consentVersion = 'flyer-v1';
    const campaign = await getCampaignBySlug(slug);

    if (!campaign) {
      return sendJson(res, 404, { error: 'Campaign not found' });
    }

    if (!name || !email) {
      return sendJson(res, 400, { error: 'Missing name or email' });
    }

    if (!hasMailConfig()) {
      return sendJson(res, 500, { error: 'SMTP is not configured' });
    }

    const requestMeta = getRequestMeta(req);
    const existing = await getRegistrationByEmail(campaign.id, email);
    const nowIso = new Date().toISOString();
    let registration = null;

    if (existing) {
      const payload = {
        name,
        last_scan_at: nowIso,
        service_email_accepted_at: nowIso
      };

      if (marketingConsent && !existing.marketing_consent_granted_at) {
        payload.marketing_consent_granted_at = nowIso;
        payload.marketing_consent_text_version = consentVersion;
      }

      const updated = await supabaseFetch(
        buildFilterPath('lead_registrations', { id: `eq.${existing.id}` }, { schema: 'joschi' }),
        {
          method: 'PATCH',
          schema: 'joschi',
          body: JSON.stringify(payload)
        }
      );
      registration = Array.isArray(updated) ? updated[0] : updated;
    } else {
      const inserted = await supabaseFetch('lead_registrations', {
        method: 'POST',
        schema: 'joschi',
        body: JSON.stringify({
          campaign_id: campaign.id,
          name,
          email_normalized: email,
          first_scan_at: nowIso,
          last_scan_at: nowIso,
          service_email_accepted_at: nowIso,
          marketing_consent_granted_at: marketingConsent ? nowIso : null,
          marketing_consent_text_version: marketingConsent ? consentVersion : null
        })
      });
      registration = Array.isArray(inserted) ? inserted[0] : inserted;
    }

    const code = createVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabaseFetch('email_verification_codes', {
      method: 'POST',
      schema: 'joschi',
      body: JSON.stringify({
        registration_id: registration.id,
        code_hash: hashValue(code),
        expires_at: expiresAt
      })
    });

    await sendFlyerVerificationCodeEmail({
      name,
      email,
      code
    });

    return sendJson(res, 200, {
      message: 'Verification code sent',
      emailMasked: require('../_flyer').maskEmail(email),
      expiresAt,
      alreadyVerified: Boolean(registration.email_verified_at),
      requestMeta: {
        ipTracked: Boolean(requestMeta.ipHash)
      }
    });
  } catch (error) {
    console.error(error);
    return sendJson(res, error.status || 500, {
      error: error.message || 'Failed to register flyer user'
    });
  }
};
