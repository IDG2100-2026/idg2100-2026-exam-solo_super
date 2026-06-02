const express = require("express");

const verifyToken = require("../middleware/verifyToken");
const isAdmin = require("../middleware/isAdmin");

const {
  getAdminDashboard,
  getAllUsers,
  deleteUser,
  getAllComments,
  deleteComment,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/dashboard", verifyToken, isAdmin, getAdminDashboard);


module.exports = router;