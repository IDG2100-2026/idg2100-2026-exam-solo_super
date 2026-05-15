const express = require("express");
const router = express.Router();

const {
  createMatch,
  joinMatch,
  submitMatchResult,
  getAllMatches,
  getMatchById,
  createComment,
  getComments,
  deleteComment,
  getLeaderboard,
  getPlatformActivity
} = require("../controllers/gameController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Match
router.post("/matches", authMiddleware, createMatch);
router.patch("/matches/:id/join", authMiddleware, joinMatch);
router.patch("/matches/:id/result", authMiddleware, submitMatchResult);
router.get("/matches", getAllMatches);
router.get("/matches/:id", getMatchById);

// Comments
router.post("/comments", authMiddleware, createComment);
router.get("/comments", getComments);
router.delete("/comments/:id", authMiddleware, adminMiddleware, deleteComment);

// Leaderboard and activity
router.get("/leaderboard", getLeaderboard);
router.get("/activity", getPlatformActivity);

module.exports = router;