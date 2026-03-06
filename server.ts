import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // User-specific file-based database
  const DB_DIR = path.resolve("./backups");
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);
  
  const getDBPath = (email: string) => {
    const safeEmail = (email || 'default').replace(/[^a-z0-9@.]/gi, '_').toLowerCase();
    return path.join(DB_DIR, `${safeEmail}.json`);
  };

  const readDB = (email: string) => {
    try {
      const dbPath = getDBPath(email);
      if (fs.existsSync(dbPath)) {
        return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      }
    } catch (e) {
      console.error(`Error reading DB for ${email}`, e);
    }
    return {};
  };

  const writeDB = (email: string, data: any) => {
    try {
      const dbPath = getDBPath(email);
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(`Error writing DB for ${email}`, e);
    }
  };

  // API routes
  app.get("/api/data", (req, res) => {
    try {
      const email = req.query.email as string;
      console.log(`[Sync] Fetching data for ${email}`);
      const data = readDB(email);
      res.json(data);
    } catch (err) {
      console.error("[Sync] Error fetching data:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/sync", (req, res) => {
    try {
      const { email, data } = req.body;
      if (!data) return res.status(400).json({ error: "No data provided" });
      
      console.log(`[Sync] Received data from ${email}. Size: ${JSON.stringify(data).length} bytes`);
      writeDB(email, data);
      res.json({ status: "success", message: "Data synchronized" });
    } catch (err) {
      console.error("[Sync] Error during sync:", err);
      res.status(500).json({ status: "error", message: "Internal server error during sync" });
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
    // Production static serving
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
