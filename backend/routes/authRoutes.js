const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");

const {
  registerUser,
  loginUser,
  verifyEmail,
  logoutUser,
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




module.exports = router;