import {
  createJobService,
  getJobService,
  getJobByIdService,
  updateJobService,
  deleteJobService,
  toggleSaveJobService,
  getSavedJobsService,
  getMyCompanyJobsService,
} from "../services/job.service.js";
import { buildNewJobNotification } from "../services/notification.service.js";
import { emitNotificationToRole } from "../realtime/websocket.js";
import { prisma } from "../config/db.js";
import { encryptId, decryptId } from "../utils/crypto.js";

const createJobController = async (req, res) => {
  try {
    const job = await createJobService(req.body, req.user);

    if (job?.status === "open") {
      emitNotificationToRole("job_seeker", buildNewJobNotification(job));
    }

    return res.status(201).json({
      status: "success",
      data: job,
    });
  } catch (e) {
    console.error(e);

    if (e.message === "Forbidden") {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (e.message === "Admin account is not linked to a company") {
      return res
        .status(400)
        .json({ message: "Admin account is not linked to a company" });
    }

    if (e.message === "Company not found") {
      return res.status(404).json({ message: "Company not found" });
    }

    if (e.message === "A job with identical details already exists for this company") {
      return res.status(400).json({ message: e.message });
    }

    return res.status(500).json({ error: e.message });
  }
};

const getJobsController = async (req, res) => {
  try {
    const query = { ...req.query };
    
    // Decrypt companyId if provided and not a raw number
    if (query.companyId && isNaN(Number(query.companyId))) {
      try {
        query.companyId = decryptId(query.companyId);
      } catch (err) {
        console.error("[Search] CompanyID decryption failed:", err);
        return res.status(400).json({ message: "Invalid company id" });
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
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

const getJobByIdController = async (req, res) => {
  try {
    let idParam = req.params.id;
    let id = Number(idParam);
    if (Number.isNaN(id)) {
      try {
        const decrypted = decryptId(idParam);
        id = Number(decrypted);
      } catch (err) {
        return res.status(400).json({ message: "Invalid job id" });
      }
    }
    const job = await getJobByIdService(id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const { company, ...jobRest } = job;
    const companySanitized = company ? (({ id: cId, ...cRest }) => ({ ...cRest, encryptedId: encryptId(cId) }))(company) : null;

    return res.status(200).json({
      status: "success",
      data: { ...jobRest, encryptedId: encryptId(jobRest.id), company: companySanitized },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

const updateJobController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const job = await updateJobService(id, req.body, req.user);

    return res.status(200).json({
      status: "success",
      data: job,
    });
  } catch (e) {
    console.error(e);

    if (e.message === "Forbidden") {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (e.message === "Job not found") {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.status(500).json({ error: e.message });
  }
};

const deleteJobController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await deleteJobService(id, req.user);

    return res.status(200).json({
      status: "success",
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error(error);

    if (error.message === "Forbidden") {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (error.message === "Job not found") {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.status(500).json({ error: error.message });
  }
};

const toggleSaveJobController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await toggleSaveJobService(id, req.user);

    return res.status(200).json({
      status: "success",
      message: result.message,
      data: result.data || null,
    });
  } catch (e) {
    console.error(e);
    if (e.message === "Job not found") {
      return res.status(404).json({ message: e.message });
    }
    return res.status(500).json({ error: e.message });
  }
};

const getSavedJobsController = async (req, res) => {
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
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

const getMyCompanyJobsController = async (req, res) => {
  try {
    const jobs = await getMyCompanyJobsService(req.user);
    const mapped = jobs.map((j) => ({ ...j, encryptedId: encryptId(j.id) }));
    return res.status(200).json({
      status: "success",
      data: mapped,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
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
};
