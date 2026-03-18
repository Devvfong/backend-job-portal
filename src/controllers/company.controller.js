import {
  createCompanyService,
  getCompanyService,
  updateCompanyService,
  deleteCompanyService,
} from "../services/company.service.js";

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
    const company = await getCompanyService(Number(req.params.id));
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
export {
  createCompanyController,
  getCompanyController,
  updateCompanyController,
  deleteCompanyController,
};
