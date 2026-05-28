import { getRedirectUri } from "../../../src/backend/utils";
import dotenv from "dotenv";
dotenv.config();

export default function handler(req: any, res: any) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getRedirectUri(req);

  if (!clientId || clientId.trim() === "" || clientId.includes("PASTE_")) {
    return res.status(400).send("<h1>Configuration Error</h1><p>Please configure the <code>GOOGLE_CLIENT_ID</code> environment variable.</p>");
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
}
