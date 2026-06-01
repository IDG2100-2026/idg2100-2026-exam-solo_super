const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User", default: null},
    usernameSnapshot: {type: String, default: ""}
  },
  { _id: false }
);

//remember all rolls
const roundSchema = new mongoose.Schema(
  {
    roundNumber: {type: Number, required: true},
    playerOneRolls: {type: [String], default: []},
    playerTwoRolls: {type: [String], default: []},
    playerOneHolds: {type: [String], default: []},
    playerTwoHolds: {type: [String], default: []},
    roundWinner: {type: String, default: ""}
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    players: {type: [playerSchema], default: []
    },
    anonymousPlayers: {type: Number, default: 0, min: 0, max: 2},
    isAnonymousMatch: {type: Boolean, default: false},
    bestOf: {type: Number, required: true, enum: [3, 5, 7]},
    straightsAllowed: {type: Boolean, required: true, default: true},
    roundTimeSeconds: {type: Number, required: true, enum: [3, 10, 30]},
    categoryKey: {type: String,required: true},
    status: {type: String,enum: ["waiting", "ongoing", "finished", "cancelled"], default: "waiting"},
    winnerType: {type: String, enum: ["registered", "anonymous", null], default: null},
    winnerUser: {type: mongoose.Schema.Types.ObjectId, ref: "User", default: null},
    rounds: {type: [roundSchema], default: []},
    finalOutcome: {type: String, default: ""},
    hideFromAnonymous: { type: Boolean, default: false },
    matchComments: {type: String, default: ""},
    commentsEnabled: {type: Boolean,default: true},
    startedAt: {type: Date, default: null},
    finishedAt: {type: Date, default: null}, 
    creatorElo: {type: Number, default: 1200},
    eloPreference: {type: String, enum: ["any", "higher", "lower", "similar"], default: "any"}
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Match", matchSchema);