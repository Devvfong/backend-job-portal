import {
  createCompanyService,
  getCompanyService,
  getCompanyServiceById,
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

const createCompanyController = async (req, res) => {
  try {
    const company = await createCompanyService(req.body, req.user);
    return res.status(201).json({
      status: "success",
      data: company,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
const getCompanyController = async (req, res) => {
  try {
    const companies = await getCompanyService(req.query);
    return res.status(200).json({
      status: "success",
      data: companies,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const getCompanyControllerById = async (req, res) => {
  try {
    const company = await getCompanyServiceById(Number(req.params.id));
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    return res.status(200).json({
      status: "success",
      data: company,
    });
  } catch (error) {
    console.error(error);
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
    const company = await getCompanyServiceById(req.user.companyId);
    const oldLogoUrl = company?.logo;

    // 2. Upload new logo
    const publicUrl = await uploadLogoToSupabase(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      req.user.companyId,
    );

    // 3. Update database
    const updatedCompany = await updateCompanyLogo(
      req.user.companyId,
      publicUrl,
    );

    // 4. Cleanup old logo if it exists
    if (oldLogoUrl) {
      await deleteFileFromSupabase(oldLogoUrl, "logos");
    }

    return res.status(200).json({
      status: "success",
      message: "Logo uploaded successfully",
      data: updatedCompany,
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

    return res.status(200).json({
      status: "success",
      message: "Logo deleted successfully",
      data: company,
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
  updateCompanyController,
  deleteCompanyController,
  uploadLogoController,
  deleteLogoController,
  getCompanyStatsController,
};
