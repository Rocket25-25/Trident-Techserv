/* Vercel Function: contact form backend (replaces contact-handler.php, since Vercel cannot run PHP).
   Settings come from Vercel environment variables - nothing secret is stored in the code:
     SMTP_USERNAME   Gmail address that sends the mail        (required)
     SMTP_PASSWORD   16-character Google App Password          (required)
     NOTIFY_TO_EMAIL where enquiries are delivered             (optional, default below)
     SMTP_HOST / SMTP_PORT                                     (optional, default smtp.gmail.com / 465)
     ALLOWED_ORIGIN  extra allowed site origins, comma-separated (optional)
*/
const nodemailer = require('nodemailer');

const SERVICES = ['Custom SaaS Development', 'AI-Powered Automation', 'Vertical SaaS Solutions', 'Web Development & Marketing', 'Other'];

const json = (res, status, success, message, errors) => {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(JSON.stringify({ success, message, errors: errors || {} }));
};

const clean = (v, max) => String(v || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
const headerSafe = (v) => String(v || '').replace(/[\r\n]+/g, ' ').trim();
const hostOf = (u) => { try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { return ''; } };

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, false, 'Invalid request method.');

  // Same-origin check: the request must come from this site (or ALLOWED_ORIGIN)
  const h = req.headers || {};
  const allowed = [h.host, ...(process.env.ALLOWED_ORIGIN || '').split(',')].map(hostOf.bind(null)).filter(Boolean);
  allowed.push(String(h.host || '').split(':')[0].toLowerCase().replace(/^www\./, ''));
  const src = hostOf(h.origin || '') || hostOf(h.referer || '');
  if (src && !allowed.includes(src)) return json(res, 403, false, 'Request rejected.');

  // Vercel parses urlencoded / JSON bodies into req.body (the form is sent urlencoded)
  let f = req.body || {};
  if (typeof f === 'string') { try { f = JSON.parse(f); } catch (e) { f = Object.fromEntries(new URLSearchParams(f)); } }

  if (f.website_url) return json(res, 200, true, 'Message received.'); // honeypot: bots only

  const name = clean(f.name, 100), email = String(f.email || '').trim(), phone = clean(f.phone, 30), service = clean(f.service, 100);
  const errors = {};
  if (!/^[\p{L}\p{M} .'-]{2,100}$/u.test(name)) errors.name = 'Enter your name.';
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
  if (!/^\+?[0-9]{7,15}$/.test(phone.replace(/[\s\-()]/g, ''))) errors.phone = 'Enter a valid phone number.';
  if (!SERVICES.includes(service)) errors.service = 'Select a service.';
  if (Object.keys(errors).length) return json(res, 422, false, 'Please correct the highlighted fields.', errors);

  const user = process.env.SMTP_USERNAME, pass = process.env.SMTP_PASSWORD;
  if (!user || !pass) {
    console.error('Contact form: SMTP_USERNAME / SMTP_PASSWORD environment variables are not set.');
    return json(res, 500, false, 'Mail service is not configured. Please email headtrident.techserv@gmail.com instead.');
  }
  const to = process.env.NOTIFY_TO_EMAIL || 'headtrident.techserv@gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com', port, secure: port === 465,
    auth: { user, pass }, connectionTimeout: 10000, socketTimeout: 15000
  });

  const when = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' });
  const safeName = headerSafe(name), safeEmail = headerSafe(email), first = name.split(' ')[0] || 'there';

  const adminText = ['NEW DISCOVERY CALL REQUEST', '='.repeat(68), '', 'Name: ' + name, 'Email: ' + email, 'Phone / WhatsApp: ' + phone,
    'Service: ' + service, '', '-'.repeat(68), 'Submitted: ' + when + ' (IST)', 'Reply to this email to answer the visitor directly.'].join('\r\n');
  const userText = ['Hi ' + first + ',', '', 'Thanks for reaching out to Trident Techserv! Your details have gone straight',
    'to our principal engineering pod, and you will receive an architecture scope', 'response within 12 business hours.', '',
    'Here is what you sent us:', '- Name: ' + name, '- Email: ' + email, '- Phone / WhatsApp: ' + phone, '- Service: ' + service, '',
    'If anything above needs correcting, just reply to this email.', '', 'Best,', 'Trident Techserv', 'Pune, India'].join('\r\n');

  try {
    // Admin notification must succeed; serverless functions stop after returning, so we wait for it.
    await transporter.sendMail({
      from: { name: 'Trident Techserv Website', address: user }, to,
      replyTo: { name: safeName, address: safeEmail },
      subject: 'New discovery call request (' + headerSafe(service) + ') - Trident Techserv', text: adminText
    });
  } catch (e) {
    console.error('Contact form: admin notification failed:', e && e.message);
    return json(res, 502, false, 'We could not send your request right now. Please email ' + to + ' instead.');
  }
  try {
    await transporter.sendMail({
      from: { name: 'Trident Techserv', address: user }, to: { name: safeName, address: safeEmail }, replyTo: to,
      subject: 'We received your request - Trident Techserv', text: userText
    });
  } catch (e) { console.error('Contact form: auto-reply failed (non-fatal):', e && e.message); }

  return json(res, 200, true, 'Message received.');
};