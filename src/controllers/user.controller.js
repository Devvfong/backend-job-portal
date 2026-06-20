import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../lib/errors.js';
import {
  createProfile,
  getProfile,
  getPublicProfile,
  updateProfile,
  updateUserAvatar,
  updateUserResume,
  getAllUsers,
  deleteUser,
  getUserStatsService,
  suspendUser,
  warnUser,
} from "../services/user.service.js";
import {
  uploadAvatar as uploadAvatarToSupabase,
  uploadResume as uploadResumeToSupabase,
  deleteFileFromSupabase,
  createSignedUrlFromSupabaseUrl,
} from "../services/upload.service.js";
import { encryptId } from "../utils/crypto.js";
import { prisma } from "../config/db.js";

const withSignedResume = async (user) => {
  if (!user?.resume) return user;
  return {
    ...user,
    resume: await createSignedUrlFromSupabaseUrl(user.resume, "resumes"),
  };
};

const createProfileController = async (req, res, next) => {
  try {
    const profile = await createProfile(req.body, req.user.id);
    const signedProfile = await withSignedResume(profile);
    return res.status(200).json({
      status: "success",
      data: { ...signedProfile, encryptedId: encryptId(profile.id) },
    });
  } catch (error) {
    next(error);
  }
};

const getProfileController = async (req, res, next) => {
  try {
    const profile = await getProfile(req.user.id);
    if (!profile) {
      throw new NotFoundError("User not found");
    }
    const signedProfile = await withSignedResume(profile);
    return res.status(200).json({
      status: "success",
      data: { ...signedProfile, encryptedId: encryptId(profile.id) },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfileController = async (req, res, next) => {
  try {
    const profile = await updateProfile(req.body, req.user.id, req.user);
    const signedProfile = await withSignedResume(profile);
    return res.status(200).json({
      status: "success",
      data: { ...signedProfile, encryptedId: encryptId(profile.id) },
    });
  } catch (error) {
    next(error);
  }
};

const updateUserController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await updateProfile(req.body, id, req.user);
    const signedProfile = await withSignedResume(profile);
    return res.status(200).json({
      status: "success",
      data: { ...signedProfile, encryptedId: encryptId(profile.id) },
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsersController = async (req, res, next) => {
  try {
    const data = await getAllUsers();
    const sanitizedUsers = data.user.map(u => {
      const { company, ...user } = u;
      const sanitizedCompany = company
        ? (({ id, ...rest }) => ({ ...rest, encryptedId: encryptId(id) }))(company)
        : company;
      return { ...user, encryptedId: encryptId(u.id), company: sanitizedCompany };
    });
    return res.status(200).json({
      status: "success",
      data: { user: sanitizedUsers, total: data.total },
    });
  } catch (error) {
    next(error);
  }
};

const deleteUserController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteUser(id);
    return res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const uploadAvatarController = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError("No avatar file provided");
    }

    const currentProfile = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { avatar: true },
    });
    const oldAvatarUrl = currentProfile?.avatar;

    const publicUrl = await uploadAvatarToSupabase(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      req.user.id,
    );

    const user = await updateUserAvatar(req.user.id, publicUrl);

    if (oldAvatarUrl) {
      await deleteFileFromSupabase(oldAvatarUrl, "avatars");
    }

    return res.status(200).json({
      status: "success",
      message: "Avatar uploaded successfully",
      data: { ...user, encryptedId: encryptId(user.id) },
    });
  } catch (error) {
    next(error);
  }
};

const uploadResumeController = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError("No resume file provided");
    }

    const currentProfile = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { resume: true },
    });
    const oldResumeUrl = currentProfile?.resume;

    const publicUrl = await uploadResumeToSupabase(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      req.user.id,
    );

    const user = await updateUserResume(req.user.id, publicUrl);

    if (oldResumeUrl) {
      await deleteFileFromSupabase(oldResumeUrl, "resumes");
    }

    return res.status(200).json({
      status: "success",
      message: "Resume uploaded successfully",
      data: { ...(await withSignedResume(user)), encryptedId: encryptId(user.id) },
    });
  } catch (error) {
    next(error);
  }
};

const getUserStatsController = async (req, res, next) => {
  try {
    const stats = await getUserStatsService(req.user.id);
    return res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

const getProfileByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await getPublicProfile(Number(id));
    if (!profile) {
      throw new NotFoundError("User not found");
    }
    return res.status(200).json({
      status: "success",
      data: { ...profile, encryptedId: encryptId(profile.id) },
    });
  } catch (error) {
    next(error);
  }
};

const suspendUserController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await suspendUser(id);
    return res.status(200).json({
      status: "success",
      data: { ...updated, encryptedId: encryptId(updated.id) },
    });
  } catch (error) {
    next(error);
  }
};

const warnUserController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await warnUser(id);
    return res.status(200).json({
      status: "success",
      data: { ...updated, encryptedId: encryptId(updated.id) },
    });
  } catch (error) {
    next(error);
  }
};

export {
  createProfileController,
  getProfileController,
  getProfileByIdController,
  updateProfileController,
  updateUserController,
  getAllUsersController,
  deleteUserController,
  uploadAvatarController,
  uploadResumeController,
  getUserStatsController,
  suspendUserController,
  warnUserController,
};
