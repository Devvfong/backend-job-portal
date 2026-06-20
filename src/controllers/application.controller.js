import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../lib/errors.js';
import {
  applyToJobService,
  getMyApplicationsService,
  getApplicantsForJobService,
  getCompanyApplicantsService,
  updateApplicationStatusService,
  withdrawApplicationService,
} from "../services/application.service.js";
import {
  buildApplicationRemovalPayload,
  buildNewApplicantNotification,
  buildSeekerApplicationNotification,
  buildSuperAdminApplicationNotification,
} from "../services/notification.service.js";
import { encryptId } from "../utils/crypto.js";
import { createSignedUrlFromSupabaseUrl } from "../services/upload.service.js";
import {
  sendApplicationStatusEmail,
  sendApplicationSubmittedEmail,
} from "../services/email.service.js";
import {
  emitNotificationToCompany,
  emitNotificationToRole,
  emitNotificationToUser,
  removeNotificationFromUser,
} from "../realtime/websocket.js";

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

const applyToJobController = async (req, res, next) => {
  try {
    const jobId = Number(req.params.id);
    const userId = req.user.id;

    const application = await applyToJobService(jobId, userId, req.body);
    await sendApplicationSubmittedEmail(application);

    emitNotificationToUser(userId, buildSeekerApplicationNotification(application));
    emitNotificationToCompany(application.job?.companyId, buildNewApplicantNotification(application));
    emitNotificationToRole("super_admin", buildSuperAdminApplicationNotification(application));

    return res.status(201).json({
      status: "success",
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

const getMyApplicationsController = async (req, res, next) => {
  try {
    const applications = await getMyApplicationsService(req.user.id);
    return res.status(200).json({
      status: "success",
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

const getApplicantsController = async (req, res, next) => {
  try {
    const jobId = Number(req.params.id);
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
  } catch (error) {
    next(error);
  }
};

const updateApplicationStatusController = async (req, res, next) => {
  try {
    const applicationId = Number(req.params.id);
    const { status } = req.body;

    if (!status) {
      throw new BadRequestError("Status is required");
    }

    const application = await updateApplicationStatusService(applicationId, status, req.user);
    await sendApplicationStatusEmail(application);
    emitNotificationToUser(
      application.userId,
      buildSeekerApplicationNotification(application, new Date()),
    );

    return res.status(200).json({
      status: "success",
      message: "Application status updated",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

const withdrawApplicationController = async (req, res, next) => {
  try {
    const applicationId = Number(req.params.id);
    const application = await withdrawApplicationService(applicationId, req.user);

    removeNotificationFromUser(
      req.user.id,
      buildApplicationRemovalPayload(application.id),
    );

    return res.status(200).json({
      status: "success",
      message: "Application withdrawn successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyApplicantsController = async (req, res, next) => {
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
  } catch (error) {
    next(error);
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
