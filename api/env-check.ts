import dotenv from "dotenv";
dotenv.config();

export default function handler(req: any, res: any) {
  res.json({
    ok: true,
    env: {
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI: !!process.env.GOOGLE_REDIRECT_URI,
      GOOGLE_CALENDAR_ID: !!process.env.GOOGLE_CALENDAR_ID,
      GOOGLE_REFRESH_TOKEN: !!process.env.GOOGLE_REFRESH_TOKEN,
      BUSINESS_TIMEZONE: !!process.env.BUSINESS_TIMEZONE
    }
  });
}
