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
      from: process.env.EMAIL_FROM || "JobPortal <onboarding@resend.dev>",
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
    subject: "Welcome to JobPortal",
    html: `
      <h1>Welcome, ${name}</h1>
      <p>Your JobPortal account is ready. You can now browse jobs, save roles, and submit applications.</p>
      <p><a href="${frontendUrl}/jobs">Browse jobs</a></p>
    `,
    text: `Welcome, ${user.name || "there"}! Your JobPortal account is ready. Browse jobs: ${frontendUrl}/jobs`,
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
    subject: "Reset your JobPortal password",
    html: `
      <h1>Reset your password</h1>
      <p>Hi ${name}, use the link below to reset your JobPortal password. This link expires in 15 minutes.</p>
      <p><a href="${safeResetUrl}">Reset password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
    text: `Hi ${user.name || "there"}, reset your JobPortal password here: ${resetUrl}. This link expires in 15 minutes. If you did not request this, you can ignore this email.`,
  });
};

export {
  sendWelcomeEmail,
  sendApplicationSubmittedEmail,
  sendApplicationStatusEmail,
  sendPasswordResetEmail,
};
