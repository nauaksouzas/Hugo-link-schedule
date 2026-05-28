import { getRedirectUri } from "../../../src/backend/utils";
import dotenv from "dotenv";
dotenv.config();

export default async function handler(req: any, res: any) {
  const code = req.query.code as string;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getRedirectUri(req);

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
        <p>You have connected your Google Calendar. Copy the Refresh Token below and paste it into your environment variable: <strong><code>GOOGLE_REFRESH_TOKEN</code></strong> in Vercel.</p>
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
}
