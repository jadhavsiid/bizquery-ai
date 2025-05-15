require("dotenv").config();
console.log("OpenRouter API Key Loaded:", process.env.OPENROUTER_API_KEY ? "YES" : "NO")
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🧪 Test Route
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working! 🔥" });
});

// 🤖 GenAI Route with OpenRouter
app.post("/api/ask", async (req, res) => {
  const { question } = req.body;
  console.log("Received question:", question);

  const prompt = `
You are a business analyst and SQL expert.

Given the following schema:
- sales(id, cust_id, amt, dt)
- customers(id, name, regn)
- products(id, cat, cost)

Answer this vague business question by generating a SQL query and explaining the result in plain English.

Question: "${question}"

Respond like:
SQL: ...
Explanation: ...
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "bizquery-ai",
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    console.log("🧠 Full OpenRouter response:");
    console.dir(data, { depth: null });

    let answer = "No response received.";
    if (data.choices && data.choices[0]?.message?.content) {
      answer = data.choices[0].message.content;
    } else if (data.error) {
      answer = `OpenRouter Error: ${data.error.message}`;
    }

    res.json({ answer });
  } catch (err) {
    console.error("🚨 Exception while calling OpenRouter:", err.message || err);
    res.status(500).send("AI Error");
  }
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
