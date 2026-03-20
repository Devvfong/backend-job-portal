import { supabase } from "../lib/supabase.js";
import path from "path";

/**
 * Upload a user avatar to Supabase Storage (bucket: avatars)
 * @param {Buffer} fileBuffer - File buffer from multer memoryStorage
 * @param {string} mimetype   - MIME type of the file
 * @param {string} originalname - Original file name
 * @param {number} userId     - Authenticated user ID (used as folder prefix)
 * @returns {string} Public URL of the uploaded file
 */
const uploadAvatar = async (fileBuffer, mimetype, originalname, userId) => {
  const ext = path.extname(originalname).toLowerCase();
  const fileName = `${userId}/${Date.now()}${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(fileName, fileBuffer, {
      contentType: mimetype,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase avatar upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
  return data.publicUrl;
};

/**
 * Upload a user resume to Supabase Storage (bucket: resumes)
 * @param {Buffer} fileBuffer - File buffer from multer memoryStorage
 * @param {string} mimetype   - MIME type of the file
 * @param {string} originalname - Original file name
 * @param {number} userId     - Authenticated user ID (used as folder prefix)
 * @returns {string} Public URL of the uploaded file
 */
const uploadResume = async (fileBuffer, mimetype, originalname, userId) => {
  const ext = path.extname(originalname).toLowerCase();
  const fileName = `${userId}/${Date.now()}${ext}`;

  const { error } = await supabase.storage
    .from("resumes")
    .upload(fileName, fileBuffer, {
      contentType: mimetype,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase resume upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from("resumes").getPublicUrl(fileName);
  return data.publicUrl;
};

export { uploadAvatar, uploadResume };
