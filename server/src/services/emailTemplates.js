function wrapper(bodyHtml) {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a;">
      <div style="font-weight: 800; font-size: 20px; margin-bottom: 24px;">
        Stack<span style="color: #4f46e5;">ly</span>
      </div>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #64748b;">This is an automated message from Stackly HR.</p>
    </div>
  `;
}

export function offerLetterEmail({ firstName, lastName, designation }) {
  return {
    subject: "Your Offer Letter — Stackly",
    html: wrapper(`
      <p>Dear ${firstName} ${lastName},</p>
      <p>We are pleased to offer you the position${designation ? ` of <strong>${designation}</strong>` : ""} at our company.</p>
      <p>Please find your offer details attached/forthcoming from HR, and reach out with any questions before confirming your acceptance.</p>
      <p>Welcome aboard!</p>
    `),
  };
}

// Renders HR's freely-edited plain-text letter (from the "Edit & Send" modal) through
// the same styled wrapper as the fixed templates — blank lines become paragraph
// breaks, everything else is escaped so a candidate's name/address can't inject HTML.
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function wrapPlainTextLetter(content) {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="white-space: pre-line;">${escapeHtml(p)}</p>`)
    .join("\n");
  return wrapper(paragraphs);
}

export function passwordResetEmail({ name, resetUrl }) {
  return {
    subject: "Reset your Stackly password",
    html: wrapper(`
      <p>Hi ${name || "there"},</p>
      <p>We received a request to reset your Stackly password. Click the link below to choose a new one — it expires in 1 hour.</p>
      <p><a href="${resetUrl}" style="color: #4f46e5;">Reset your password</a></p>
      <p>If you didn't request this, you can safely ignore this email — your password won't change.</p>
    `),
  };
}

export function appointmentLetterEmail({ firstName, lastName, joiningDate }) {
  return {
    subject: "Your Appointment Letter — Stackly",
    html: wrapper(`
      <p>Dear ${firstName} ${lastName},</p>
      <p>Congratulations! Following confirmation of your onboarding payment, we are formally confirming your appointment${
        joiningDate ? ` with a joining date of <strong>${new Date(joiningDate).toLocaleDateString()}</strong>` : ""
      }.</p>
      <p>HR will follow up with your appointment letter document and next steps shortly.</p>
      <p>We look forward to having you on the team!</p>
    `),
  };
}
