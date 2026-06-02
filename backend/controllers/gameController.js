const Match = require("../models/matchSchema");
const Comment = require("../models/commentSchema");
const User = require("../models/userSchema");
const Tournament = require("../models/tournamentSchema");

const calculateElo = (playerRating, opponentRating, actualScore) => {
  const K = 32;
  const MIN_ELO = 100;

  const expectedScore =
    1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));

  const newRating = Math.round(
    playerRating + K * (actualScore - expectedScore)
  );

  return Math.max(newRating, MIN_ELO);
};

// create match
const createMatch = async (req, res) => {
  try {
    const {
      bestOf,
      straightsAllowed,
      roundTimeSeconds,
      isAnonymousMatch = false,
      hideFromAnonymous = false, 
      eloPreference = "any"
    } = req.body;

    if (!bestOf || straightsAllowed === undefined || !roundTimeSeconds) {
      return res.status(400).json({
        success: false,
        message: "bestOf, straightsAllowed, and roundTimeSeconds are required."
      });
    }

    const creator = req.user?.userId ? await User.findById(req.user.userId) : null;

    const categoryKey = `bestOf${bestOf}_straights${
      straightsAllowed ? "On" : "Off"
    }_${roundTimeSeconds}s`;

    const newMatch = await Match.create({
      players:
        req.user && req.user.userId
          ? [{ user: req.user.userId, usernameSnapshot: req.user.username }]
          : [],
      anonymousPlayers: req.user && req.user.role === "anonymous" ? 1 : 0,
      isAnonymousMatch,
      hideFromAnonymous,
      bestOf,
      straightsAllowed,
      roundTimeSeconds,
      categoryKey,
      status: "waiting",
      commentsEnabled: true, 
      creatorElo: creator?.eloRating || 1200, 
      eloPreference,
    });

    return res.status(201).json({
      success: true,
      message: "Match created successfully.",
      data: newMatch
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create match.",
      error: error.message
    });
  }
};

// join match
const joinMatch = async (req, res) => {
  try {
    const { id } = req.params;

    const match = await Match.findById(id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found."
      });
    }

    if (match.status !== "waiting") {
      return res.status(400).json({
        success: false,
        message: "This match is not open for joining."
      });
    }

    if (
      match.hideFromAnonymous &&
      (!req.user || req.user.role === "anonymous" || !req.user.userId)
    ) {
      return res.status(403).json({
        success: false,
        message: "This match is only visible to logged-in users."
      });
    }
    
    if (!req.user || req.user.role === "anonymous" || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to join a game."
      });
    }

    const registeredPlayers = match.players ? match.players.length : 0;
    const anonymousPlayers = match.anonymousPlayers || 0;
    const totalPlayers = registeredPlayers + anonymousPlayers;

    const joiningUser = await User.findById(req.user.userId);

    const creatorElo = match.creatorElo || 1200;
    const joiningElo = joiningUser?.eloRating || 1200;

    if (match.eloPreference === "higher" && joiningElo <= creatorElo) {
      return res.status(403).json({
        success: false,
        message: "Only players with higher Elo can join this game."
      });
    }

    if (match.eloPreference === "lower" && joiningElo >= creatorElo) {
      return res.status(403).json({
        success: false,
        message: "Only players with lower Elo can join this game."
      });
    }

    if (
      match.eloPreference === "similar" &&
      Math.abs(joiningElo - creatorElo) > 100
    ) {
      return res.status(403).json({
        success: false,
        message: "Only players within 100 Elo can join this game."
      });
    }

    if (totalPlayers >= 2) {
      return res.status(400).json({
        success: false,
        message: "This match already has two players."
      });
    }

    if (req.user && req.user.role !== "anonymous" && req.user.userId) {
      const alreadyJoined = match.players.some(
        (player) => player.user && player.user.toString() === req.user.userId
      );

      if (alreadyJoined) {
        return res.status(400).json({
          success: false,
          message: "You have already joined this match."
        });
      }

      match.players.push({
        user: req.user.userId,
        usernameSnapshot: req.user.username
      });
    } else {
      match.anonymousPlayers += 1;
    }

    const updatedRegisteredPlayers = match.players.length;
    const updatedAnonymousPlayers = match.anonymousPlayers;
    const updatedTotalPlayers = updatedRegisteredPlayers + updatedAnonymousPlayers;

    if (updatedTotalPlayers === 2) {
      match.status = "ongoing";
      match.startedAt = new Date();
    }

    await match.save();

    return res.status(200).json({
      success: true,
      message: "Joined match successfully.",
      data: match
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to join match.",
      error: error.message
    });
  }
};

