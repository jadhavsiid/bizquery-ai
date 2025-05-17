// === index.js ===
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: ["https://bizquery-ai.vercel.app"],
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());

// Routes
const askRoute = require("./routes/ask");
app.use("/api", askRoute);

// Health route
app.get("/health", (req, res) => {
  res.send({ status: "ok" });
});

// Start server
app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  }
});