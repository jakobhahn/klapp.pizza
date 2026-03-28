const { readJsonBody, sendJson, supabaseFetch } = require('./_supabase');
const { hasMailConfig, sendReservationRequestEmails } = require('./_mailer');

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
      area: body.area === 'aussen' ? 'aussen' : 'innen',
      reservation_date: body.reservation_date,
      reservation_time: body.reservation_time,
      notes: String(body.notes || '').trim()
    };

    if (!Number.isInteger(payload.party_size) || payload.party_size < 1) {
      return sendJson(res, 400, { error: 'Invalid party size' });
    }

    const maxPartySize = payload.area === 'aussen' ? 8 : 25;
    if (payload.party_size > maxPartySize) {
      return sendJson(res, 400, { error: `Max party size for ${payload.area} is ${maxPartySize}` });
    }

    const data = await supabaseFetch('rpc/create_reservation', {
      method: 'POST',
      body: JSON.stringify(payload)
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
