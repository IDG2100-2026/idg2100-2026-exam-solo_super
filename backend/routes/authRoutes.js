const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");

const {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

router.post("/logout", logoutUser)

// Current
router.get("/me", verifyToken, getCurrentUser);

//router.get("/admin/dashboard", verifyToken, isAdmin, getAdminDashboard);

module.exports = router;