import {
  createProfile,
  getProfile,
  updateProfile,
  updateUserAvatar,
  updateUserResume,
} from "../services/user.service.js";
import {
  uploadAvatar as uploadAvatarToSupabase,
  uploadResume as uploadResumeToSupabase,
} from "../services/upload.service.js";

const createProfileController = async (req, res) => {
  try {
    const profile = await createProfile(req.body, req.user.id);
    return res.status(200).json({
      status: "success",
      data: profile,
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

    return res.status(200).json({
      status: "success",
      data: profile,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

const updateProfileController = async (req, res) => {
  try {
    const profile = await updateProfile(req.body, req.user.id);

    return res.status(200).json({
      status: "success",
      data: profile,
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

    const publicUrl = await uploadAvatarToSupabase(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      req.user.id,
    );

    const user = await updateUserAvatar(req.user.id, publicUrl);

    return res.status(200).json({
      status: "success",
      message: "Avatar uploaded successfully",
      data: user,
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

    const publicUrl = await uploadResumeToSupabase(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      req.user.id,
    );

    const user = await updateUserResume(req.user.id, publicUrl);

    return res.status(200).json({
      status: "success",
      message: "Resume uploaded successfully",
      data: user,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

export {
  createProfileController,
  getProfileController,
  updateProfileController,
  uploadAvatarController,
  uploadResumeController,
};

