import {
  applyToJobService,
  getMyApplicationsService,
  getApplicantsForJobService,
  updateApplicationStatusService,
} from "../services/application.service.js";

const applyToJobController = async (req, res) => {
  try {
    const jobId = Number(req.params.id);
    const userId = req.user.id;

    const application = await applyToJobService(jobId, userId, req.body);

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
    return res.status(200).json({
      status: "success",
      data: applicants,
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

export {
  applyToJobController,
  getMyApplicationsController,
  getApplicantsController,
  updateApplicationStatusController,
};
