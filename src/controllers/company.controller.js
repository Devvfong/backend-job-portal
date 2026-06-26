import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../lib/errors.js';
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
  suspendCompanyService,
  warnCompanyService,
} from "../services/company.service.js";
import {
  uploadCompanyAsset,
} from "../services/upload.service.js";
import { encryptId, decryptId } from "../utils/crypto.js";

const createCompanyController = async (req, res, next) => {
  try {
    const company = await createCompanyService(req.body, req.user);
    const { id, ...rest } = company;
    return res.status(201).json({
      status: "success",
      data: { ...rest, id: encryptId(id), encryptedId: encryptId(id) },
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyController = async (req, res, next) => {
  try {
    const result = await getCompanyService(req.query);
    const companies = result.companies.map(({ id, ...rest }) => ({ ...rest, encryptedId: encryptId(id) }));
    return res.status(200).json({
      status: "success",
      data: { companies, meta: result.meta },
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyControllerById = async (req, res, next) => {
  try {
    let idParam = req.params.id;
    let id = Number(idParam);
    if (Number.isNaN(id)) {
      try {
        const decrypted = decryptId(idParam);
        id = Number(decrypted);
      } catch (err) {
        throw new BadRequestError("Invalid company id");
      }
    }

    const includeSensitive = !!(
      req.user && (req.user.role === "super_admin" || (req.user.role === "company_admin" && req.user.companyId === id))
    );

    const company = await getCompanyServiceById(Number(id), includeSensitive);
    if (!company) {
      throw new NotFoundError("Company not found");
    }

    const { id: companyId, jobs = [], ...companyRest } = company;
    const jobsSanitized = (jobs || []).map(({ id: jobId, ...jobRest }) => ({ ...jobRest, encryptedId: encryptId(jobId) }));
    const out = { ...companyRest, id: encryptId(companyId), encryptedId: encryptId(companyId), jobs: jobsSanitized };

    return res.status(200).json({
      status: "success",
      data: out,
    });
  } catch (error) {
    next(error);
  }
};

const getMyCompanyController = async (req, res, next) => {
  try {
    if (!req.user?.companyId) {
      throw new NotFoundError("Company not found");
    }
    const company = await getMyCompanyService(req.user.companyId);
    if (!company) {
      throw new NotFoundError("Company not found");
    }

    const { id: myId, jobs = [], ...companyRest } = company;
    const jobsSanitized = (jobs || []).map(({ id: jobId, ...jobRest }) => ({ ...jobRest, encryptedId: encryptId(jobId) }));

    return res.status(200).json({
      status: "success",
      data: { ...companyRest, id: encryptId(myId), encryptedId: encryptId(myId), jobs: jobsSanitized },
    });
  } catch (error) {
    next(error);
  }
};

const updateCompanyController = async (req, res, next) => {
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
    next(error);
  }
};

const updateMyCompanyController = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      throw new ForbiddenError("Forbidden: No company associated");
    }

    const {
      id,
      encryptedId,
      companyId,
      userId,
      createdAt,
      updatedAt,
      foundedYear,
      officeCount,
      gallery,
      specialties,
      mapUrl,
      latitude,
      longitude,
      ...restBody
    } = req.body;

    const company = await updateCompanyService(
      req.user.companyId,
      {
        ...restBody,
        foundedYear,
        officeCount,
        gallery,
        specialties,
        mapUrl,
        latitude,
        longitude
      },
      req.user,
    );

    const { id: updatedId, jobs = [], ...updatedRest } = company;
    const jobsSanitized = (jobs || []).map(({ id: jobId, ...jobRest }) => ({ ...jobRest, encryptedId: encryptId(jobId) }));

    return res.status(200).json({
      status: "success",
      data: { ...updatedRest, encryptedId: encryptId(updatedId), jobs: jobsSanitized },
    });
  } catch (error) {
    next(error);
  }
};

const uploadGalleryController = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError("No file provided");
    }

    if (!req.user.companyId) {
      throw new ForbiddenError("Forbidden: No company associated");
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
    next(error);
  }
};

const deleteCompanyController = async (req, res, next) => {
  try {
    await deleteCompanyService(Number(req.params.id), req.user);
    return res.status(200).json({
      status: "success",
      message: "Company deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const uploadLogoController = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError("No logo file provided");
    }

    if (!req.user.companyId) {
      throw new ForbiddenError("Forbidden: No company associated");
    }

    const publicUrl = await uploadCompanyAsset(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      req.user.companyId,
      "logo"
    );

    const updatedCompany = await updateCompanyLogo(req.user.companyId, publicUrl);
    const { id: updatedId, jobs = [], ...updatedRest } = updatedCompany;
    const jobsSanitized = (jobs || []).map(({ id: jobId, ...jobRest }) => ({ ...jobRest, encryptedId: encryptId(jobId) }));

    return res.status(200).json({
      status: "success",
      message: "Logo uploaded successfully",
      data: { ...updatedRest, encryptedId: encryptId(updatedId), jobs: jobsSanitized },
    });
  } catch (error) {
    next(error);
  }
};

const deleteLogoController = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      throw new ForbiddenError("Forbidden: No company associated");
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
    next(error);
  }
};

const uploadCoverController = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError("No cover file provided");
    }

    if (!req.user.companyId) {
      throw new ForbiddenError("Forbidden: No company associated");
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
    next(error);
  }
};

const deleteCoverController = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      throw new ForbiddenError("Forbidden: No company associated");
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
    next(error);
  }
};

const deleteCoverByIdController = async (req, res, next) => {
  try {
    const company = await deleteCompanyCover(req.user, Number(req.params.id));
    const { id: deletedId, ...deletedRest } = company;

    return res.status(200).json({
      status: "success",
      message: "Cover deleted successfully",
      data: { ...deletedRest, encryptedId: encryptId(deletedId) },
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyStatsController = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      throw new ForbiddenError("Forbidden: No company associated");
    }

    const stats = await getCompanyStatsService(req.user.companyId);
    return res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

const suspendCompanyController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { suspend, reason } = req.body;
    const reasonArray = Array.isArray(reason) ? reason : [reason].filter(Boolean);
    const adminId = req.user.id;
    const updated = await suspendCompanyService(id, suspend, reasonArray, adminId);
    return res.status(200).json({
      status: "success",
      data: { ...updated, encryptedId: encryptId(updated.id) },
    });
  } catch (error) {
    next(error);
  }
};

const warnCompanyController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const reasonArray = Array.isArray(reason) ? reason : [reason].filter(Boolean);
    const adminId = req.user.id;
    const updated = await warnCompanyService(id, reasonArray, adminId);
    return res.status(200).json({
      status: "success",
      data: { ...updated, encryptedId: encryptId(updated.id) },
    });
  } catch (error) {
    next(error);
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
  deleteCoverByIdController,
  uploadGalleryController,
  getCompanyStatsController,
  suspendCompanyController,
  warnCompanyController,
};

