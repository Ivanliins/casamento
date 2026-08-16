/**
 * INTEGRAÇÃO COM CALENDÁRIOS (GOOGLE CALENDAR & .ICS APPLE/OUTLOOK)
 */

const WeddingEventDetails = {
  title: "Casamento Izabela & Ivan",
  description: "Celebração do matrimônio de Izabela & Ivan. Cerimônia e Recepção na R. Abaíra, 264 - Jardim IV Centenario, Guarulhos - SP, 07161-010.",
  location: "R. Abaíra, 264 - Jardim IV Centenario, Guarulhos - SP, 07161-010",
  startDate: "2026-11-14T12:00:00",
  endDate: "2026-11-14T23:59:00"
};

function formatIsoForCalendar(dateString) {
  const d = new Date(dateString);
  return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
}

function addToGoogleCalendar() {
  const start = formatIsoForCalendar(WeddingEventDetails.startDate);
  const end = formatIsoForCalendar(WeddingEventDetails.endDate);
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    WeddingEventDetails.title
  )}&dates=${start}/${end}&details=${encodeURIComponent(
    WeddingEventDetails.description
  )}&location=${encodeURIComponent(WeddingEventDetails.location)}`;
  window.open(url, "_blank");
}

function downloadIcsFile() {
  const start = formatIsoForCalendar(WeddingEventDetails.startDate);
  const end = formatIsoForCalendar(WeddingEventDetails.endDate);
  const now = formatIsoForCalendar(new Date().toISOString());

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Casamento Isabella e Gabriel//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:casamento-isabella-gabriel-${Date.now()}@wedding.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${WeddingEventDetails.title}`,
    `DESCRIPTION:${WeddingEventDetails.description.replace(/\n/g, "\\n")}`,
    `LOCATION:${WeddingEventDetails.location}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", "casamento-isabella-gabriel.ics");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

window.addToGoogleCalendar = addToGoogleCalendar;
window.downloadIcsFile = downloadIcsFile;
window.WeddingEventDetails = WeddingEventDetails;
