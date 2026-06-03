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
    
    return res.status(200).json({
      status: "success",
      message: "Application status updated",
      data: application,
    });
  } catch (err) {
    if (err.message.includes("Forbidden")) {
      return res.status(403).json({ message: err.message });
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
