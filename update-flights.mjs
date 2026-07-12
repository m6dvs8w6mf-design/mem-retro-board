import { writeFile } from "node:fs/promises";

const FEED_URL = "https://flymemphis.com/wp-content/flightdata/data.xml";
const response = await fetch(`${FEED_URL}?_=${Date.now()}`, { cache: "no-store" });
if (!response.ok) throw new Error(`MEM feed returned ${response.status}`);
const xml = await response.text();

function attributes(text) {
  const result = {};
  for (const match of text.matchAll(/([a-z]+)="([^"]*)"/gi)) result[match[1]] = match[2];
  return result;
}

function displayTime(value) {
  const raw = String(value || "").padStart(4, "0");
  let hour = Number(raw.slice(0, 2));
  const minute = raw.slice(2);
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${suffix}`;
}

const memNowParts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23"
}).formatToParts(new Date()).filter(part => part.type !== "literal").map(part => [part.type, part.value]));
const today = `${memNowParts.month}/${memNowParts.day}/${memNowParts.year.slice(-2)}`;
const currentMinutes = Number(memNowParts.hour) * 60 + Number(memNowParts.minute);

const records = [...xml.matchAll(/<flight\s+([^>]+?)\s*\/>/gi)].map(match => attributes(match[1]));
const relevant = records.filter(flight => flight.date === today).map(flight => {
  const raw = String(flight.scheduletime || "0000").padStart(4, "0");
  return {
    ...flight,
    scheduled: displayTime(raw),
    sortMinutes: Number(raw.slice(0, 2)) * 60 + Number(raw.slice(2))
  };
});

function board(direction) {
  const rows = relevant.filter(flight => flight.type === direction).sort((a, b) => a.sortMinutes - b.sortMinutes);
  const upcoming = rows.filter(flight => flight.sortMinutes >= currentMinutes - 90);
  return (upcoming.length ? upcoming : rows).slice(0, 5).map(({ sortMinutes, ...flight }) => flight);
}

const output = { updatedAt: new Date().toISOString(), source: FEED_URL, departures: board("D"), arrivals: board("A") };
if (!output.departures.length || !output.arrivals.length) throw new Error("MEM feed did not contain current arrivals and departures");
await writeFile("flights.json", `${JSON.stringify(output, null, 2)}\n`, "utf8");
