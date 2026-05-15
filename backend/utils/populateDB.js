const mongoose = require("mongoose");
const dotenv = require("dotenv");

const User = require("../models/userSchema");
const Match = require("../models/matchSchema");
const Tournament = require("../models/tournamentSchema");
const Comment = require("../models/commentSchema");

const users = require("../setup/dummy-user.json");
const matches = require("../setup/dummy-match.json");
const tournaments = require("../setup/dummy-tournament.json");
const comments = require("../setup/dummy-comments.json");

dotenv.config();

const connectDB = require("./connectDB");

const populateDB = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Match.deleteMany();
    await Tournament.deleteMany();
    await Comment.deleteMany();

    console.log("Old data removed");

    // Insert new data
    await User.insertMany(users);
    await Match.insertMany(matches);
    await Tournament.insertMany(tournaments);
    await Comment.insertMany(comments);

    console.log("Database populated successfully");

    process.exit();
  } catch (error) {
    console.error("Error populating database:", error);
    process.exit(1);
  }
};

populateDB();