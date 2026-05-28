# Hugo Barber - Custom Google Calendar Integrated Booking Software

A premium, custom scheduling engine for Hugo Barber connected directly to the Google Calendar API.

## Production App URL

The official Vercel deployment URL is:
**[https://hugo-link-schedule.vercel.app/](https://hugo-link-schedule.vercel.app/)**

The Google OAuth Redirect URI is explicitly set to:
**\`https://hugo-link-schedule.vercel.app/api/google/oauth/callback\`**

## What this version does

This version is a fully integrated custom booking software that connects to Hugo's real Google Calendar using Vercel Serverless Functions.

1. **Service Menu Selection**: Client selects a service inside the premium dark/gold interface.
2. **Wash & Dry Add-on**: Optional checkbox adds $0 and +10 minutes to the appointment duration.
3. **Real-time Google Calendar Sync**: Queries the Google FreeBusy API to fetch real 15-minute time slots (Mon-Sat 9 AM - 6 PM).
4. **Client Details**: Client fills their contact card (fullname, phone, optional email, notes, preferred language).
5. **No Double Bookings**: Performs an overlap check before creating the appointment.
6. **Instant Insert**: If free, the application uses the Google Calendar Events API to insert the event directly into Hugo's Google Calendar with details. 
7. **Payment**: Remains strictly in person only. No upfront checkouts needed.

---

## Technical Architecture

This is a full-stack **Vite + React + Vercel Serverless** application.
- The backend uses Vercel API routes (`/api/*`).
- Local development is supported via an Express wrapper (`server.ts`) that runs Vite middleware alongside the API route handlers.
- All secrets are located securely server-side inside Vercel Environment Variables.

---

## Configuration & Setup on Google Cloud Console

To allow the Vercel app to speak to Google Calendar:

1. Create or use a Google Cloud project.
2. Enable **Google Calendar API**.
3. Configure the **OAuth consent screen**.
4. Create an OAuth Client ID of type **"Web application"**.
5. Add this exact **Authorized redirect URI**: 
   `https://hugo-link-schedule.vercel.app/api/google/oauth/callback`
6. *(If the OAuth app is in Testing mode, add Hugo's Google email as a Test User).*
7. Copy your `Client ID` and `Client Secret`.

### Vercel Environment Variables

Configure these secrets in your **Vercel Project Settings** -> Environment Variables:

```env
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
GOOGLE_REDIRECT_URI="https://hugo-link-schedule.vercel.app/api/google/oauth/callback"
GOOGLE_CALENDAR_ID="primary"
BUSINESS_TIMEZONE="America/New_York"
GOOGLE_REFRESH_TOKEN=""
```

### Obtaining the Reset Token

Once Vercel is configured with your Client ID and Client Secret, visit:
**[https://hugo-link-schedule.vercel.app/api/google/auth/start](https://hugo-link-schedule.vercel.app/api/google/auth/start)**

You will be redirected to Google to authorize the app. Once authorized, the callback page will display your permanent `GOOGLE_REFRESH_TOKEN`. Copy and paste it back into Vercel, and simply redeploy the app or wait for the environment variables to sync!

---

## Local Development Commands

Run these to run or compile the application locally:

- **Run Dev Server**: `npm run dev`
- **Linter & Checks**: `npm run lint`
- **Production Build**: `npm run build`
- **Production Start**: `npm run start`

---

## Business Information

- **Brand**: Hugo Barber
- **Barber**: Hugo (Only Barber)
- **Location**: Goat Barbershop
- **Address**: 39 South Street, Framingham, MA
- **Phone**: (504) 754-0419
- **Email**: hugogoncalves2000@icloud.com
- **Hours**: Monday to Saturday, 9:00 AM to 6:00 PM (Sundays closed)
- **Payment**: In person only
