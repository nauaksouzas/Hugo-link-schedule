import dotenv from "dotenv";
dotenv.config();
process.env.TZ = "America/New_York"; // Force New York timezone 

export const SERVICES = [
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

export function isGoogleApiConfigured(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || clientId.trim() === "" || clientId.includes("PASTE_")) return false;
  if (!clientSecret || clientSecret.trim() === "" || clientSecret.includes("PASTE_")) return false;
  if (!refreshToken || refreshToken.trim() === "" || refreshToken.includes("PASTE_")) return false;

  return true;
}

export async function getGoogleAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!isGoogleApiConfigured()) {
    throw new Error("Calendar is not connected yet. Please contact Hugo directly.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId || "",
      client_secret: clientSecret || "",
      refresh_token: refreshToken || "",
      grant_type: "refresh_token"
    })
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || "Failed to retrieve access token from Google.");
  }

  return data.access_token;
}

export async function getBusyIntervals(dateStr: string): Promise<{ start: string; end: string }[]> {
  const token = await getGoogleAccessToken();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  // Eastern Time offset dynamically format workaround (fallback simple for now)
  // Determine if daylight savings: NY is -04:00 or -05:00. TimeMin format needs offset.
  // Using Intl API to format string to get correct offset dynamically could be ideal, but for MVP:
  // Since we run in Vercel TZ="America/New_York", the date object start/end strings 
  // constructed natively as ISO will have the correct TZ behavior when comparing.
  
  // But Google FreeBusy query requires valid bounds with offset. A clean way without explicit offset string:
  const timeMin = new Date(`${dateStr}T00:00:00`).toISOString();
  const timeMax = new Date(`${dateStr}T23:59:59`).toISOString();

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

export function getRedirectUri(req: any): string {
  if (process.env.GOOGLE_REDIRECT_URI && process.env.GOOGLE_REDIRECT_URI.trim() !== "") {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  const host = req.headers.host || "";
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}/api/google/oauth/callback`;
}
