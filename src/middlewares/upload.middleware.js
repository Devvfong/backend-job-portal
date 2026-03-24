import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];

const avatarFileFilter = (req, file, cb) => {
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, HEIC and WebP images are allowed for avatars.'));
  }
};

const uploadAvatar = multer({
  storage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});

// ─── Resume ────────────────────────────────────────────────────────────────
const allowedResumeExtensions = ['.pdf', '.doc', '.docx'];

const resumeFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedResumeExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed for resumes.'));
  }
};

const uploadResume = multer({
  storage,
  fileFilter: resumeFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ─── Company Logo ──────────────────────────────────────────────────────────
const uploadLogo = multer({
  storage,
  fileFilter: avatarFileFilter, // Same image types as avatar
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
});

export { uploadAvatar, uploadResume, uploadLogo };
