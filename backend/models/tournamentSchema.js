const mongoose = require("mongoose");

//handle all participants
const participantSchema = new mongoose.Schema(
  {
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    joinedAt: {type: Date, default: Date.now}
  },
  { _id: false }
);

//basic schema
const tournamentMatchSchema = new mongoose.Schema(
  {
    playerOne: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    playerTwo: {type: mongoose.Schema.Types.ObjectId, ref: "User", default: null},
    winner: {type: mongoose.Schema.Types.ObjectId, ref: "User", default: null},
    status: {type: String, enum: ["scheduled", "ongoing", "finished", "bye"], default: "scheduled"},
    matchId: {type: mongoose.Schema.Types.ObjectId, ref: "Match", default: null,
},
  },
  { _id: false }
);

//unsure of the preformance of the tournament, possible changes
const tournamentRoundSchema = new mongoose.Schema(
  {
    roundNumber: {type: Number},
    matches: {type: [tournamentMatchSchema], default: []}
  },
  { _id: false }
);

//Trophy
const trophySchema = new mongoose.Schema(
  {
    title: {type: String, trim: true
    },
    imageUrl: {type: String, default: ""}
  },
  { _id: false }
);


//The actual schema
const tournamentSchema = new mongoose.Schema(
  {
    title: {type: String, required: true, trim: true,maxlength: 100},
    description: {type: String, required: true, trim: true, maxlength: 2000},
    startDate: {type: Date, required: true},
    endDate: {type: Date,default: null},
    categoryKey: {type: String},
    bestOf: {type: Number, enum: [3, 5, 7]},
    straightsAllowed: {type: Boolean},
    roundTimeSeconds: {type: Number, enum: [5, 10, 15]},
    minPlayers: {type: Number, required: true, min: 2},
    maxPlayers: {type: Number, required: true, min: 2},
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    participants: {type: [participantSchema], default: []},
    rounds: {type: [tournamentRoundSchema], default: []},
    status: {type: String, enum: ["open", "scheduled", "ongoing", "finished", "cancelled"], default: "open"},
    trophy: {type: trophySchema},
    winner: {type: mongoose.Schema.Types.ObjectId, ref: "User", default: null,
    currentRound: {type: Number, default: 0},
    totalRounds: {type: Number, default: 0},
    standings: {
      type: [{
        user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        points: {type: Number, default: 0,},
    },

  ],
  default: [],
},
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Tournament", tournamentSchema);