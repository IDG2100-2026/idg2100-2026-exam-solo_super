const Tournament = require("../models/tournamentSchema");
const User = require("../models/userSchema");

const buildCategoryKey = (bestOf, straightsAllowed, roundTimeSeconds) => {
  return `bestOf${bestOf}_straights${straightsAllowed ? "On" : "Off"}_${roundTimeSeconds}s`;
};

//prevent translation bugs
const normalizeBoolean = (value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return value;
};

const normalizeNumber = (value) => {
  if (value === undefined || value === null || value === "") return value;
  return Number(value);
};

const createTournament = async (req, res) => {
  try {
    const title = req.body.title?.trim();
    const description = req.body.description?.trim();
    const startDate = req.body.startDate;
    const endDate = req.body.endDate || null;

    const bestOf = normalizeNumber(req.body.bestOf);
    const straightsAllowed = normalizeBoolean(req.body.straightsAllowed);
    const roundTimeSeconds = normalizeNumber(req.body.roundTimeSeconds);
    const minPlayers = normalizeNumber(req.body.minPlayers);
    const maxPlayers = normalizeNumber(req.body.maxPlayers);

    const createdBy = req.user?.userId || req.body.createdBy || null;
    const status = req.body.status || "open";

    const trophyTitle = req.body.trophyTitle?.trim() || "";
    const trophyImageUrl =
      req.file
        ? `/uploads/trophy-images/${req.file.filename}`
        : req.body.trophyImageUrl || "";

    const participants = Array.isArray(req.body.participants)
      ? req.body.participants
      : [];

    const rounds = Array.isArray(req.body.rounds) ? req.body.rounds : [];

    //validation for requests
    if (
      !title ||
      !description ||
      !startDate ||
      bestOf === undefined ||
      straightsAllowed === undefined ||
      roundTimeSeconds === undefined ||
      minPlayers === undefined ||
      maxPlayers === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "title, description, startDate, bestOf, straightsAllowed, roundTimeSeconds, minPlayers, and maxPlayers are required."
      });
    }

    if (!createdBy) {
      return res.status(400).json({
        success: false,
        message: "createdBy is required either from auth or request body."
      });
    }

    if (minPlayers > maxPlayers) {
      return res.status(400).json({
        success: false,
        message: "minPlayers cannot be greater than maxPlayers."
      });
    }

    const categoryKey = buildCategoryKey(
      bestOf,
      straightsAllowed,
      roundTimeSeconds
    );

    const newTournament = await Tournament.create({
      title,
      description,
      startDate,
      endDate,
      categoryKey,
      bestOf,
      straightsAllowed,
      roundTimeSeconds,
      minPlayers,
      maxPlayers,
      createdBy,
      participants,
      rounds,
      status,
      trophy: {
        title: trophyTitle,
        imageUrl: trophyImageUrl
      },
      winner: req.body.winner || null
    });

    return res.status(201).json({
      success: true,
      message: "Tournament created successfully.",
      data: newTournament
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create tournament.",
      error: error.message
    });
  }
};

const getAllTournaments = async (req, res) => {
  try {
    const {
      status,
      bestOf,
      straightsAllowed,
      roundTimeSeconds,
      sortBy = "startDate",
      order = "asc",
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (bestOf !== undefined) query.bestOf = Number(bestOf);
    if (straightsAllowed !== undefined) {
      query.straightsAllowed = straightsAllowed === "true";
    }
    if (roundTimeSeconds !== undefined) {
      query.roundTimeSeconds = Number(roundTimeSeconds);
    }

    const allowedSortFields = ["startDate", "createdAt", "title", "status"];
    const selectedSortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "startDate";
    const sortDirection = order === "desc" ? -1 : 1;

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (currentPage - 1) * pageSize;

    const totalItems = await Tournament.countDocuments(query);

    const tournaments = await Tournament.find(query)
      .sort({ [selectedSortField]: sortDirection })
      .skip(skip)
      .limit(pageSize)
      .populate("createdBy", "username")
      .populate("participants.user", "username eloRating")
      .populate("winner", "username eloRating");

    return res.status(200).json({
      success: true,
      message: "Tournaments retrieved successfully.",
      pagination: {
        totalItems,
        currentPage,
        pageSize,
        totalPages: Math.ceil(totalItems / pageSize)
      },
      data: tournaments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve tournaments.",
      error: error.message
    });
  }
};

const deleteTournament = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTournament = await Tournament.findByIdAndDelete(id);

    if (!deletedTournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tournament deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete tournament.",
      error: error.message,
    });
  }
};

const cancelTournament = async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await Tournament.findById(id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found.",
      });
    }

    tournament.status = "cancelled";
    await tournament.save();

    return res.status(200).json({
      success: true,
      message: "Tournament cancelled successfully.",
      data: tournament,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to cancel tournament.",
      error: error.message,
    });
  }
};

const getTournamentById = async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await Tournament.findById(id)
      .populate("createdBy", "username")
      .populate("participants.user", "username eloRating")
      .populate("winner", "username eloRating")
      .populate("rounds.matches.playerOne", "username eloRating")
      .populate("rounds.matches.playerTwo", "username eloRating")
      .populate("rounds.matches.winner", "username eloRating");

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tournament retrieved successfully.",
      data: tournament
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve tournament.",
      error: error.message
    });
  }
};

