const MAX_PARTY_SIZE = {
  innen: 25,
  aussen: 8
};
const DATE_SPECIFIC_OPENINGS = {
  '2026-04-26': { start: '14:00', end: '20:00' }
};

function normalizeArea(value) {
  return value === 'aussen' ? 'aussen' : 'innen';
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function timeToMinutes(t) {
  const parts = String(t || '').split(':');
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return NaN;
  }

  return hours * 60 + minutes;
}

function formatTimeFromMinutes(total) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${pad2(hours)}:${pad2(minutes)}`;
}

function generateQuarterTimes(startMinutesInclusive, endMinutesExclusive) {
  const times = [];
  for (let current = startMinutesInclusive; current < endMinutesExclusive; current += 15) {
    times.push(formatTimeFromMinutes(current));
  }
  return times;
}

function isValidDateString(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(dateStr || ''));
}

function getOpenTimesForDate(dateStr) {
  if (!isValidDateString(dateStr)) {
    return [];
  }

  const specialOpening = DATE_SPECIFIC_OPENINGS[dateStr];
  if (specialOpening) {
    return generateQuarterTimes(
      timeToMinutes(specialOpening.start),
      timeToMinutes(specialOpening.end)
    );
  }

  const parts = dateStr.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  if (Number.isNaN(date.getTime())) {
    return [];
  }

  const day = date.getDay();
  let times = [];

  if (day >= 3 && day <= 6) {
    times = times.concat(generateQuarterTimes(17 * 60, 22 * 60));
  }

  if (day === 4 || day === 5) {
    times = times.concat(generateQuarterTimes(12 * 60, 14 * 60));
  }

  return times.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
}

function normalizeReservationTime(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }

  return `${match[1]}:${match[2]}`;
}

function getReservationCapabilities(dateStr) {
  const capabilities = {
    timezone: 'Europe/Berlin',
    booking_url: 'https://klapp.pizza/#reservierung',
    create_endpoint: '/api/reservations',
    lookup_endpoint: '/api/reservations/lookup',
    party_size_limits: { ...MAX_PARTY_SIZE },
    area_options: [
      { value: 'innen', label: 'innen', max_party_size: MAX_PARTY_SIZE.innen },
      { value: 'aussen', label: 'außen', max_party_size: MAX_PARTY_SIZE.aussen }
    ],
    opening_rules: [
      { days: ['wednesday', 'thursday', 'friday', 'saturday'], start: '17:00', end: '22:00', interval_minutes: 15 },
      { days: ['thursday', 'friday'], start: '12:00', end: '14:00', interval_minutes: 15 }
    ],
    special_openings: Object.entries(DATE_SPECIFIC_OPENINGS).map(([date, rule]) => ({
      date,
      start: rule.start,
      end: rule.end,
      interval_minutes: 15
    })),
    required_fields: [
      'guest_name',
      'guest_phone',
      'guest_email',
      'party_size',
      'area',
      'reservation_date',
      'reservation_time'
    ],
    optional_fields: ['notes', 'agent'],
    agent_fields: [
      'agent.name',
      'agent.type',
      'agent.customer_confirmed',
      'agent.customer_reference',
      'agent.notes'
    ]
  };

  if (dateStr) {
    capabilities.requested_date = dateStr;
    capabilities.available_times = getOpenTimesForDate(dateStr);
  }

  return capabilities;
}

module.exports = {
  MAX_PARTY_SIZE,
  getOpenTimesForDate,
  getReservationCapabilities,
  isValidDateString,
  normalizeArea,
  normalizeReservationTime
};
