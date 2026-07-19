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
