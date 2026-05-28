import { SERVICES, getBusyIntervals, getGoogleAccessToken, isGoogleApiConfigured } from "../src/backend/utils";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isGoogleApiConfigured()) {
    return res.status(400).json({ ok: false, error: "Calendar is not connected yet. Please contact Hugo directly." });
  }

  const { serviceId, washDry, date, time, name, phone, email, language, notes } = req.body || {};

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

  try {
    // 1. Double check availability to prevent overlap
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
      return res.status(409).json({ error: "O horário selecionado não está mais disponível. Por favor, escolha outro horário." });
    }

    // 2. Insert into Google Calendar
    const token = await getGoogleAccessToken();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    const eventDesc = [
      `Client: ${name}`,
      `Phone: ${phone}`,
      email ? `Email: ${email}` : null,
      `Preferred language: ${language || 'English'}`,
      `Service: ${service.en} / ${service.pt}`,
      `Base duration: ${service.duration} min`,
      `Wash & Dry: ${washDry ? 'Yes (+10 mins)' : 'No'}`,
      `Total duration: ${totalDuration} min`,
      `Estimated price: $${service.price}`,
      `Payment: In person`,
      notes ? `\nNotes: ${notes}` : null
    ].filter(Boolean).join("\n");

    const eventStartStr = selectedStart.toISOString();
    const eventEndStr = selectedEnd.toISOString();

    const insertRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        summary: `Hugo Barber - ${service.en} - ${name}`,
        location: "Goat Barbershop, 39 South Street, Framingham, MA",
        description: eventDesc,
        start: {
          dateTime: eventStartStr,
          timeZone: process.env.BUSINESS_TIMEZONE || "America/New_York"
        },
        end: {
          dateTime: eventEndStr,
          timeZone: process.env.BUSINESS_TIMEZONE || "America/New_York"
        }
      })
    });

    const insertData = await insertRes.json();

    if (!insertRes.ok) {
      console.error("Failed to insert event:", insertData);
      throw new Error(insertData.error?.message || "Error inserting event into Google Calendar.");
    }

    res.json({ success: true, message: "Appointment confirmed!" });
  } catch (err: any) {
    console.error("Booking Error:", err);
    res.status(500).json({ ok: false, error: "We couldn’t add this appointment to Hugo’s calendar. Please contact Hugo directly." });
  }
}
