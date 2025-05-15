const express = require("express");
const cors = require("cors");
require("dotenv").config(); // to use .env variables

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // so we can send/receive JSON

// 🧪 Test Route
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working! 🔥" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
