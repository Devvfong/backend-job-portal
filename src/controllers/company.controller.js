import {
  createCompanyService,
  getCompanyService,
  getCompanyServiceById,
  getMyCompanyService,
  updateCompanyService,
  deleteCompanyService,
  updateCompanyLogo,
  deleteCompanyLogo,
  getCompanyStatsService,
} from "../services/company.service.js";
import {
  uploadLogo as uploadLogoToSupabase,
  deleteFileFromSupabase,
} from "../services/upload.service.js";

import { encryptId, decryptId } from "../utils/crypto.js";

const createCompanyController = async (req, res) => {
  try {
    const company = await createCompanyService(req.body, req.user);
    // Remove raw id from response and expose only encryptedId
    const { id, ...rest } = company;
    return res.status(201).json({
      status: "success",
      data: { ...rest, encryptedId: encryptId(id) },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
const getCompanyController = async (req, res) => {
  try {
    const result = await getCompanyService(req.query);
    const companies = result.companies.map(({ id, ...rest }) => ({ ...rest, encryptedId: encryptId(id) }));
    return res.status(200).json({
      status: "success",
      data: { companies, meta: result.meta },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const getCompanyControllerById = async (req, res) => {
  try {
    // Accept either numeric IDs or encrypted IDs
    let idParam = req.params.id;
    let id = Number(idParam);
    if (Number.isNaN(id)) {
      try {
        const decrypted = decryptId(idParam);
        id = Number(decrypted);
      } catch (err) {
        return res.status(400).json({ message: "Invalid company id" });
      }
    }

    const includeSensitive = !!(
      req.user && (req.user.role === "super_admin" || (req.user.role === "company_admin" && req.user.companyId === id))
    );

    const company = await getCompanyServiceById(Number(id), includeSensitive);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Remove raw id and map nested jobs to include encryptedId instead of id
    const { id: companyId, jobs = [], ...companyRest } = company;
    const jobsSanitized = (jobs || []).map(({ id: jobId, ...jobRest }) => ({ ...jobRest, encryptedId: encryptId(jobId) }));

    const out = { ...companyRest, encryptedId: encryptId(companyId), jobs: jobsSanitized };

    return res.status(200).json({
      status: "success",
      data: out,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const getMyCompanyController = async (req, res) => {
  try {
    if (!req.user?.companyId) {
      return res.status(404).json({ message: "Company not found" });
    }

    const company = await getMyCompanyService(req.user.companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const { id: myId, jobs = [], ...companyRest } = company;
    const jobsSanitized = (jobs || []).map(({ id: jobId, ...jobRest }) => ({ ...jobRest, encryptedId: encryptId(jobId) }));

    return res.status(200).json({
      status: "success",
      data: { ...companyRest, encryptedId: encryptId(myId), jobs: jobsSanitized },
    });
  } catch (error) {
    console.error(error);
    if (error.message === "Company not found") {
      return res.status(404).json({ message: "Company not found" });
    }
    return res.status(500).json({ error: error.message });
  }
};
const updateCompanyController = async (req, res) => {
  try {
    const company = await updateCompanyService(
      Number(req.params.id),
      req.body,
      req.user,
    );
    return res.status(200).json({
      status: "success",
      data: company,
    });
  } catch (error) {
    console.error(error);
    if (error.message === "Unauthorized") {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (error.message === "Company not found") {
      return res.status(404).json({ message: "Company not found" });
    }
    return res.status(500).json({ error: error.message });
  }
};
const deleteCompanyController = async (req, res) => {
  try {
    await deleteCompanyService(Number(req.params.id), req.user);
    return res.status(200).json({
      status: "success",
      message: "Company deleted successfully",
    });
  } catch (error) {
    console.error(error);
    if (error.message === "Unauthorized") {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (error.message === "Company not found") {
      return res.status(404).json({ message: "Company not found" });
    }
    return res.status(500).json({ error: error.message });
  }
};
const uploadLogoController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No logo file provided" });
    }

    if (!req.user.companyId) {
      return res
        .status(403)
        .json({ message: "Forbidden: No company associated" });
    }

    // 1. Get current company to check for old logo
    const company = await getCompanyServiceById(req.user.companyId, true);
    const oldLogoUrl = company?.logo;

    // 2. Upload new logo
    const publicUrl = await uploadLogoToSupabase(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      req.user.companyId,
    );

    // 3. Update database
    const updatedCompany = await updateCompanyLogo(req.user.companyId, publicUrl);

    // 4. Cleanup old logo if it exists
    if (oldLogoUrl) {
      await deleteFileFromSupabase(oldLogoUrl, "logos");
    }

    const { id: updatedId, jobs = [], ...updatedRest } = updatedCompany;
    const jobsSanitized = (jobs || []).map(({ id: jobId, ...jobRest }) => ({ ...jobRest, encryptedId: encryptId(jobId) }));

    return res.status(200).json({
      status: "success",
      message: "Logo uploaded successfully",
      data: { ...updatedRest, encryptedId: encryptId(updatedId), jobs: jobsSanitized },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
const deleteLogoController = async (req, res) => {
  try {
    if (!req.user.companyId) {
      return res
        .status(403)
        .json({ message: "Forbidden: No company associated" });
    }

    const company = await deleteCompanyLogo(req.user, req.user.companyId);

    const { id: deletedId, jobs = [], ...deletedRest } = company;
    const jobsSanitized = (jobs || []).map(({ id: jobId, ...jobRest }) => ({ ...jobRest, encryptedId: encryptId(jobId) }));

    return res.status(200).json({
      status: "success",
      message: "Logo deleted successfully",
      data: { ...deletedRest, encryptedId: encryptId(deletedId), jobs: jobsSanitized },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
const getCompanyStatsController = async (req, res) => {
  try {
    if (!req.user.companyId) {
      return res.status(403).json({ message: "Forbidden: No company associated" });
    }

    const stats = await getCompanyStatsService(req.user.companyId);

    return res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

export {
  createCompanyController,
  getCompanyController,
  getCompanyControllerById,
  getMyCompanyController,
  updateCompanyController,
  deleteCompanyController,
  uploadLogoController,
  deleteLogoController,
  getCompanyStatsController,
};
