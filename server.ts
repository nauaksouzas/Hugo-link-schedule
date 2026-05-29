import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

import authStartHandler from "./api/google/auth/start.js";
import authCallbackHandler from "./api/google/oauth/callback.js";
import availabilityHandler from "./api/availability.js";
import bookingsHandler from "./api/bookings.js";
import healthHandler from "./api/health.js";
import envCheckHandler from "./api/env-check.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes mapped to Vercel handlers
  app.get("/api/google/auth/start", authStartHandler);
  app.get("/api/google/oauth/callback", authCallbackHandler);
  app.get("/api/availability", availabilityHandler);
  app.post("/api/bookings", bookingsHandler);
  app.get("/api/health", healthHandler);
  app.get("/api/env-check", envCheckHandler);

  // Fallback for health check removed since handled above

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production fallback
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
