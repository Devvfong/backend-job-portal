import {
  createJobService,
  getJobs,
  getJobById,
  updateJob,
} from "../services/job.service.js";

const createJobController = async (req, res) => {
  try {
    const job = await createJobService(req.body);

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
    const job = await updateJob(id, req.body);
    res.status(200).json({
      status: "success",
      data: job,
    });
  } catch (e) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export {
  createJobController,
  getJobsController,
  getJobByIdController,
  updateJobController,
};
