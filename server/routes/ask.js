const express = require("express");
const router = express.Router();

const db = require("../db");
const { generatePrompt } = require("../utils/promptTemplate");
const callOpenRouter = require("../services/openRouter");
const sendError = require("../utils/errorHandler");

// Basic sanitization
function sanitizeQuestion(question) {
  if (typeof question !== "string") return "";
  question = question.trim();
  if (question.length > 300) return "";
  const unsafeChars = /[`"'\\;]/g;
  return question.replace(unsafeChars, "");
}

router.post("/ask", async (req, res) => {
  let { question } = req.body;
  console.log("📥 Received question:", question);

  question = sanitizeQuestion(question);

  if (!question) {
    return sendError(res, "Invalid or too long question.", 400);
  }

  const prompt = generatePrompt(question);
  console.log("📤 Generated Prompt:\n", prompt);

  try {
    console.log("⏳ Sending prompt to OpenRouter...");
    const answer = await callOpenRouter(prompt);
    console.log("🤖 AI Raw Answer:", answer);

    let sql = "", explanation = "";

    // Try parsing JSON response from AI
    try {
      const parsed = JSON.parse(answer);
      sql = parsed.sql?.trim();
      explanation = parsed.explanation?.trim();

      if (!sql) {
        return sendError(res, "AI returned no SQL.", 400);
      }
    } catch (parseErr) {
      console.error("❌ JSON Parse Error:", parseErr);
      return res.status(500).json({
        success: false,
        error: "AI response not in JSON format.",
        raw: answer
      });
    }

    // Add fallback date filter if not present
    if (!/date\s*(=|>=|<=|>|<|GLOB|LIKE)/i.test(sql)) {
      if (/WHERE/i.test(sql)) {
        sql = sql.replace(/WHERE/i, "WHERE date GLOB '????-??-??' AND");
      } else if (/(GROUP BY|ORDER BY|LIMIT)/i.test(sql)) {
        sql = sql.replace(/(GROUP BY|ORDER BY|LIMIT)/i, "WHERE date GLOB '????-??-??' $1");
      } else {
        sql += "\nWHERE date GLOB '????-??-??'";
      }
    }

    console.log("✅ Final SQL:", sql);

    // Execute SQL
    const rows = await db.runQuery(sql);
    return res.json({ success: true, sql, explanation, rows });

  } catch (err) {
    console.error("💥 AI Service/DB Error:", err);
    return sendError(res, "Something went wrong on the server.", 500);
  }
});

module.exports = router;
