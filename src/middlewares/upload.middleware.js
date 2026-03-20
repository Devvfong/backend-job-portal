import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

// ─── Avatar ────────────────────────────────────────────────────────────────
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

const avatarFileFilter = (req, file, cb) => {
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed for avatars.'));
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

export { uploadAvatar, uploadResume };
