const User = require("../models/userSchema");
const Match = require("../models/matchSchema");

const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMatches = await Match.countDocuments();

    return res.status(200).json({
      success: true,
      message: "Admin dashboard loaded.",
      data: {
        totalUsers,
        totalMatches,
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

module.exports = {
  getAdminDashboard,
};