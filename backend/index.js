const cookieParser = require("cookie-parser");
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

//connect to database
connectDB();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/tournaments", tournamentRoutes);

//error handling
app.use(errorMiddleware);

//start
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});