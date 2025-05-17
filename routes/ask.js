const express = require("express");
const router = express.Router();

const db = require("../db");
const { generatePrompt } = require("../utils/promptTemplate");
const callOpenRouter = require("../services/openRouter");

router.post("/ask", async (req, res) => {
  const { question } = req.body;
  console.log("📥 Received question:", question);
  const sendError = require("../utils/errorHandler");
  if (!question || question.length > 300) {
    return sendError(res, "Invalid or too long question.", 400);
  }
  try {
    // your AI call & JSON parse logic
  } catch (parseErr) {
    console.error("❌ JSON Parse Error:", parseErr);
    return sendError(res, "AI response not in JSON format.");
  }

  const prompt = generatePrompt(question);

  try {
    const answer = await callOpenRouter(prompt);
    console.log("🤖 AI raw answer:", answer);

    let sql = "",
      explanation = "";

    try {
      const parsed = JSON.parse(answer);
      sql = parsed.sql?.trim();
      explanation = parsed.explanation?.trim();

      if (!sql) {
        return res
          .status(400)
          .json({ success: false, error: "AI returned no SQL." });
      }
    } catch (parseErr) {
      console.error("❌ JSON Parse Error:", parseErr);
      return res
        .status(500)
        .json({
          success: false,
          error: "AI response not in JSON.",
          raw: answer,
        });
    }

    try {
      const rows = await db.runQuery(sql);
      return res.json({ success: true, sql, explanation, rows });
    } catch (dbErr) {
      console.error("💥 DB Error:", dbErr);
      return res
        .status(500)
        .json({ success: false, error: dbErr.message, sql, explanation });
    }
  } catch (err) {
    console.error("💥 OpenRouter Error:", err);
    return res.status(500).json({ success: false, error: "AI service error" });
  }
});

module.exports = router;
