const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const isAdmin = require("../middleware/isAdmin");

const {
  createTournament,
  getAllTournaments,
  getTournamentById,
  joinTournament,
  leaveTournament,
  startTournament,
  progressTournament
} = require("../controllers/tournamentController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");


// Tournament
router.get("/", getAllTournaments);
router.get("/:id", getTournamentById);

// join tournament for registered users only
router.patch("/:id/join", authMiddleware, joinTournament);

// Admin tournament management
router.patch("/:id/start", authMiddleware, adminMiddleware, startTournament);
router.patch("/:id/progress", authMiddleware, adminMiddleware, progressTournament);

router.patch("/:id/leave", verifyToken, leaveTournament);

module.exports = router;