# Hugo Barber - Custom Google Calendar Integrated Booking Software

A premium, custom scheduling engine for Hugo Barber connected directly to the Google Calendar API.

## What this version does

This version is a fully integrated custom booking software that connects to Hugo's real Google Calendar, removing all reliance on redirect links, Calendly, or generic widgets.

1. **Service Menu Selection**: Client selects a service inside the premium dark/gold interface.
2. **Wash & Dry Add-on**: Optional checkbox adds $0 and +10 minutes to the appointment duration.
3. **Real-time Google Calendar Sync**: When the client chooses a date, the software makes a backend query using Google's FreeBusy API to inspect Hugo's calendar and return actual available 15-minute time slots (working hours Monday-Saturday 9 AM - 6 PM, Sunday closed).
4. **Client Details**: Client fills their contact card (fullname, phone, optional email, notes, preferred language).
5. **No Double Bookings**: When the client clicks "Confirm Appointment", the backend runs a final overlap check against Google Calendar.
6. **Instant Insert**: If free, the application uses the Google Calendar Events API to insert the event directly into Hugo's Google Calendar with details mapped in English/Portuguese, then displays a success screen.
7. **Payment**: Remains strictly in person only. No upfront checkouts needed.

---

## Technical Architecture

This is a full-stack **Express + React (Vite) + tsx** application.
- All secrets are located securely server-side; the client browser never has visibility into your Google OAuth client secrets, refresh tokens, or credentials.
- In Development: Express hosts Vite middleware as a single-port solution running on port `3000`.
- In Production: The server compiles to a self-contained CommonJS Node executable (`dist/server.cjs`) using `esbuild` for speed and dependency protection.

---

## Configuration & Setup

### 1. Environment Variables
Configure the following secrets/variables in your AI Studio secrets board or your local `.env` file:

```env
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
GOOGLE_REDIRECT_URI="YOUR_APP_URL/api/google/oauth/callback"
GOOGLE_CALENDAR_ID="primary"
GOOGLE_REFRESH_TOKEN="YOUR_GOOGLE_REFRESH_TOKEN"
BUSINESS_TIMEZONE="America/New_York"
```

### 2. How to obtain your `GOOGLE_REFRESH_TOKEN` (HOW-TO)

To make it incredibly easy for Hugo to authorize his calendar and extract his permanent Refresh Token:

1. Create a project in the **Google Cloud Console**.
2. Enable the **Google Calendar API**.
3. Go to **OAuth Consent Screen**: set up a "Web Application" client ID and secret.
4. Add your redirect URI, matching your production or development URL: e.g., `http://localhost:3000/api/google/oauth/callback` or `https://your-preview-url.run.app/api/google/oauth/callback`.
5. Run the application (`npm run dev`).
6. Visit **`/api/google/auth/start`** in your browser.
7. Complete Google's login flow. You will be redirected back to the site callback, which will securely read and output your permanent `GOOGLE_REFRESH_TOKEN` directly on screen!
8. Copy this token, paste it into your `GOOGLE_REFRESH_TOKEN` environment variable, and you're fully connected!

---

## Commands

Run these to run or compile the application:

- **Run Dev Server**: `npm run dev`
- **Linter & Checks**: `npm run lint`
- **Production Build**: `npm run build`
- **Production Start**: `npm run start`

---

## Business Information

- **Hugo Barber** (Hugo Gonçalves)
- **Goat Barbershop**
- **Address**: 39 South Street, Framingham, MA
- **Phone**: (504) 754-0419
- **Email**: hugogoncalves2000@icloud.com
- **Hours**: Monday to Saturday, 9:00 AM to 6:00 PM (Sundays closed)
- **Payment**: In person only