// results
const submitMatchResult = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      winnerUserId,
      winnerAnonymous = false,
      rounds,
      finalOutcome,
      comments
    } = req.body;

    const match = await Match.findById(id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found."
      });
    }

    if (match.status === "finished") {
      return res.status(400).json({
        success: false,
        message: "Result has already been submitted for this match."
      });
    }

    match.rounds = rounds || [];
    match.finalOutcome = finalOutcome || "";
    match.matchComments = comments || "";
    match.status = "finished";
    match.finishedAt = new Date();

    if (winnerAnonymous) {
      match.winnerType = "anonymous";
      match.winnerUser = null;

      await match.save();

      return res.status(200).json({
        success: true,
        message: "Anonymous match result saved successfully.",
        data: match
      });
    }

    if (!winnerUserId) {
      return res.status(400).json({
        success: false,
        message: "winnerUserId is required for registered matches."
      });
    }

    match.winnerType = "registered";
    match.winnerUser = winnerUserId;

    const registeredPlayers = match.players.filter((player) => player.user);

    if (registeredPlayers.length !== 2) {
      const winner = await User.findById(winnerUserId);

      if (winner) {
        winner.wins = (winner.wins || 0) + 1;
        winner.matchesPlayed = (winner.matchesPlayed || 0) + 1;
        await winner.save();
      }

      for (const player of registeredPlayers) {
        if (player.user.toString() !== winnerUserId) {
          const loser = await User.findById(player.user);
          if (loser) {
            loser.matchesPlayed = (loser.matchesPlayed || 0) + 1;
            await loser.save();
          }
        }
      }

      await match.save();

      return res.status(200).json({
        success: true,
        message: "Match result saved successfully.",
        data: match
      });
    }

    const winnerPlayer = await User.findById(winnerUserId);

    const loserMatchPlayer = registeredPlayers.find(
      (player) => player.user.toString() !== winnerUserId
    );

    if (!winnerPlayer || !loserMatchPlayer) {
      return res.status(400).json({
        success: false,
        message: "Could not determine winner and loser correctly."
      });
    }

    const loserPlayer = await User.findById(loserMatchPlayer.user);

    if (!loserPlayer) {
      return res.status(400).json({
        success: false,
        message: "Loser could not be found."
      });
    }

    const winnerOldRating = winnerPlayer.eloRating || 1200;
    const loserOldRating = loserPlayer.eloRating || 1200;

    const winnerNewRating = calculateElo(winnerOldRating, loserOldRating, 1);
    const loserNewRating = calculateElo(loserOldRating, winnerOldRating, 0);

    winnerPlayer.eloRating = winnerNewRating;
    loserPlayer.eloRating = loserNewRating;

    winnerPlayer.wins = (winnerPlayer.wins || 0) + 1;
    winnerPlayer.matchesPlayed = (winnerPlayer.matchesPlayed || 0) + 1;
    loserPlayer.matchesPlayed = (loserPlayer.matchesPlayed || 0) + 1;

    await winnerPlayer.save();
    await loserPlayer.save();
    await match.save();

    return res.status(200).json({
      success: true,
      message: "Match result saved successfully.",
      data: match,
      eloUpdate: {
        winner: {
          userId: winnerPlayer._id,
          username: winnerPlayer.username,
          oldRating: winnerOldRating,
          newRating: winnerNewRating
        },
        loser: {
          userId: loserPlayer._id,
          username: loserPlayer.username,
          oldRating: loserOldRating,
          newRating: loserNewRating
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save match result.",
      error: error.message
    });
  }
};

// filtering
const getAllMatches = async (req, res) => {
  try {
    const {
      status,
      bestOf,
      straightsAllowed,
      roundTimeSeconds,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    let currentUser = null;

    if (req.user?.userId) {
      currentUser = await User.findById(req.user.userId);
    }

    if (status) query.status = status;
    if (bestOf) query.bestOf = Number(bestOf);
    if (straightsAllowed !== undefined) {
      query.straightsAllowed = straightsAllowed === "true";
    }
    if (roundTimeSeconds) query.roundTimeSeconds = Number(roundTimeSeconds);

    const allowedSortFields = ["createdAt", "startedAt", "finishedAt", "bestOf"];
    const selectedSortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";
    const sortDirection = order === "asc" ? 1 : -1;

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (currentPage - 1) * pageSize;

    const totalItems = await Match.countDocuments(query);

    const matches = await Match.find(query)
      .sort({ [selectedSortField]: sortDirection })
      .skip(skip)
      .limit(pageSize)
      .populate("players.user", "username eloRating")
      .populate("winnerUser", "username eloRating");

      const visibleMatches = matches.filter((match) => {
      if (!currentUser) return true;

      const creatorElo = match.creatorElo || 1200;
      const userElo = currentUser.eloRating || 1200;

      if (match.eloPreference === "higher") {
        return userElo > creatorElo;
      }

      if (match.eloPreference === "lower") {
        return userElo < creatorElo;
      }

      if (match.eloPreference === "similar") {
        return Math.abs(userElo - creatorElo) <= 100;
      }

      return true;
    });

    return res.status(200).json({
      success: true,
      message: "Matches retrieved successfully.",
      pagination: {
        totalItems,
        currentPage,
        pageSize,
        totalPages: Math.ceil(totalItems / pageSize)
      },
      data: visibleMatches
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve matches.",
      error: error.message
    });
  }
};

const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;

    const match = await Match.findById(id)
      .populate("players.user", "username eloRating")
      .populate("winnerUser", "username eloRating");

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Match retrieved successfully.",
      data: match
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve match.",
      error: error.message
    });
  }
};

