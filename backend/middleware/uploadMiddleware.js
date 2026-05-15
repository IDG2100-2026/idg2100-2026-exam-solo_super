const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Final destination for uploaded profile images
const uploadDir = path.join(__dirname, "../uploads/profile-images");

// Create folder if it does not exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `upload-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Only allow image files
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp/;
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const isValidExtension = allowedExtensions.test(fileExtension);
  const isValidMimeType = allowedExtensions.test(file.mimetype);

  if (isValidExtension && isValidMimeType) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed."));
  }
};

// Multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    //MB
    fileSize: 2 * 1024 * 1024 
  }
});

module.exports = upload;