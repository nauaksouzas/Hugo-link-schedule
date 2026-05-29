import { SERVICES, getBusyIntervals, isGoogleApiConfigured } from "./_lib/utils.js";

export default async function handler(req: any, res: any) {
  const { date, serviceIds, washDry } = req.query;

  if (!isGoogleApiConfigured()) {
    return res.status(400).json({ ok: false, error: "Calendar is not connected yet. Please contact Hugo directly." });
  }

  if (!date || typeof date !== "string") {
    return res.status(400).json({ error: "Missing 'date' parameter (YYYY-MM-DD)" });
  }

  if (!serviceIds || typeof serviceIds !== "string") {
    return res.status(400).json({ error: "Missing 'serviceIds' parameter" });
  }

  const ids = serviceIds.split(',');
  const selectedServices = SERVICES.filter(s => ids.includes(s.id));
  if (selectedServices.length === 0) {
    return res.status(400).json({ error: "Invalid serviceIds" });
  }

  const baseDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0);
  const totalDuration = baseDuration + (washDry === "true" ? 10 : 0);

  try {
    const dayOfWeek = new Date(date + "T12:00:00").getDay();
    if (dayOfWeek === 0) {
      return res.json({ slots: [], isClosed: true });
    }

    const busyPeriods = await getBusyIntervals(date);

    const validSlots: string[] = [];
    const now = new Date();

    const startMinutes = 9 * 60; // 9:00 AM
    const endMinutes = 18 * 60;   // 6:00 PM

    for (let minutes = startMinutes; minutes <= endMinutes; minutes += 15) {
      const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
      const mm = String(minutes % 60).padStart(2, "0");
      const formatTime = `${hh}:${mm}`;

      const slotStart = new Date(`${date}T${formatTime}:00`);
      const slotEnd = new Date(slotStart.getTime() + totalDuration * 60 * 1000);

      // Check against current time (don't allow booking in the past)
      if (slotStart.getTime() <= now.getTime()) {
        continue;
      }

      // Ensure the end time doesn't exceed closing time (default 6:00 PM)
      // Since endMinutes is 18*60, checking against start slot is fine but total duration could push past 6PM.
      const slotEndMinutes = minutes + totalDuration;
      if (slotEndMinutes > endMinutes) {
        continue; // End time goes past 6:00 PM
      }

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

    res.json({ slots: validSlots, isClosed: false });
  } catch (err: any) {
    console.error("Availability query error:", err);
    res.status(500).json({ ok: false, error: "Calendar is not connected yet. Please contact Hugo directly." });
  }
}
