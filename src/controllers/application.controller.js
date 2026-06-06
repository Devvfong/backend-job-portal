import {
  applyToJobService,
  getMyApplicationsService,
  getApplicantsForJobService,
  getCompanyApplicantsService,
  updateApplicationStatusService,
  withdrawApplicationService,
} from "../services/application.service.js";
import { encryptId } from "../utils/crypto.js";
import { createSignedUrlFromSupabaseUrl } from "../services/upload.service.js";
import {
  sendApplicationStatusEmail,
  sendApplicationSubmittedEmail,
} from "../services/email.service.js";
import { sendToCompany, sendToUser } from "../realtime/websocket.js";


const buildApplicationSubmittedNotification = (application) => {
  const jobTitle = application.job?.title || "a job";
  const companyName = application.job?.company?.companyName || "a company";

  return {
    id: `app-pending-${application.id}`,
    type: "applied",
    icon: "check",
    title: "Application Submitted",
    message: `You applied for "${jobTitle}" at ${companyName}. Good luck!`,
    time: application.appliedDate,
    createdAt: application.appliedDate,
    read: false,
    avatar: application.job?.company?.logo || null,
    link: "/dashboard/seeker/applications",
  };
};

const buildNewApplicantNotification = (application) => {
  const applicantName = application.user?.name || "Someone";
  const jobTitle = application.job?.title || "your job";

  return {
    id: `new-applicant-${application.id}`,
    type: "new_applicant",
    icon: "user",
    title: "New Applicant",
    message: `${applicantName} applied for "${jobTitle}".`,
    time: application.appliedDate,
    createdAt: application.appliedDate,
    read: false,
    avatar: application.user?.avatar || null,
    link: "/dashboard/company/jobs",
  };
};

const buildStatusNotification = (application) => {
  const jobTitle = application.job?.title || "your application";
  const companyName = application.job?.company?.companyName || "the company";
  const statusTitles = {
    reviewed: "Application Reviewed",
    accepted: "Application Accepted!",
    rejected: "Application Update",
    pending: "Application Pending",
  };

  return {
    id: `app-${application.status}-${application.id}`,
    type: "status_change",
    icon: "bell",
    title: statusTitles[application.status] || "Application Update",
    message: `Your application for "${jobTitle}" at ${companyName} is now ${application.status}.`,
    time: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    read: false,
    avatar: application.job?.company?.logo || null,
    link: "/dashboard/seeker/applications",
  };
};
const withSignedApplicantResume = async (app) => {
  if (!app.user?.resume) return app;

  return {
    ...app,
    user: {
      ...app.user,
      resume: await createSignedUrlFromSupabaseUrl(app.user.resume, "resumes"),
    },
  };
};

const applyToJobController = async (req, res) => {
  try {
    const jobId = Number(req.params.id);
    const userId = req.user.id;

    const application = await applyToJobService(jobId, userId, req.body);
    await sendApplicationSubmittedEmail(application);
    sendToUser(userId, "notification:new", buildApplicationSubmittedNotification(application));
    sendToCompany(application.job?.companyId, "notification:new", buildNewApplicantNotification(application));

    return res.status(201).json({
      status: "success",
      message: "Application submitted successfully",
      data: application,
    });
  } catch (err) {
    if (err.message.includes("Unique constraint failed")) {
      return res.status(400).json({ message: "You have already applied to this job" });
    }
    if (err.message === "Job not found") {
      return res.status(404).json({ message: err.message });
    }
    if (err.message === "Job is no longer accepting applications") {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
};

const getMyApplicationsController = async (req, res) => {
  try {
    const applications = await getMyApplicationsService(req.user.id);
    return res.status(200).json({
      status: "success",
      data: applications,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getApplicantsController = async (req, res) => {
  try {
    const jobId = Number(req.params.id); // convert string to number
    const applicants = await getApplicantsForJobService(jobId, req.user);
    const signedApplicants = await Promise.all(applicants.map(withSignedApplicantResume));
    const sanitized = signedApplicants.map(app => ({
      ...app,
      user: app.user ? { ...app.user, encryptedId: encryptId(app.user.id) } : app.user
    }));
    return res.status(200).json({
      status: "success",
      data: sanitized,
    });
  } catch (err) {
    if (err.message.includes("Forbidden")) {
      return res.status(403).json({ message: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
};

const updateApplicationStatusController = async (req, res) => {
  try {
    const applicationId = Number(req.params.id);
    const { status } = req.body;
    
    if (!status) {
        return res.status(400).json({ message: "Status is required" });
    }

    const application = await updateApplicationStatusService(applicationId, status, req.user);
    await sendApplicationStatusEmail(application);
    sendToUser(application.userId, "notification:new", buildStatusNotification(application));
    
    return res.status(200).json({
      status: "success",
      message: "Application status updated",
      data: application,
    });
  } catch (err) {
    if (err.message.includes("Forbidden")) {
      return res.status(403).json({ message: err.message });
    }
    if (err.message === "Application not found") {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
};
const withdrawApplicationController = async (req, res) => {
  try {
    const applicationId = Number(req.params.id);
    await withdrawApplicationService(applicationId, req.user);

    return res.status(200).json({
      status: "success",
      message: "Application withdrawn successfully",
    });
  } catch (err) {
    if (err.message === "Application not found") {
      return res.status(404).json({ message: err.message });
    }
    if (err.message.includes("Forbidden")) {
      return res.status(403).json({ message: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
};

const getCompanyApplicantsController = async (req, res) => {
  try {
    const applicants = await getCompanyApplicantsService(req.user);
    const signedApplicants = await Promise.all(applicants.map(withSignedApplicantResume));
    const sanitized = signedApplicants.map(app => ({
      ...app,
      user: app.user ? { ...app.user, encryptedId: encryptId(app.user.id) } : app.user
    }));
    return res.status(200).json({
      status: "success",
      data: sanitized,
    });
  } catch (err) {
    if (err.message.includes("Forbidden")) {
      return res.status(403).json({ message: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
};

export {
  applyToJobController,
  getMyApplicationsController,
  getApplicantsController,
  getCompanyApplicantsController,
  updateApplicationStatusController,
  withdrawApplicationController,
};

