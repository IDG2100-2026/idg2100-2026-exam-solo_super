const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");

const {
  registerUser,
  loginUser,
  verifyEmail,
  logoutUser,
  forgotPassword,
  resetPassword,
  getCurrentUser
} = require("../controllers/authController");


// Register
router.post("/register", registerUser);

router.get("/verify-email/:token", verifyEmail);

// Login
router.post("/login", loginUser);

router.post("/logout", logoutUser)

// Current
router.get("/me", verifyToken, getCurrentUser);

router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);




module.exports = router;