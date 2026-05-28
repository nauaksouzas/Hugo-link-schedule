process.env.TZ = "America/New_York"; // Force New York timezone natively in Node.js for scheduling offsets

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Load services in memory for backend lookup
const SERVICES = [
  { id: "regular_cut", pt: "Corte Normal", en: "Regular Cut", price: 50, duration: 45 },
  { id: "beard", pt: "Barba", en: "Beard", price: 25, duration: 20 },
  { id: "hair_beard", pt: "Cabelo e Barba", en: "Hair & Beard", price: 55, duration: 55 },
  { id: "eyebrow", pt: "Sobrancelha", en: "Eyebrow", price: 15, duration: 10 },
  { id: "neckline_beard", pt: "Pezinho + Barba", en: "Neckline + Beard", price: 30, duration: 25 },
  { id: "classic_scissor", pt: "Corte Clássico / Só Tesoura", en: "Classic Scissor Cut", price: 40, duration: 40 },
  { id: "premium_combo", pt: "Combo Premium", en: "Premium Combo", price: 75, duration: 60 },
  { id: "classic_combo", pt: "Combo Classic", en: "Classic Combo", price: 70, duration: 55 },
  { id: "hair_pigmentation", pt: "Pigmentação Cabelo", en: "Hair Pigmentation", price: 30, duration: 35 },
  { id: "beard_pigmentation", pt: "Pigmentação Barba", en: "Beard Pigmentation", price: 30, duration: 30 },
  { id: "hot_towel", pt: "Toalha Quente", en: "Hot Towel", price: 20, duration: 15 }
];

// Helper to refresh Google OAuth access token
async function getGoogleAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google Calendar API is not fully configured on the server (missing Client ID, Secret, or Refresh Token).");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || "Failed to retrieve access token from Google.");
  }

  return data.access_token;
}

// 1. Initiate Google OAuth Flow for Hugo Barber (Setup Helper)
app.get("/api/google/auth/start", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const rawRedirectUri = process.env.GOOGLE_REDIRECT_URI;
  
  const host = req.get("host") || "";
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const hostRedirectUri = `${protocol}://${host}/api/google/oauth/callback`;
  const redirectUri = rawRedirectUri || hostRedirectUri;

  if (!clientId) {
    return res.status(400).send("<h1>Configuration Error</h1><p>Please configure the <code>GOOGLE_CLIENT_ID</code> environment variable in your AI Studio secrets first.</p>");
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
    access_type: "offline",
    prompt: "consent"
  }).toString();

  res.redirect(authUrl);
});

// 2. Google OAuth Callback (Setup Helper to extract GOOGLE_REFRESH_TOKEN)
app.get("/api/google/oauth/callback", async (req, res) => {
  const code = req.query.code as string;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const rawRedirectUri = process.env.GOOGLE_REDIRECT_URI;

  const host = req.get("host") || "";
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const hostRedirectUri = `${protocol}://${host}/api/google/oauth/callback`;
  const redirectUri = rawRedirectUri || hostRedirectUri;

  if (!code) {
    return res.status(400).send("<h1>Auth Failed</h1><p>Missing authorization code from Google redirect.</p>");
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    const data = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return res.status(400).send(`<h1>Token Exchange Error</h1><pre>${JSON.stringify(data, null, 2)}</pre>`);
    }

    res.send(`
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 24px; border: 1px solid #c99a3c; border-radius: 12px; background: #0d0b08; color: #f8edd8;">
        <h1 style="color: #f1cf83; margin-top: 0;">Authorization Successful! 💈</h1>
        <p>You have connected your Google Calendar. Copy the Refresh Token below and paste it into your environment variable: <strong><code>GOOGLE_REFRESH_TOKEN</code></strong> in AI Studio (Secrets Manager).</p>
        <div style="background: rgba(255,255,255,0.08); padding: 14px; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 14px; margin: 18px 0; border: 1px solid rgba(201,154,60,0.3);">
          ${data.refresh_token || "<i>No Refresh Token returned. Try removing app access from Google Account Permissions and authorizing again to get a new refresh token.</i>"}
        </div>
        <p style="color: #bcae96; font-size: 13px;">Once this is set, your site can check and book slots directly in real-time!</p>
        <a href="/" style="display: inline-block; padding: 10px 18px; background: #c99a3c; color: #140e05; font-weight: bold; text-decoration: none; border-radius: 6px;">Return to Site</a>
      </div>
    `);
  } catch (error: any) {
    res.status(500).send(`<h1>Server Connection Error</h1><pre>${error.message || error}</pre>`);
  }
});

// Helper: check busy intervals from Google FreeBusy API
async function getBusyIntervals(dateStr: string): Promise<{ start: string; end: string }[]> {
  const token = await getGoogleAccessToken();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  // Query busy times from the start of the date to the end in Eastern zone
  const timeMin = `${dateStr}T00:00:00-04:00`;
  const timeMax = `${dateStr}T23:59:59-04:00`;

  const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: calendarId }]
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Error fetching busy slots from Google.");
  }

  const busyList = data.calendars?.[calendarId]?.busy || [];
  return busyList;
}

