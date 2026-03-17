import multer from 'multer';
import path from 'path';

// Allowed file extensions for resumes
const allowedExtensions = ['.pdf', '.doc', '.docx'];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
	const ext = path.extname(file.originalname).toLowerCase();
	if (allowedExtensions.includes(ext)) {
		cb(null, true);
	} else {
		cb(new Error('Only PDF, DOC, and DOCX files are allowed for resumes.'));
	}
};

const uploadResume = multer({
	storage,
	fileFilter,
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export default uploadResume;
