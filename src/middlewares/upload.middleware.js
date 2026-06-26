import multer from 'multer';
import path from 'path';

import { getSetting } from '../config/settings.cache.js';

const storage = multer.memoryStorage();

const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];

const avatarFileFilter = (req, file, cb) => {
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, HEIC and WebP images are allowed for avatars.'));
  }
};

const getUploadLimit = () => {
  const sizeMB = parseInt(getSetting("max_upload_size_mb")) || 5;
  return sizeMB * 1024 * 1024;
};

const createDynamicMulter = (fileFilter) => ({
  single: (name) => (req, res, next) => multer({ storage, fileFilter, limits: { fileSize: getUploadLimit() } }).single(name)(req, res, next),
  fields: (arr) => (req, res, next) => multer({ storage, fileFilter, limits: { fileSize: getUploadLimit() } }).fields(arr)(req, res, next)
});

const uploadAvatar = createDynamicMulter(avatarFileFilter);

// ─── Resume ────────────────────────────────────────────────────────────────
const allowedResumeExtensions = ['.pdf', '.doc', '.docx'];
const allowedResumeMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const resumeFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (
    allowedResumeExtensions.includes(ext) &&
    allowedResumeMimeTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed for resumes.'));
  }
};

const uploadResume = createDynamicMulter(resumeFileFilter);

// ─── Company Logo & Cover Asset ────────────────────────────────────────────────────────
const uploadCompanyAsset = createDynamicMulter(avatarFileFilter);

// ─── Shared Multer Error Handler ─────────────────────────────────────────
const handleUploadError = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ status: "error", code: "BAD_REQUEST", message: err.message });
    }
    if (err) {
      return res.status(400).json({ status: "error", code: "BAD_REQUEST", message: err.message });
    }
    next();
  });
};

export { uploadAvatar, uploadResume, uploadCompanyAsset, handleUploadError };
