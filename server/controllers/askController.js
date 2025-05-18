// === askController.js ===
const logger = require("../utils/logger");
const db = require("../db/queryRunner");
const { generatePrompt } = require("../utils/promptTemplate");
const callOpenRouter = require("../services/openRouter");
const sendError = require("../utils/errorHandler");

const askHandler = async (req, res) => {
  const { question, model } = req.body;
  logger.log("📥 Received question:", question);

  if (!question) {
    return sendError(res, "Question is required.", 400);
  }

  const prompt = generatePrompt(question);
  logger.log("🧠 Generated prompt:", prompt);

  let answer;
  try {
    const chosenModel = model || "openai/gpt-3.5-turbo";
    logger.log("🔁 Calling OpenRouter API with model:", chosenModel);

    answer = await callOpenRouter(prompt, chosenModel);
    logger.log("🤖 Raw AI response:", answer);
  } catch (err) {
    logger.error("💥 Error while calling OpenRouter:", err);
    return res.status(503).json({
      success: false,
      error: "Oops! Our AI is a bit overwhelmed right now. Please try again in a moment.",
    });
  }

  let sql, explanation;
  try {
    const parsed = JSON.parse(answer);
    sql = parsed.sql?.trim();
    explanation = parsed.explanation?.trim();

    if (!sql) {
      return sendError(res, "AI did not return SQL.", 400);
    }

    if (!sql.toLowerCase().startsWith("select")) {
      return sendError(res, "Only SELECT queries are allowed.", 400);
    }

    if (!/date\s+(=|>=|<=|>|<|GLOB|LIKE)/i.test(sql)) {
      if (/WHERE/i.test(sql)) {
        sql = sql.replace(/WHERE/i, "WHERE date GLOB '????-??-??' AND");
      } else if (/(GROUP BY|ORDER BY|LIMIT)/i.test(sql)) {
        sql = sql.replace(/(GROUP BY|ORDER BY|LIMIT)/i, "WHERE date GLOB '????-??-??' $1");
      } else {
        sql += "\nWHERE date GLOB '????-??-??'";
      }
    }

    logger.log("📄 Final SQL:", sql);
    logger.log("📘 Explanation:", explanation);
  } catch (parseErr) {
    logger.error("❌ JSON Parse Error:", parseErr);
    return res.status(500).json({
      success: false,
      error: "AI response not in valid JSON.",
      details: {
        rawResponse: answer,
        parseError: parseErr.message,
      },
    });
  }

  try {
    const rows = await db.runQuery(sql);
    return res.json({ success: true, sql, explanation, rows });
  } catch (dbErr) {
    logger.error("🧨 Database query failed:", dbErr);
    return res.status(500).json({
      success: false,
      error: "Database error.",
      details: {
        sql,
        dbError: dbErr.message,
        stack: dbErr.stack,
      },
    });
  }
};

module.exports = askHandler;
