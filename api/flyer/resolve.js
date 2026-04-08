const {
  buildFilterPath,
  clearSessionCookie,
  createScanEvent,
  getCampaignBySlug,
  getDiscountByReason,
  getRegistrationById,
  getRequestMeta,
  getSessionByToken,
  getSessionToken,
  sendJson,
  supabaseFetch
} = (() => {
  const flyer = require('../_flyer');
  const base = require('../_supabase');
  return { ...flyer, ...base };
})();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const slug = 'flyer';
    const campaign = await getCampaignBySlug(slug);

    if (!campaign) {
      return sendJson(res, 404, { error: 'Campaign not found' });
    }

    const requestMeta = getRequestMeta(req);
    const token = getSessionToken(req);
    const session = await getSessionByToken(token);
    let registration = null;
    let welcomeDiscount = null;
    let repeatDiscount = null;
    let repeatEligible = false;

    if (session) {
      registration = await getRegistrationById(session.registration_id);
      if (registration) {
        await supabaseFetch(
          buildFilterPath('flyer_sessions', { id: `eq.${session.id}` }, { schema: 'joschi' }),
          {
            method: 'PATCH',
            schema: 'joschi',
            body: JSON.stringify({
              updated_at: new Date().toISOString()
            })
          }
        );
      }
    } else if (token) {
      clearSessionCookie(res);
    }

    if (registration) {
      welcomeDiscount = await getDiscountByReason(registration.id, 'welcome_registration');
      repeatDiscount = await getDiscountByReason(registration.id, 'repeat_visit');
      repeatEligible = Boolean(
        welcomeDiscount &&
          welcomeDiscount.status === 'redeemed' &&
          (!repeatDiscount || repeatDiscount.status === 'cancelled')
      );
    }

    await createScanEvent({
      campaign_id: campaign.id,
      registration_id: registration ? registration.id : null,
      request_ip_hash: requestMeta.ipHash,
      user_agent: requestMeta.userAgent,
      referer: requestMeta.referer
    });

    return sendJson(res, 200, {
      campaign: {
        id: campaign.id,
        slug: campaign.slug,
        label: campaign.label,
        targetUrl: campaign.target_url,
        description: campaign.description
      },
      recognized: Boolean(registration && registration.email_verified_at),
      registration: registration
        ? {
            id: registration.id,
            name: registration.name,
            emailMasked: require('../_flyer').maskEmail(registration.email_normalized),
            emailVerifiedAt: registration.email_verified_at
          }
        : null,
      discounts: {
        welcome: welcomeDiscount
          ? {
              code: welcomeDiscount.code,
              status: welcomeDiscount.status,
              issuedAt: welcomeDiscount.issued_at,
              redeemedAt: welcomeDiscount.redeemed_at
            }
          : null,
        repeatVisit: repeatDiscount
          ? {
              code: repeatDiscount.code,
              status: repeatDiscount.status,
              issuedAt: repeatDiscount.issued_at,
              redeemedAt: repeatDiscount.redeemed_at
            }
          : null,
        repeatEligible
      }
    });
  } catch (error) {
    console.error(error);
    return sendJson(res, error.status || 500, {
      error: error.message || 'Failed to resolve flyer state'
    });
  }
};
