const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.strato.de';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || 'jakob@klapp.pizza';
const NOTIFY_TO = process.env.RESERVATION_NOTIFY_TO || 'jakob@klapp.pizza';

let transporter;

function hasMailConfig() {
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM);
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!hasMailConfig()) {
    throw new Error('Missing SMTP configuration');
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  return transporter;
}

function labelArea(area) {
  return area === 'aussen' ? 'außen' : 'innen';
}

function labelStatus(status) {
  if (status === 'confirmed') return 'bestätigt';
  if (status === 'pending') return 'eingegangen';
  if (status === 'cancelled') return 'storniert';
  if (status === 'completed') return 'abgeschlossen';
  if (status === 'no_show') return 'nicht erschienen';
  return status;
}

function formatReservationDate(dateString) {
  const date = new Date(`${dateString}T12:00:00+01:00`);
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Berlin'
  }).format(date);
}

function formatReservationSummary(reservation) {
  const time = String(reservation.reservation_time || '').slice(0, 5);
  return [
    `Name: ${reservation.guest_name}`,
    `Datum: ${formatReservationDate(reservation.reservation_date)}`,
    `Uhrzeit: ${time} Uhr`,
    `Bereich: ${labelArea(reservation.area)}`,
    `Personen: ${reservation.party_size}`,
    `Telefon: ${reservation.guest_phone || '-'}`,
    `E-Mail: ${reservation.guest_email}`,
    `Status: ${labelStatus(reservation.status)}`,
    `Nachricht: ${reservation.notes || '-'}`
  ].join('\n');
}

async function sendMail(message) {
  const client = getTransporter();
  return client.sendMail({
    from: SMTP_FROM,
    ...message
  });
}

async function sendReservationRequestEmails(reservation) {
  const summary = formatReservationSummary(reservation);
  const time = String(reservation.reservation_time || '').slice(0, 5);

  await Promise.all([
    sendMail({
      to: reservation.guest_email,
      subject: `Reservierungsanfrage erhalten: ${reservation.reservation_date} ${time}`,
      text:
        'Hallo,\n\n' +
        'deine Reservierungsanfrage ist bei uns eingegangen.\n' +
        'Wir melden uns, sobald die Reservierung bestätigt wurde.\n\n' +
        `${summary}\n\n` +
        'Viele Grüße\n' +
        'joschi Pizza Bistro'
    }),
    sendMail({
      to: NOTIFY_TO,
      subject: `Neue Reservierungsanfrage: ${reservation.reservation_date} ${time} (${labelArea(reservation.area)})`,
      text:
        'Es ist eine neue Reservierungsanfrage eingegangen.\n\n' +
        `${summary}\n`
    })
  ]);
}

async function sendReservationConfirmedEmail(reservation) {
  const summary = formatReservationSummary(reservation);
  const time = String(reservation.reservation_time || '').slice(0, 5);

  await sendMail({
    to: reservation.guest_email,
    subject: `Reservierung bestätigt: ${reservation.reservation_date} ${time}`,
    text:
      'Hallo,\n\n' +
      'deine Reservierung wurde bestätigt.\n\n' +
      `${summary}\n\n` +
      'Wir freuen uns auf dich.\n' +
      'joschi Pizza Bistro'
  });
}

module.exports = {
  hasMailConfig,
  sendReservationConfirmedEmail,
  sendReservationRequestEmails
};
