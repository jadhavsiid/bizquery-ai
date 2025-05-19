const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const { runQuery } = require("./db"); // Import the database modul

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["https://bizquery-ai.vercel.app", "http://localhost:3000", "http://localhost:5173"],
  methods: ["GET", "POST"],
  credentials: true,
}));
app.use(express.json());

// Rate Limiting middleware for /api/ask
const askLimiter = rateLimit({
  windowMs: 3 * 1000, // 3 seconds
  max: 1, // 1 request per IP per window
  message: {
    error: "Too many requests – please slow down a bit. Try again in a few seconds.",
  },
});

// Routes
const askRoute = require("./routes/ask");
app.use("/api/ask", askLimiter, askRoute);

// Health check endpoint
app.get("/health", (req, res) => {
  res.send({ status: "ok" });
});

// Global error handler middleware
const errorBoundary = require("./middleware/errorBoundary");
app.use(errorBoundary);
app.get("/api/data", async (req, res) => {
  try {
    const data = await runQuery("SELECT * FROM your_table_name");
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Start server
app.listen(PORT, () => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  }
});