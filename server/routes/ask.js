// === ask.js ===
const express = require("express");
const router = express.Router();

const db = require("../db/queryRunner");
const { generatePrompt } = require("../utils/promptTemplate");
const callOpenRouter = require("../services/openRouter");
const sendError = require("../utils/errorHandler");
const sanitizeQuestion = require("../middleware/sanitize");

router.post("/ask", sanitizeQuestion, async (req, res) => {
  const { question } = req.body;
  console.log("📥 Received question:", question);

  const prompt = generatePrompt(question);
  console.log("🧠 Generated prompt:", prompt);

  let answer;
  try {
    answer = await callOpenRouter(prompt);
    console.log("🤖 Raw AI response:", answer);
  } catch (err) {
    console.error("💥 Error while calling OpenRouter:", err);
    return sendError(res, "AI service error. Try again later.");
  }

  let sql, explanation;
  try {
    const parsed = JSON.parse(answer);
    sql = parsed.sql?.trim();
    explanation = parsed.explanation?.trim();

    if (!sql) return sendError(res, "AI did not return SQL.", 400);

    // Inject date condition if missing
    if (!/date\s+(=|>=|<=|>|<|GLOB|LIKE)/i.test(sql)) {
      if (/WHERE/i.test(sql)) {
        sql = sql.replace(/WHERE/i, "WHERE date GLOB '????-??-??' AND");
      } else if (/(GROUP BY|ORDER BY|LIMIT)/i.test(sql)) {
        sql = sql.replace(/(GROUP BY|ORDER BY|LIMIT)/i, "WHERE date GLOB '????-??-??' $1");
      } else {
        sql += "\nWHERE date GLOB '????-??-??'";
      }
    }

    console.log("📄 SQL from AI:", sql);
    console.log("📘 Explanation from AI:", explanation);
  } catch (parseErr) {
    console.error("❌ JSON Parse Error:", parseErr);
    return res.status(500).json({ success: false, error: "AI response not in valid JSON.", raw: answer });
  }

  try {
    const rows = await db.runQuery(sql);
    return res.json({ success: true, sql, explanation, rows });
  } catch (dbErr) {
    console.error("🧨 Database query failed:", dbErr);
    return sendError(res, dbErr.message || "Database error.");
  }
});

module.exports = router;