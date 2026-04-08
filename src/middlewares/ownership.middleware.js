// src/middlewares/ownership.middleware.js
// Middleware to verify that the authenticated user owns the requested job (or is super_admin).
// Used for update/delete job routes.

import { prisma } from "../config/db.js";

const checkJobOwnership = async (req, res, next) => {
  const user = req.user; // set by protect middleware
  const jobId = Number(req.params.id);

  if (!user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  // super_admin can bypass ownership checks
  if (user.role === "super_admin") {
    return next();
  }

  // Only company_admin should reach here (authorize middleware ensures role)
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { companyId: true },
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.companyId !== user.companyId) {
      return res.status(403).json({ message: "Forbidden: you do not own this job" });
    }

    // Ownership verified
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export default checkJobOwnership;
