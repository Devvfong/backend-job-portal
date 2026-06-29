import {
  BadRequestError,
  NotFoundError,
} from '../lib/errors.js';
import {
  createJobService,
  getJobService,
  getJobByIdService,
  updateJobService,
  deleteJobService,
  toggleSaveJobService,
  getSavedJobsService,
  getMyCompanyJobsService,
  getAdminJobsService,
} from "../services/job.service.js";
import {
  buildNewJobNotification,
  buildJobAlertNotification,
  buildJobReopenedNotification,
  notifyRole,
} from "../services/notification.service.js";
import { encryptId, decryptId } from "../utils/crypto.js";
import { prisma } from "../config/db.js";

const createJobController = async (req, res, next) => {
  try {
    const job = await createJobService(req.body, req.user);

    if (job?.status === "open") {
      await notifyRole("job_seeker", buildNewJobNotification(job));
    }

    return res.status(201).json({
      status: "success",
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

const getJobsController = async (req, res, next) => {
  try {
    const query = { ...req.query };

    if (query.companyId && isNaN(Number(query.companyId))) {
      try {
        query.companyId = decryptId(query.companyId);
      } catch {
        throw new BadRequestError("Invalid company id");
      }
    }

    const result = await getJobService(query);
    const jobs = result.jobs.map((job) => {
      const { company, ...rest } = job;
      const companySanitized = company ? (({ id: cId, ...cRest }) => ({
        ...cRest,
        encryptedId: encryptId(cId),
      }))(company) : company;

      return {
        ...rest,
        encryptedId: encryptId(rest.id),
        company: companySanitized,
      };
    });

    return res.status(200).json({
      status: "success",
      data: jobs,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getJobByIdController = async (req, res, next) => {
  try {
    let idParam = req.params.id;
    let id = Number(idParam);
    if (Number.isNaN(id)) {
      try {
        const decrypted = decryptId(idParam);
        id = Number(decrypted);
      } catch {
        throw new BadRequestError("Invalid job id");
      }
    }
    const job = await getJobByIdService(id, req.user);

    if (!job) {
      throw new NotFoundError("Job not found");
    }

    const { company, ...jobRest } = job;
    const companySanitized = company ? (({ id: cId, ...cRest }) => ({ ...cRest, encryptedId: encryptId(cId) }))(company) : null;

    return res.status(200).json({
      status: "success",
      data: { ...jobRest, encryptedId: encryptId(jobRest.id), company: companySanitized },
    });
  } catch (error) {
    next(error);
  }
};

const updateJobController = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const previousJob = await prisma.job.findUnique({
      where: { id },
      select: { status: true },
    });
    const job = await updateJobService(id, req.body, req.user);

    if (req.body.status && previousJob && req.body.status !== previousJob.status) {
      const jobForAlert = await prisma.job.findUnique({
        where: { id },
        include: { company: { select: { companyName: true, logo: true } } },
      });

      if (jobForAlert) {
        if (req.body.status === "closed") {
          await notifyRole(
            "job_seeker",
            buildJobAlertNotification(jobForAlert, "closed"),
          );
        } else if (req.body.status === "open") {
          await notifyRole(
            "job_seeker",
            buildJobReopenedNotification(jobForAlert),
          );
        }
      }
    }

    return res.status(200).json({
      status: "success",
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

const deleteJobController = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const job = await prisma.job.findUnique({
      where: { id },
      include: { company: { select: { companyName: true, logo: true } } },
    });
    
    await deleteJobService(id, req.user);

    if (job) {
      await notifyRole("job_seeker", buildJobAlertNotification(job, "removed"));
    }

    return res.status(200).json({
      status: "success",
      message: "Job deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const toggleSaveJobController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await toggleSaveJobService(id, req.user);
    return res.status(200).json({
      status: "success",
      message: result.message,
      data: result.data || null,
    });
  } catch (error) {
    next(error);
  }
};

const getSavedJobsController = async (req, res, next) => {
  try {
    const jobs = await getSavedJobsService(req.user.id);
    const mapped = jobs.map((s) => ({
      ...s,
      job: s.job ? { ...s.job, encryptedId: encryptId(s.job.id), company: s.job.company ? { ...s.job.company, encryptedId: s.job.company.id ? encryptId(s.job.company.id) : undefined } : s.job.company } : s.job,
    }));

    return res.status(200).json({
      status: "success",
      data: mapped,
    });
  } catch (error) {
    next(error);
  }
};

const getMyCompanyJobsController = async (req, res, next) => {
  try {
    const jobs = await getMyCompanyJobsService(req.user);
    const mapped = jobs.map((j) => ({ ...j, encryptedId: encryptId(j.id) }));
    return res.status(200).json({
      status: "success",
      data: mapped,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminJobsController = async (req, res, next) => {
  try {
    const result = await getAdminJobsService(req.query);
    const jobs = result.jobs.map((job) => {
      const { company, ...rest } = job;
      const companySanitized = company
        ? (({ id: companyId, ...companyRest }) => ({
            ...companyRest,
            encryptedId: encryptId(companyId),
          }))(company)
        : company;

      return {
        ...rest,
        encryptedId: encryptId(rest.id),
        company: companySanitized,
      };
    });

    return res.status(200).json({
      status: "success",
      data: {
        jobs,
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

export {
  createJobController,
  getJobsController,
  getJobByIdController,
  updateJobController,
  deleteJobController,
  toggleSaveJobController,
  getSavedJobsController,
  getMyCompanyJobsController,
  getAdminJobsController,
};
