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

/**
 * Upload a company logo to Supabase Storage (bucket: logos)
 * @param {Buffer} fileBuffer - File buffer from multer memoryStorage
 * @param {string} mimetype   - MIME type of the file
 * @param {string} originalname - Original file name
 * @param {number} companyId    - Authenticated company ID (used as folder prefix)
 * @returns {promise<string>} Public URL of the uploaded file
 */
const uploadLogo = async (fileBuffer, mimetype, originalname, companyId) => {
  const ext = path.extname(originalname).toLowerCase();
  const fileName = `${companyId}/${Date.now()}${ext}`;

  const { error } = await supabase.storage.from("logos").upload(fileName, fileBuffer, {
    contentType: mimetype,
    upsert: true,
  });

  if (error) {
    throw new Error(`Supabase logo upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from("logos").getPublicUrl(fileName);
  return data.publicUrl;
};

/**
 * Delete a file from Supabase Storage given its public URL
 * @param {string} publicUrl - Public URL of the file to delete
 * @param {string} bucket    - Bucket name ('avatars', 'resumes', or 'logos')
 */
const deleteFileFromSupabase = async (publicUrl, bucket) => {
  if (!publicUrl) return;

  try {
    // Extract the path from the public URL
    // URL format: https://[PROJECT_ID].supabase.co/storage/v1/object/public/[BUCKET]/[PATH]
    const urlParts = publicUrl.split(`${bucket}/`);
    if (urlParts.length < 2) return;

    const filePath = urlParts[1];

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error(`Failed to delete file from Supabase: ${error.message}`);
    }
  } catch (err) {
    console.error(`Error parsing Supabase URL for deletion: ${err.message}`);
  }
};

export { uploadAvatar, uploadResume, uploadLogo, deleteFileFromSupabase };
