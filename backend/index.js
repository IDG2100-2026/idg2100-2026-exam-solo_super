const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");

const connectDB = require("./utils/connectDB");
const authMiddleware = require("./middleware/authMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const gameRoutes = require("./routes/gameRoutes");
const tournamentRoutes = require("./routes/tournamentRoutes");


// env load
dotenv.config();

// Creates Express
const app = express();
app.use(cookieParser());

//connect to database
connectDB();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));


//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//trophies
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//authentification
app.use(authMiddleware);

//confirmation
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Spanish Poker Dice API is running."
  });
});

//main routes


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/tournaments", tournamentRoutes);

const adminRoutes = require("./routes/adminRoutes");

app.use("/api/admin", adminRoutes);

//error handling
app.use(errorMiddleware);

//start
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  
  console.log("Socket connected:", socket.id);

  socket.on("dice-board-event", ({ matchId, eventName, detail }) => {
  socket.to(matchId).emit("dice-board-event", {
    eventName,
    detail,
  });
});

  socket.on("dice-board-event", ({ matchId, eventName, detail }) => {
  socket.to(matchId).emit("dice-board-event", {
    eventName,
    detail,
  });
});

  socket.on("new-comment", ({ matchId, comment }) => {
  io.to(matchId).emit("new-comment", comment);
});

  socket.on("join-match-room", (matchId) => {
    socket.join(matchId);
    console.log(`Socket ${socket.id} joined match room ${matchId}`);
});

  socket.on("leave-match-room", (matchId) => {
      socket.leave(matchId);
});

  socket.on("match-updated", (matchId) => {
      io.to(matchId).emit("match-updated");
});

  socket.on("dice-board-state", ({ matchId, state }) => {
  socket.to(matchId).emit("dice-board-state", state);
});

  socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
});
  });

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });