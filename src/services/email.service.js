import { Resend } from "resend";

let resend = null;

const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  return resend;
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const sendEmail = async ({ to, subject, html, text }) => {
  const client = getResend();

  if (!client) {
    console.warn("Email skipped: RESEND_API_KEY is not configured.");
    return null;
  }

  try {
    const result = await client.emails.send({
      from: process.env.EMAIL_FROM || "NextHire <onboarding@resend.dev>",
      to,
      subject,
      html,
      text,
    });

    if (result?.error) {
      console.error("Email send failed:", result.error);
      return null;
    }

    if (result?.data?.id) {
      console.log("Email sent:", result.data.id);
    }

    return result?.data ?? result;
  } catch (error) {
    console.error("Email send failed:", error);
    return null;
  }
};

const sendWelcomeEmail = async (user) => {
  const name = escapeHtml(user.name || "there");
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  return sendEmail({
    to: user.email,
    subject: "Welcome to NextHire",
    html: `
      <h1>Welcome, ${name}</h1>
      <p>Your NextHire account is ready. You can now browse jobs, save roles, and submit applications.</p>
      <p><a href="${frontendUrl}/jobs">Browse jobs</a></p>
    `,
    text: `Welcome, ${user.name || "there"}! Your NextHire account is ready. Browse jobs: ${frontendUrl}/jobs`,
  });
};

const sendApplicationSubmittedEmail = async (application) => {
  const applicantName = application.user?.name || "there";
  const jobTitle = application.job?.title || "the job";
  const companyName = application.job?.company?.companyName || "the company";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  return sendEmail({
    to: application.user.email,
    subject: `Application submitted: ${jobTitle}`,
    html: `
      <h1>Application submitted</h1>
      <p>Hi ${escapeHtml(applicantName)}, your application for <strong>${escapeHtml(jobTitle)}</strong> at ${escapeHtml(companyName)} was submitted successfully.</p>
      <p><a href="${frontendUrl}/dashboard/seeker/applications">View your applications</a></p>
    `,
    text: `Hi ${applicantName}, your application for ${jobTitle} at ${companyName} was submitted successfully. View applications: ${frontendUrl}/dashboard/seeker/applications`,
  });
};

const sendApplicationStatusEmail = async (application) => {
  const applicantName = application.user?.name || "there";
  const jobTitle = application.job?.title || "your application";
  const companyName = application.job?.company?.companyName || "the company";
  const status = application.status;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  return sendEmail({
    to: application.user.email,
    subject: `Application update: ${jobTitle}`,
    html: `
      <h1>Application status updated</h1>
      <p>Hi ${escapeHtml(applicantName)}, your application for <strong>${escapeHtml(jobTitle)}</strong> at ${escapeHtml(companyName)} is now <strong>${escapeHtml(status)}</strong>.</p>
      <p><a href="${frontendUrl}/dashboard/seeker/applications">View your applications</a></p>
    `,
    text: `Hi ${applicantName}, your application for ${jobTitle} at ${companyName} is now ${status}. View applications: ${frontendUrl}/dashboard/seeker/applications`,
  });
};

const sendPasswordResetEmail = async (user, resetUrl) => {
  const name = escapeHtml(user.name || "there");
  const safeResetUrl = escapeHtml(resetUrl);

  return sendEmail({
    to: user.email,
    subject: "Reset your NextHire password",
    html: `
      <h1>Reset your password</h1>
      <p>Hi ${name}, use the link below to reset your NextHire password. This link expires in 15 minutes.</p>
      <p><a href="${safeResetUrl}">Reset password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
    text: `Hi ${user.name || "there"}, reset your NextHire password here: ${resetUrl}. This link expires in 15 minutes. If you did not request this, you can ignore this email.`,
  });
};

const sendVerificationEmail = async (user, verifyUrl) => {
  const name = escapeHtml(user.name || "there");
  const safeVerifyUrl = escapeHtml(verifyUrl);

  return sendEmail({
    to: user.email,
    subject: "Verify your NextHire account",
    html: `
      <h1>Verify your email</h1>
      <p>Hi ${name}, thank you for registering with NextHire. Please use the link below to verify your email address and activate your account. This link expires in 24 hours.</p>
      <p><a href="${safeVerifyUrl}">Verify Email</a></p>
      <p>If you did not create this account, you can ignore this email.</p>
    `,
    text: `Hi ${user.name || "there"}, thank you for registering with NextHire. Verify your email here: ${verifyUrl}. This link expires in 24 hours.`,
  });
};

const sendSuspensionEmail = async (userOrCompany, reasons) => {
  const name = escapeHtml(userOrCompany.name || userOrCompany.companyName || "there");
  const email = userOrCompany.email;
  const reasonText = reasons && reasons.length > 0
    ? `<ul>${reasons.map(r => `<li>${escapeHtml(r)}</li>`).join("")}</ul>`
    : "<p>No specific reason provided.</p>";

  return sendEmail({
    to: email,
    subject: "Your NextHire Account has been Suspended",
    html: `
      <h1>Account Suspended</h1>
      <p>Hi ${name},</p>
      <p>Your NextHire account has been suspended for the following reason(s):</p>
      ${reasonText}
      <p>If you believe this was a mistake, please reply to this email to contact our support team.</p>
    `,
    text: `Hi ${name}, your NextHire account has been suspended for the following reason(s): ${reasons?.join(", ") || "No specific reason provided."}. If you believe this was a mistake, contact support.`,
  });
};

export const sendMaintenanceEmail = async (user, reason) => {
  const subject = "System Maintenance Notification";
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; padding: 20px; line-height: 1.5; color: #333; background-color: #fff; }
          .logo { max-width: 150px; margin-bottom: 20px; }
          .logo-light { display: block; }
          .logo-dark { display: none; }
          @media (prefers-color-scheme: dark) {
            body { background-color: #1a1a1a; color: #f5f5f5; }
            .logo-light { display: none !important; }
            .logo-dark { display: block !important; }
          }
        </style>
      </head>
      <body>
        <img src="${process.env.FRONTEND_URL || "https://nexthire.devqii.me"}/logo-light.svg" class="logo logo-light" alt="NextHire" />
        <img src="${process.env.FRONTEND_URL || "https://nexthire.devqii.me"}/logo-dark.svg" class="logo logo-dark" alt="NextHire" />
        <h2>Scheduled Maintenance Notice</h2>
        <p>Hello ${escapeHtml(user.name)},</p>
        <p>This is a notification that our system is entering maintenance mode.</p>
        <p><strong>Reason:</strong> ${escapeHtml(reason || "Routine system updates")}</p>
        <p>During this time, you will not be able to log in or use the platform. We apologize for any inconvenience.</p>
        <p>Thank you,<br>The NextHire Team</p>
      </body>
    </html>
  `;
  const text = `Scheduled Maintenance Notice\n\nHello ${user.name},\n\nOur system is entering maintenance mode.\nReason: ${reason || "Routine system updates"}\n\nDuring this time, you will not be able to log in or use the platform.\n\nThank you,\nThe NextHire Team`;

  return sendEmail({ to: user.email, subject, html, text });
};

export {
  sendWelcomeEmail,
  sendApplicationSubmittedEmail,
  sendApplicationStatusEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendSuspensionEmail,
};
