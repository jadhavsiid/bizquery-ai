// === routes/ask.js ===
const express = require("express");
const router = express.Router();
const askHandler = require("../controllers/askController");
const sanitizeQuestion = require("../middleware/sanitize");

// Route for handling business question
// Now supports optional "model" in the request body
router.post("/ask", sanitizeQuestion, askHandler);

module.exports = router;