// 3. GET /api/availability - Get free time slots
app.get("/api/availability", async (req, res) => {
  const { date, serviceId, washDry } = req.query;

  if (!date || typeof date !== "string") {
    return res.status(400).json({ error: "Missing 'date' parameter (YYYY-MM-DD)" });
  }

  const service = SERVICES.find(s => s.id === serviceId);
  if (!service) {
    return res.status(400).json({ error: "Invalid or missing serviceId" });
  }

  const totalDuration = service.duration + (washDry === "true" ? 10 : 0);

  try {
    // Check if Sunday (0)
    const dayOfWeek = new Date(date + "T12:00:00").getDay();
    if (dayOfWeek === 0) {
      return res.json({ slots: [], isClosed: true });
    }

    // Attempt to read official busy slots
    let busyPeriods: { start: string; end: string }[] = [];
    let isDemo = false;

    if (!process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN.includes("PASTE_")) {
      isDemo = true;
    } else {
      try {
        busyPeriods = await getBusyIntervals(date);
      } catch (err: any) {
        console.error("FreeBusy check failed, reverting to Demo simulation:", err.message);
        isDemo = true;
      }
    }

    // Generate candidates (9:00 AM to 6:00 PM in 15-minute increments)
    const validSlots: string[] = [];
    const now = new Date();

    const startMinutes = 9 * 60; // 9:00 AM
    const endMinutes = 18 * 60;   // 6:00 PM (18:00)

    for (let minutes = startMinutes; minutes <= endMinutes; minutes += 15) {
      const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
      const mm = String(minutes % 60).padStart(2, "0");
      const formatTime = `${hh}:${mm}`;

      // Create timezone-aware Datetime objects locally assuming TZ="America/New_York"
      const slotStart = new Date(`${date}T${formatTime}:00`);
      const slotEnd = new Date(slotStart.getTime() + totalDuration * 60 * 1000);

      // 1. Prevent bookings in the past
      if (slotStart.getTime() <= now.getTime()) {
        continue;
      }

      // 2. Overlap check with Google Calendar busy periods
      let hasOverlap = false;
      for (const busy of busyPeriods) {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);

        if (slotStart.getTime() < busyEnd.getTime() && slotEnd.getTime() > busyStart.getTime()) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        validSlots.push(formatTime);
      }
    }

    res.json({ slots: validSlots, isDemo, isClosed: false });
  } catch (err: any) {
    console.error("Availability query error:", err);
    res.status(500).json({ error: err.message || "Something went wrong check availability" });
  }
});

// 4. POST /api/bookings - Insert booking event directly to Google Calendar
app.post("/api/bookings", async (req, res) => {
  const {
    serviceId,
    washDry,
    date,
    time,
    name,
    phone,
    email,
    language,
    notes
  } = req.body;

  if (!serviceId || !date || !time || !name || !phone) {
    return res.status(400).json({ error: "Missing required fields: serviceId, date, time, name and phone are mandatory." });
  }

  const service = SERVICES.find(s => s.id === serviceId);
  if (!service) {
    return res.status(400).json({ error: "Selected service is invalid." });
  }

  const totalDuration = service.duration + (washDry ? 10 : 0);
  const selectedStart = new Date(`${date}T${time}:00`);
  const selectedEnd = new Date(selectedStart.getTime() + totalDuration * 60 * 1000);

  const tokenConfigured = process.env.GOOGLE_REFRESH_TOKEN && !process.env.GOOGLE_REFRESH_TOKEN.includes("PASTE_");

  if (!tokenConfigured) {
    // Demo Mode placeholder simulation if no token is configured
    console.log("DEMO MODE BOOKING INPUT:", req.body);
    return res.json({
      success: true,
      isDemo: true,
      message: "Demo mode simulated successful confirmation!"
    });
  }

  try {
    // Re-check busy periods for confirmation safety (prevent race condition double booking)
    const busyPeriods = await getBusyIntervals(date);
    let hasOverlap = false;

    for (const busy of busyPeriods) {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);

      if (selectedStart.getTime() < busyEnd.getTime() && selectedEnd.getTime() > busyStart.getTime()) {
        hasOverlap = true;
        break;
      }
    }

    if (hasOverlap) {
      return res.status(409).json({ error: "The chosen time slot is no longer available. Please select another slot." });
    }

    // Refresh credentials and request inserting event
    const token = await getGoogleAccessToken();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    const serviceName = language === "Português" ? service.pt : service.en;
    const descText = [
      `Client: ${name}`,
      `Phone: ${phone}`,
      email ? `Email: ${email}` : "",
      `Preferred Language: ${language || "English"}`,
      `Service: ${serviceName}`,
      `Base Duration: ${service.duration} min`,
      `Wash & Dry: ${washDry ? "Yes (+10 mins)" : "No"}`,
      `Total Duration: ${totalDuration} min`,
      `Estimated Price: $${service.price}`,
      `Payment: In person only`,
      notes ? `Notes: ${notes}` : ""
    ].filter(Boolean).join("\n");

    const eventPayload = {
      summary: `Hugo Barber - ${serviceName} - ${name}`,
      location: "Goat Barbershop, 39 South Street, Framingham, MA",
      description: descText,
      start: {
        dateTime: selectedStart.toISOString(),
        timeZone: "America/New_York"
      },
      end: {
        dateTime: selectedEnd.toISOString(),
        timeZone: "America/New_York"
      }
    };

    const insertResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(eventPayload)
    });

    const installData = await insertResponse.json();
    if (!insertResponse.ok) {
      throw new Error(installData.error?.message || "Google calendar insertion failed.");
    }

    res.json({ success: true, eventId: installData.id });
  } catch (err: any) {
    console.error("Booking submission error:", err);
    res.status(500).json({ error: err.message || "Failed to submit booking appointment." });
  }
});

// Configure Vite middleware or production build output
async function startViteMiddleware() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
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
    console.log(`Hugo Barber server listening on port ${PORT}`);
  });
}

startViteMiddleware();
