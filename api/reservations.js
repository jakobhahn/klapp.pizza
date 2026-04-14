const { readJsonBody, sendJson, supabaseFetch } = require('./_supabase');
const { hasMailConfig, sendReservationRequestEmails } = require('./_mailer');
const {
  MAX_PARTY_SIZE,
  getOpenTimesForDate,
  normalizeArea,
  normalizeReservationTime
} = require('./_reservation-rules');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = readJsonBody(req);
    const requiredFields = [
      'guest_name',
      'guest_phone',
      'guest_email',
      'party_size',
      'area',
      'reservation_date',
      'reservation_time'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return sendJson(res, 400, { error: `Missing field: ${field}` });
      }
    }

    const payload = {
      guest_name: String(body.guest_name).trim(),
      guest_phone: String(body.guest_phone).trim(),
      guest_email: String(body.guest_email).trim().toLowerCase(),
      party_size: Number(body.party_size),
      area: normalizeArea(body.area),
      reservation_date: body.reservation_date,
      reservation_time: normalizeReservationTime(body.reservation_time),
      notes: String(body.notes || '').trim()
    };
    const agent = body.agent && typeof body.agent === 'object' && !Array.isArray(body.agent)
      ? body.agent
      : null;

    if (!Number.isInteger(payload.party_size) || payload.party_size < 1) {
      return sendJson(res, 400, { error: 'Invalid party size' });
    }

    const maxPartySize = MAX_PARTY_SIZE[payload.area];
    if (payload.party_size > maxPartySize) {
      return sendJson(res, 400, { error: `Max party size for ${payload.area} is ${maxPartySize}` });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(payload.reservation_date || ''))) {
      return sendJson(res, 400, { error: 'Invalid reservation_date' });
    }

    if (!payload.reservation_time) {
      return sendJson(res, 400, { error: 'Invalid reservation_time' });
    }

    const availableTimes = getOpenTimesForDate(payload.reservation_date);
    if (!availableTimes.includes(payload.reservation_time)) {
      return sendJson(res, 400, { error: 'Selected time is outside opening hours' });
    }

    const metadata = {};
    if (agent) {
      const agentName = String(agent.name || '').trim();
      if (!agentName) {
        return sendJson(res, 400, { error: 'agent.name is required when agent metadata is provided' });
      }

      metadata.agent = {
        name: agentName,
        type: String(agent.type || 'ai-agent').trim() || 'ai-agent',
        customer_confirmed: Boolean(agent.customer_confirmed),
        customer_reference: String(agent.customer_reference || '').trim(),
        notes: String(agent.notes || '').trim()
      };
    }

    const data = await supabaseFetch('rpc/create_reservation', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        metadata_input: metadata
      })
    });

    let mailWarning = null;
    if (hasMailConfig()) {
      try {
        await sendReservationRequestEmails(data);
      } catch (mailError) {
        console.error(mailError);
        mailWarning = 'Reservation saved, but notification emails failed';
      }
    } else {
      mailWarning = 'Reservation saved, but SMTP is not configured';
    }

    return sendJson(res, 201, { reservation: data, mailWarning });
  } catch (error) {
    console.error(error);
    return sendJson(res, error.status || 500, {
      error: error.message || 'Failed to create reservation'
    });
  }
};
