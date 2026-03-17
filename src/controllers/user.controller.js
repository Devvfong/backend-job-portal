import {
  createProfile,
  getProfile,
  updateProfile,
} from "../services/user.service.js";
const createProfileController = async (req, res) => {
  try {
    const profile = await createProfile(req.body, req.user.id);
    return res.status(201).json({
      status: "success",
      data: profile,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};
const getProfileController = async (req, res) => {
  try {
    const profile = await getProfile({}, req.user.id);
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
    return res.status(500).json({ error: e.message });
  }
};

export { createProfileController, getProfileController, updateProfileController };
