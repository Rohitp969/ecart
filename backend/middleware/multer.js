import multer from "multer";

const storage = multer.memoryStorage();

const MAX_FILE_MB = 5;
const MAX_FILES = 5;

// images only, up to 5 MB each
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: `Each image must be smaller than ${MAX_FILE_MB} MB`,
  // array("file", 5) reports a 6th file as "unexpected"
  LIMIT_UNEXPECTED_FILE: `You can upload up to ${MAX_FILES} images`,
};

// turn upload errors into a clean 400 instead of an unhandled 500
const handle = (middleware) => (req, res, next) =>
  middleware(req, res, (error) => {
    if (!error) return next();
    const message = (error instanceof multer.MulterError && MULTER_MESSAGES[error.code]) || error.message;
    return res.status(400).json({ success: false, message });
  });

//single upload
export const singleUpload = handle(upload.single("file"))

//multiple upload upto 5 images
export const multipleUpload = handle(upload.array("file", MAX_FILES))
