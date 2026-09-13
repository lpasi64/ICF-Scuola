import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "ICF-Scuola proxy" });
});

// Proxy endpoint
app.post("/chat", async (req, res) => {
  if (!DEEPSEEK_API_KEY) {
    return res.status(500).json({ error: "API key non configurata sul server." });
  }

  const { messages, system } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Campo 'messages' mancante o non valido." });
  }

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: system || "" },
          ...messages
        ],
        max_tokens: 1024,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    res.json({ text });

  } catch (err) {
    console.error("Errore proxy:", err);
    res.status(500).json({ error: "Errore interno del proxy." });
  }
});

app.listen(PORT, () => console.log(`ICF proxy in ascolto su porta ${PORT}`));
