const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const isAdmin = require("../middleware/isAdmin");
const multer = require("multer");
const path = require("path");

const {
  createTournament,
  getAllTournaments,
  deleteTournament,
  startTournament,
  cancelTournament,
} = require("../controllers/tournamentController");

const {
  getAdminDashboard,
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  getAdminComments,
  deleteAdminComment,
} = require("../controllers/adminController");

const router = express.Router();

const trophyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/trophy-images");
  },
  filename: (req, file, cb) => {
    const uniqueName = `trophy-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});


const upload = multer({ storage: trophyStorage });

router.get("/dashboard", verifyToken, isAdmin, getAdminDashboard);

router.patch("/users/:id", verifyToken, isAdmin, updateAdminUser);

router.get("/users", verifyToken, isAdmin, getAdminUsers);
router.delete("/users/:id", verifyToken, isAdmin, deleteAdminUser);

router.get("/comments", verifyToken, isAdmin, getAdminComments);
router.delete("/comments/:id", verifyToken, isAdmin, deleteAdminComment);

router.post("/tournaments", verifyToken, isAdmin, upload.single("trophyImage"), createTournament);

router.get("/tournaments", verifyToken, isAdmin, getAllTournaments);

router.patch("/tournaments/:id/cancel", verifyToken, isAdmin,cancelTournament);

router.delete("/tournaments/:id", verifyToken, isAdmin, deleteTournament);

router.patch("/tournaments/:id/start", verifyToken, isAdmin, startTournament);


module.exports = router;