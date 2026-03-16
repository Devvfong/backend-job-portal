import {
  createJobService,
  getJobs,
  getJobById,
  updateJob,
  deletJob,
} from "../services/job.service.js";

const createJobController = async (req, res) => {
  try {
    const job = await createJobService(req.body, req.user);

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

    return res.status(500).json({ error: e.message });
  }
};

const getJobsController = async (req, res) => {
  try {
    const jobs = await getJobs();

    return res.status(200).json({
      status: "success",
      data: jobs,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

const getJobByIdController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const job = await getJobById(id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.status(200).json({
      status: "success",
      data: job,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

const updateJobController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const job = await updateJob(id, req.body, req.user);

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
    await deletJob(id, req.user);

    return res.status(200).json({
      status: "success",
      message: "Job deleted successfully",
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

export {
  createJobController,
  getJobsController,
  getJobByIdController,
  updateJobController,
  deleteJobController,
};
