const User = require("../models/userSchema");
const Comment = require("../models/commentSchema");
const Match = require("../models/matchSchema");
const Tournament = require("../models/tournamentSchema");
const SecurityIncident = require("../models/securityIncidentSchema");

const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalComments = await Comment.countDocuments();
    const totalMatches = await Match.countDocuments();
    const totalTournaments = await Tournament.countDocuments();

    const securityIncidents = await SecurityIncident.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("userId", "username email");

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalComments,
        totalMatches,
        totalTournaments,
        securityIncidents,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard.",
      error: error.message,
    });
  }
};

const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load users.",
      error: error.message,
    });
  }
};

const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned, role } = req.body;

    if (req.user.userId === id && isBanned === true) {
      return res.status(400).json({
        success: false,
        message: "You cannot ban your own admin account.",
      });
    }

    const updates = {};

    if (typeof isBanned === "boolean") {
      updates.isBanned = isBanned;
    }

    if (role === "admin" || role === "user") {
      updates.role = role;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      returnDocument: "after",
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update user.",
      error: error.message,
    });
  }
};

const deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.userId === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own admin account.",
      });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete user.",
      error: error.message,
    });
  }
};

const getAdminComments = async (req, res) => {
  try {
    const comments = await Comment.find()
      .sort({ createdAt: -1 })
      .populate("author", "username email");

    return res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load comments.",
      error: error.message,
    });
  }
};

const deleteAdminComment = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedComment = await Comment.findByIdAndDelete(id);

    if (!deletedComment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete comment.",
      error: error.message,
    });
  }
};

module.exports = {
  getAdminDashboard,
  getAdminUsers,
  deleteAdminUser,
  getAdminComments,
  updateAdminUser,
  deleteAdminComment,
};