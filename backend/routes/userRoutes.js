const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");


const {
  getAllUsers,
  getUserById,
  updateUser,
  banUser,
  uploadProfileImage
} = require("../controllers/userController");


// all users
router.get("/", authMiddleware, getAllUsers);

// one user
router.get("/:id", authMiddleware, getUserById);

// update
router.patch("/:id", authMiddleware, updateUser);

// ban or unban a user
router.patch("/:id/ban", authMiddleware, adminMiddleware, banUser);

router.patch("/:id/profile-image", authMiddleware, upload.single("profileImage"), uploadProfileImage);

module.exports = router;