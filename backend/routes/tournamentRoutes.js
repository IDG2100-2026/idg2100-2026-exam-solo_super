const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");

const {
  createTournament,
  getAllTournaments,
  getTournamentById,
  joinTournament,
  startTournament,
  progressTournament
} = require("../controllers/tournamentController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// create with admin acess
router.post("/", createTournament);

// Tournament
router.get("/", getAllTournaments);
router.get("/:id", getTournamentById);

// join tournament for registered users only
router.patch("/:id/join", authMiddleware, joinTournament);

// Admin tournament management
router.patch("/:id/start", authMiddleware, adminMiddleware, startTournament);
router.patch("/:id/progress", authMiddleware, adminMiddleware, progressTournament);

module.exports = router;