const joinTournament = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || req.user.role === "anonymous" || !req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Anonymous users cannot join tournaments."
      });
    }

    const tournament = await Tournament.findById(id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found."
      });
    }

    if (tournament.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "This tournament is not open for joining."
      });
    }

    const alreadyJoined = tournament.participants.some(
      (participant) => participant.user.toString() === req.user.userId
    );

    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: "You have already joined this tournament."
      });
    }

    if (tournament.participants.length >= tournament.maxPlayers) {
      return res.status(400).json({
        success: false,
        message: "This tournament is already full."
      });
    }

    tournament.participants.push({
      user: req.user.userId,
      joinedAt: new Date()
    });

    await tournament.save();

    return res.status(200).json({
      success: true,
      message: "Joined tournament successfully.",
      data: tournament
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to join tournament.",
      error: error.message
    });
  }
};

const startTournament = async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await Tournament.findById(id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found."
      });
    }

    if (tournament.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Tournament cannot be started in its current state."
      });
    }

    if (tournament.participants.length < tournament.minPlayers) {
      return res.status(400).json({
        success: false,
        message: "Not enough players to start this tournament."
      });
    }

    const shuffledParticipants = [...tournament.participants].sort(
      () => Math.random() - 0.5
    );

    const firstRoundMatches = [];

    for (let i = 0; i < shuffledParticipants.length; i += 2) {
      const playerOne = shuffledParticipants[i];
      const playerTwo = shuffledParticipants[i + 1] || null;

      firstRoundMatches.push({
        playerOne: playerOne.user,
        playerTwo: playerTwo ? playerTwo.user : null,
        winner: playerTwo ? null : playerOne.user,
        status: playerTwo ? "scheduled" : "bye"
      });
    }

    tournament.rounds = [
      {
        roundNumber: 1,
        matches: firstRoundMatches
      }
    ];

    tournament.status = "ongoing";

    await tournament.save();

    return res.status(200).json({
      success: true,
      message: "Tournament started successfully.",
      data: tournament
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to start tournament.",
      error: error.message
    });
  }
};

const leaveTournament = async (req, res) => {
  try {
    const userId = req.user.userId;

    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found.",
      });
    }

    tournament.participants = tournament.participants.filter(
      (participant) =>
        participant.user?.toString() !== userId.toString()
    );

    await tournament.save();

    return res.status(200).json({
      success: true,
      message: "Left tournament successfully.",
      data: tournament,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to leave tournament.",
      error: error.message,
    });
  }
};

const progressTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const { completedMatches } = req.body;

    const tournament = await Tournament.findById(id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found."
      });
    }

    if (tournament.status !== "ongoing") {
      return res.status(400).json({
        success: false,
        message: "Tournament is not currently ongoing."
      });
    }

    if (!completedMatches || !Array.isArray(completedMatches)) {
      return res.status(400).json({
        success: false,
        message: "completedMatches must be an array."
      });
    }

    if (tournament.rounds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tournament has no rounds to progress."
      });
    }

    const currentRound = tournament.rounds[tournament.rounds.length - 1];

    completedMatches.forEach((completedMatch) => {
      const roundMatch = currentRound.matches[completedMatch.matchIndex];
      if (roundMatch) {
        roundMatch.winner = completedMatch.winner;
        roundMatch.status = "finished";
      }
    });

    const winners = currentRound.matches.map((match) => match.winner).filter(Boolean);

    if (winners.length === 1) {
      tournament.winner = winners[0];
      tournament.status = "finished";
      tournament.endDate = new Date();

      const winnerUser = await User.findById(winners[0]);
      if (winnerUser) {
        winnerUser.trophies.push({
          title: tournament.trophy?.title || "Tournament Trophy",
          imageUrl: tournament.trophy?.imageUrl || "",
          tournamentId: tournament._id,
          awardedAt: new Date()
        });
        await winnerUser.save();
      }

      await tournament.save();

      return res.status(200).json({
        success: true,
        message: "Tournament finished successfully.",
        data: tournament
      });
    }

    const nextRoundMatches = [];

    for (let i = 0; i < winners.length; i += 2) {
      const playerOne = winners[i];
      const playerTwo = winners[i + 1] || null;

      nextRoundMatches.push({
        playerOne,
        playerTwo,
        winner: playerTwo ? null : playerOne,
        status: playerTwo ? "scheduled" : "bye"
      });
    }

    tournament.rounds.push({
      roundNumber: tournament.rounds.length + 1,
      matches: nextRoundMatches
    });

    await tournament.save();

    return res.status(200).json({
      success: true,
      message: "Tournament progressed to next round.",
      data: tournament
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to progress tournament.",
      error: error.message
    });
  }
};

module.exports = {
  createTournament,
  getAllTournaments,
  getTournamentById,
  deleteTournament,
  cancelTournament,
  joinTournament,
  startTournament,
  leaveTournament,
  progressTournament
};