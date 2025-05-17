// services/openRouter.js
const fetch = require("node-fetch");

async function callOpenRouter(prompt) {
  const url = "https://openrouter.ai/api/v1/chat/completions";
  const headers = {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://bizquery-ai.vercel.app",
    "X-Title": "bizquery-ai",
  };

  const body = {
    model: "openai/gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error("No valid response from OpenRouter");
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("❌ Error in OpenRouter API call:", error.message);
    throw error;
  }
}

module.exports = callOpenRouter;
