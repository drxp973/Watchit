import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function startServer() {
  const app = express();
  const PORT = Number.parseInt(process.env.PORT ?? "", 10) || 3000;

  app.use(express.json());

  app.get("/api/addon-streams", async (req, res) => {
    try {
      const manifestUrl = String(req.query.manifestUrl ?? "");
      const type = String(req.query.type ?? "movie");
      const id = String(req.query.id ?? "");
      if (!manifestUrl || !id) {
        res.status(400).json({ error: "manifestUrl and id are required", streams: [] });
        return;
      }
      const base = manifestUrl.replace(/\/manifest\.json\/?$/i, "").replace(/\/$/, "");
      const streamUrl = `${base}/stream/${encodeURIComponent(type)}/${encodeURIComponent(id)}.json`;
      const upstream = await fetch(streamUrl);
      if (!upstream.ok) {
        res.status(upstream.status).json({
          error: `Upstream ${upstream.status}`,
          streams: [],
        });
        return;
      }
      const json = (await upstream.json()) as { streams?: unknown[] };
      res.json(json);
    } catch (e) {
      console.error("addon-streams:", e);
      res.status(500).json({ error: "Failed to fetch streams", streams: [] });
    }
  });

  // API Route for AI Recommendations
  app.post("/api/recommendations", async (req, res) => {
    const { prompt, history } = req.body;
    try {
      const model = "gemini-3-flash-preview";
      const systemInstruction = `You are a movie and show recommendation expert. 
      Based on the user's request and their watch history, suggest 5 movies, shows, or animes.
      Return the response in JSON format with the following structure:
      {
        "recommendations": [
          {
            "id": "unique_id",
            "title": "Title",
            "description": "Short description",
            "type": "movie|show|anime",
            "genre": ["Genre1", "Genre2"],
            "posterUrl": "https://picsum.photos/seed/{title}/300/450"
          }
        ]
      }`;

      const response = await ai.models.generateContent({
        model,
        contents: `User request: ${prompt}. User history: ${JSON.stringify(history)}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
