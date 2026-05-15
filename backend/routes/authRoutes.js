const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getCurrentUser
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Current
router.get("/me", authMiddleware, getCurrentUser);

module.exports = router;