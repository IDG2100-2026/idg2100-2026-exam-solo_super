const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const isAdmin = require("../middleware/isAdmin");

const {
  getAdminDashboard,
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  getAdminComments,
  deleteAdminComment,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/dashboard", verifyToken, isAdmin, getAdminDashboard);

router.patch("/users/:id", verifyToken, isAdmin, updateAdminUser);

router.get("/users", verifyToken, isAdmin, getAdminUsers);
router.delete("/users/:id", verifyToken, isAdmin, deleteAdminUser);

router.get("/comments", verifyToken, isAdmin, getAdminComments);
router.delete("/comments/:id", verifyToken, isAdmin, deleteAdminComment);


module.exports = router;