const createComment = async (req, res) => {
  try {
    const { targetType, targetId, content } = req.body;

    if (!req.user || req.user.role === "anonymous") {
      return res.status(403).json({
        success: false,
        message: "Only registered users can leave comments."
      });
    }

    if (!targetType || !targetId || !content) {
      return res.status(400).json({
        success: false,
        message: "targetType, targetId, and content are required."
      });
    }

    if (!["match", "tournament"].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: "targetType must be either 'match' or 'tournament'."
      });
    }

    const comment = await Comment.create({
      author: req.user.userId,
      targetType,
      targetId,
      content
    });

    const populatedComment = await Comment.findById(comment._id).populate("author", "username");

    return res.status(201).json({
      success: true,
      message: "Comment created successfully.",
      data: populatedComment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create comment.",
      error: error.message
    });
  }
};

const getComments = async (req, res) => {
  try {
    const { targetType, targetId } = req.query;

    const query = {};

    if (targetType && targetId) {
      query.targetType = targetType;
      query.targetId = targetId;
    }

    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .populate("author", "username");

    return res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get comments",
      error: error.message
    });
  }
};

// admin only
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedComment = await Comment.findByIdAndDelete(id);

    if (!deletedComment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete comment.",
      error: error.message
    });
  }
};

// leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const { sortBy = "wins", order = "desc", page = 1, limit = 10 } = req.query;

    const users = await User.find({
      role: { $in: ["user", "admin"] },
      isBanned: false
    }).select("username eloRating wins matchesPlayed");

    const leaderboard = users.map((user) => {
      const wins = user.wins || 0;
      const matchesPlayed = user.matchesPlayed || 0;
      const winPercentage =
        matchesPlayed > 0 ? Number(((wins / matchesPlayed) * 100).toFixed(2)) : 0;

      return {
        _id: user._id,
        username: user.username,
        eloRating: user.eloRating,
        wins,
        matchesPlayed,
        winPercentage
      };
    });

    const allowedSortFields = ["wins", "winPercentage", "matchesPlayed", "eloRating"];
    const selectedSortField = allowedSortFields.includes(sortBy) ? sortBy : "wins";
    const sortDirection = order === "asc" ? 1 : -1;

    leaderboard.sort((a, b) => {
      if (a[selectedSortField] < b[selectedSortField]) return -1 * sortDirection;
      if (a[selectedSortField] > b[selectedSortField]) return 1 * sortDirection;
      return 0;
    });

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 10, 1);
    const start = (currentPage - 1) * pageSize;
    const paginatedData = leaderboard.slice(start, start + pageSize);

    return res.status(200).json({
      success: true,
      message: "Leaderboard retrieved successfully.",
      pagination: {
        totalItems: leaderboard.length,
        currentPage,
        pageSize,
        totalPages: Math.ceil(leaderboard.length / pageSize)
      },
      data: paginatedData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve leaderboard.",
      error: error.message
    });
  }
};

// activity
const getPlatformActivity = async (req, res) => {
  try {
    const ongoingGames = await Match.countDocuments({
      status: "ongoing",
      isAnonymousMatch: false
    });

    const activeUsersThisWeek = await User.countDocuments({
      role: { $in: ["user", "admin"] },
      isBanned: false,
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const recentMatches = await Match.find({
      status: "finished",

    })
      .sort({ finishedAt: -1 })
      .limit(10)
      .populate("players.user", "username eloRating")
      .populate("winnerUser", "username");

    const upcomingTournaments = await Tournament.find({
      startDate: { $gte: new Date() },
      status: { $in: ["open", "scheduled"] }
    })
      .sort({ startDate: 1 })
      .limit(5);

    const pastTournaments = await Tournament.find({
      status: "finished"
    })
      .sort({ endDate: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      message: "Platform activity retrieved successfully.",
      data: {
        ongoingGames,
        activeUsersThisWeek,
        recentMatches,
        upcomingTournaments,
        pastTournaments
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve platform activity.",
      error: error.message
    });
  }
};

module.exports = {
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
};