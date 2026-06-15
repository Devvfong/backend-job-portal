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
} from "../services/user.service.js";
import {
  uploadAvatar as uploadAvatarToSupabase,
  uploadResume as uploadResumeToSupabase,
  deleteFileFromSupabase,
  createSignedUrlFromSupabaseUrl,
} from "../services/upload.service.js";
import { encryptId } from "../utils/crypto.js";

const withSignedResume = async (user) => {
  if (!user?.resume) return user;

  return {
    ...user,
    resume: await createSignedUrlFromSupabaseUrl(user.resume, "resumes"),
  };
};

const createProfileController = async (req, res) => {
  try {
    const profile = await createProfile(req.body, req.user.id);
    const signedProfile = await withSignedResume(profile);
    return res.status(200).json({
      status: "success",
      data: { ...signedProfile, encryptedId: encryptId(profile.id) },
    });
  } catch (e) {
    console.error(e);

    if (e.message === "User not found") {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(500).json({ error: e.message });
  }
};

const getProfileController = async (req, res) => {
  try {
    const profile = await getProfile(req.user.id);

    if (!profile) {
      return res.status(404).json({ message: "User not found" });
    }

    const signedProfile = await withSignedResume(profile);

    return res.status(200).json({
      status: "success",
      data: { ...signedProfile, encryptedId: encryptId(profile.id) },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

const updateProfileController = async (req, res) => {
  try {
    // Current user updating their own profile
    const profile = await updateProfile(req.body, req.user.id, req.user);
    const signedProfile = await withSignedResume(profile);

    return res.status(200).json({
      status: "success",
      data: { ...signedProfile, encryptedId: encryptId(profile.id) },
    });
  } catch (e) {
    console.error(e);

    if (e.message === "User not found") {
      return res.status(404).json({ message: "User not found" });
    }

    if (e.message.includes("can be linked to a company")) {
      return res.status(400).json({ message: e.message });
    }

    return res.status(500).json({ error: e.message });
  }
};

const updateUserController = async (req, res) => {
  try {
    const { id } = req.params;
    // Super admin or owner updating a specific profile by ID
    const profile = await updateProfile(req.body, id, req.user);
    const signedProfile = await withSignedResume(profile);

    return res.status(200).json({
      status: "success",
      data: { ...signedProfile, encryptedId: encryptId(profile.id) },
    });
  } catch (e) {
    console.error(e);

    if (e.message === "User not found") {
      return res.status(404).json({ message: "User not found" });
    }

    if (e.message.startsWith("Forbidden")) {
      return res.status(403).json({ message: e.message });
    }

    if (e.message.includes("can be linked to a company")) {
      return res.status(400).json({ message: e.message });
    }

    return res.status(500).json({ error: e.message });
  }
};

const getAllUsersController = async (req, res) => {
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
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

const deleteUserController = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteUser(id);

    return res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (e) {
    console.error(e);

    if (e.message === "User not found") {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(500).json({ error: e.message });
  }
};

const uploadAvatarController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No avatar file provided" });
    }

    // 1. Get current profile to check for old avatar
    const currentProfile = await getProfile(req.user.id);
    const oldAvatarUrl = currentProfile?.avatar;

    // 2. Upload new avatar
    const publicUrl = await uploadAvatarToSupabase(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      req.user.id,
    );

    // 3. Update database
    const user = await updateUserAvatar(req.user.id, publicUrl);

    // 4. Cleanup old avatar if it exists
    if (oldAvatarUrl) {
      await deleteFileFromSupabase(oldAvatarUrl, "avatars");
    }

    return res.status(200).json({
      status: "success",
      message: "Avatar uploaded successfully",
      data: { ...user, encryptedId: encryptId(user.id) },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

const uploadResumeController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No resume file provided" });
    }

    // 1. Get current profile to check for old resume
    const currentProfile = await getProfile(req.user.id);
    const oldResumeUrl = currentProfile?.resume;

    // 2. Upload new resume
    const publicUrl = await uploadResumeToSupabase(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      req.user.id,
    );

    // 3. Update database
    const user = await updateUserResume(req.user.id, publicUrl);

    // 4. Cleanup old resume if it exists
    if (oldResumeUrl) {
      await deleteFileFromSupabase(oldResumeUrl, "resumes");
    }

    return res.status(200).json({
      status: "success",
      message: "Resume uploaded successfully",
      data: { ...(await withSignedResume(user)), encryptedId: encryptId(user.id) },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

const getUserStatsController = async (req, res) => {
  try {
    const stats = await getUserStatsService(req.user.id);
    return res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

const getProfileByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await getPublicProfile(Number(id));

    if (!profile) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      status: "success",
      data: { ...profile, encryptedId: encryptId(profile.id) },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
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
};

