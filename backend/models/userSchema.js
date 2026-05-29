const mongoose = require("mongoose");

const trophySchema = new mongoose.Schema(
  {
    title: {type: String, required: true, trim: true},
    imageUrl: {type: String, default: ""},
    tournamentId: {type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true},
    awardedAt: {type: Date, default: Date.now}
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30},
    email: {type: String, required: true, unique: true, trim: true, lowercase: true},
    password: {type: String, required: true, minlength: 6, select: false},
    age: {type: Number, required: true, min: 18},
    role: {type: String, enum: ["user", "admin"], default: "user"},
    eloRating: {type: Number, default: 0},
    wins: {type: Number, default: 0},
    matchesPlayed: {type: Number, default: 0},
    isBanned: {type: Boolean, default: false},
    trophies: {type: [trophySchema], default: []}, 
    profileImage: {type: String, default: ""},
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);