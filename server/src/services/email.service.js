import nodemailer from "nodemailer";

let transporter = null;
let attemptedInit = false;

function getTransporter() {
  if (attemptedInit) return transporter;
  attemptedInit = true;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null; // not configured — callers fall back to a no-op that reports this
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

// Returns { sent: true } on success, or { sent: false, reason } instead of throwing —
// callers (e.g. the offer/appointment letter endpoints) always have a status to show
// HR, whether or not SMTP is configured yet.
export async function sendEmail({ to, subject, html }) {
  const transport = getTransporter();
  if (!transport) {
    return { sent: false, reason: "Email is not configured (missing SMTP_HOST/PORT/USER/PASS env vars)" };
  }

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}
