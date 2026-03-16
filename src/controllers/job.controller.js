import {
  createJobService,
  getJobs,
  getJobById,
  updateJob,
  deletJob,
} from "../services/job.service.js";

const createJobController = async (req, res) => {
  try {
    const job = await createJobService(req.body, req.user); // ah nis prevent test like if atatcker have token admin and use on user account(postman it can be create job)

    res.status(201).json({
      status: "success",
      data: job,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

const getJobsController = async (req, res) => {
  try {
    const jobs = await getJobs();

    res.status(200).json({
      status: "success",
      data: jobs,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

const getJobByIdController = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const job = await getJobById(id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json({
      status: "success",
      data: job,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
const updateJobController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const job = await updateJob(id, req.body, req.user);
    res.status(200).json({
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
    res.status(500).json({ error: e.message });
  }
};
const deleteJobController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await deletJob(id, req.user);
    res.status(200).json({
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
    res.status(500).json({ error: e.message });
  }
};

export {
  createJobController,
  getJobsController,
  getJobByIdController,
  updateJobController,
  deleteJobController,
};
