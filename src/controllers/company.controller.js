import {
  createCompanyService,
  getCompanyService,
  getCompanyServiceById,
  getMyCompanyService,
  updateCompanyService,
  deleteCompanyService,
  updateCompanyLogo,
  deleteCompanyLogo,
  updateCompanyCover,
  deleteCompanyCover,
  getCompanyStatsService,
} from "../services/company.service.js";
import {
  uploadCompanyAsset,
} from "../services/upload.service.js";

import { encryptId, decryptId } from "../utils/crypto.js";

const createCompanyController = async (req, res) => {
  try {
    const company = await createCompanyService(req.body, req.user);
    // Remove raw id from response and expose only encryptedId
    const { id, ...rest } = company;
    return res.status(201).json({
      status: "success",
      data: { ...rest, id: encryptId(id), encryptedId: encryptId(id) },
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
    const out = { ...companyRest, id: encryptId(companyId), encryptedId: encryptId(companyId), jobs: jobsSanitized };

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
      data: { ...companyRest, id: encryptId(myId), encryptedId: encryptId(myId), jobs: jobsSanitized },
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
const updateMyCompanyController = async (req, res) => {
  try {
    if (!req.user.companyId) {
      return res.status(403).json({ message: "Forbidden: No company associated" });
    }
    
    // Only allow expected premium fields and base fields
    const { foundedYear, officeCount, gallery, specialties, ...restBody } = req.body;
    
    const company = await updateCompanyService(
      req.user.companyId,
      { ...restBody, foundedYear, officeCount, gallery, specialties },
      req.user,
    );

    const { id: updatedId, jobs = [], ...updatedRest } = company;
    const jobsSanitized = (jobs || []).map(({ id: jobId, ...jobRest }) => ({ ...jobRest, encryptedId: encryptId(jobId) }));

    return res.status(200).json({
      status: "success",
      data: { ...updatedRest, encryptedId: encryptId(updatedId), jobs: jobsSanitized },
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

const uploadGalleryController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    if (!req.user.companyId) {
      return res
        .status(403)
        .json({ message: "Forbidden: No company associated" });
    }

    const { uploadGalleryAsset } = await import("../services/upload.service.js");
    const publicUrl = await uploadGalleryAsset(
      req.file.buffer,
      req.file.mimetype,
      req.user.companyId
    );

    return res.status(200).json({
      status: "success",
      data: { url: publicUrl },
    });
  } catch (error) {
    console.error(error);
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

    // 2. Upload new logo
    const publicUrl = await uploadCompanyAsset(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      req.user.companyId,
      "logo"
    );

    // 3. Update database (shadow deletion is handled in the service for the old logo)
    const updatedCompany = await updateCompanyLogo(req.user.companyId, publicUrl);

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

const uploadCoverController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No cover file provided" });
    }

    if (!req.user.companyId) {
      return res
        .status(403)
        .json({ message: "Forbidden: No company associated" });
    }

    const publicUrl = await uploadCompanyAsset(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      req.user.companyId,
      "cover"
    );

    const updatedCompany = await updateCompanyCover(req.user.companyId, publicUrl);

    const { id: updatedId, jobs = [], ...updatedRest } = updatedCompany;
    const jobsSanitized = (jobs || []).map(({ id: jobId, ...jobRest }) => ({ ...jobRest, encryptedId: encryptId(jobId) }));

    return res.status(200).json({
      status: "success",
      message: "Cover uploaded successfully",
      data: { ...updatedRest, encryptedId: encryptId(updatedId), jobs: jobsSanitized },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const deleteCoverController = async (req, res) => {
  try {
    if (!req.user.companyId) {
      return res
        .status(403)
        .json({ message: "Forbidden: No company associated" });
    }

    const company = await deleteCompanyCover(req.user, req.user.companyId);

    const { id: deletedId, jobs = [], ...deletedRest } = company;
    const jobsSanitized = (jobs || []).map(({ id: jobId, ...jobRest }) => ({ ...jobRest, encryptedId: encryptId(jobId) }));

    return res.status(200).json({
      status: "success",
      message: "Cover deleted successfully",
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
  updateMyCompanyController,
  updateCompanyController,
  deleteCompanyController,
  uploadLogoController,
  deleteLogoController,
  uploadCoverController,
  deleteCoverController,
  uploadGalleryController,
  getCompanyStatsController,
};
