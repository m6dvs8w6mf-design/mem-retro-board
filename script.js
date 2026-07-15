const sampleFlights = {
  departures: [
    ["3:20 PM", "DL2478", "DELTA", "ATLANTA", "B17", "ON TIME"],
    ["3:45 PM", "AA1834", "AMERICAN", "CHARLOTTE", "B06", "BOARDING"],
    ["4:05 PM", "WN1928", "SOUTHWEST", "DALLAS LOVE", "A24", "DELAYED"],
    ["4:25 PM", "UA5412", "UNITED", "CHICAGO", "B18", "ON TIME"],
    ["4:50 PM", "G4176", "ALLEGIANT", "ORLANDO", "C03", "FINAL CALL"]
  ],
  arrivals: [
    ["3:12 PM", "DL2081", "DELTA", "ATLANTA", "B15", "ARRIVED"],
    ["3:38 PM", "AA1640", "AMERICAN", "DALLAS", "B08", "ON TIME"],
    ["4:02 PM", "WN2810", "SOUTHWEST", "HOUSTON", "A21", "ON TIME"],
    ["4:30 PM", "UA4371", "UNITED", "DENVER", "B20", "DELAYED"],
    ["4:55 PM", "NK221", "SPIRIT", "LAS VEGAS", "A09", "ON TIME"]
  ]
};

let flights = sampleFlights;
let liveFlights = sampleFlights;

const $ = id => document.getElementById(id);
const ui = {
  departures: $("departuresButton"), arrivals: $("arrivalsButton"), heritage: $("heritageButton"),
  cycle: $("cycleButton"), sound: $("soundButton"), fullscreen: $("fullscreenButton"),
  rows: $("flightRows"), city: $("cityHeading"), title: $("boardTitle"),
  status: $("dataStatus"), verification: $("verificationText")
};

let mode = "departures";
let cycleOn = localStorage.getItem("mem-cycle") === "on";
let soundOn = localStorage.getItem("mem-sound") === "on";
let cycleTimer = null;
let audio = null;
let displayedFlights = null;
let displayedTitle = "";
let liveSignature = "";
let usingLiveData = false;
let heritageOn = false;
let heritageTimer = null;
let heritageCursor = 0;
let heritageDeck = [];
let heritageFlights = { departures: [], arrivals: [] };
const CHARACTER_WHEEL = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:.-/";
const FIELD_WIDTHS = [7, 3, 7, 14, 3, 13];
const STEP_INTERVAL = 190;
const CARRIER_NAMES = {
  DL: "DELTA", AA: "AMERICAN", WN: "SOUTHWEST",
  UA: "UNITED", G4: "ALLEGIANT", NK: "SPIRIT",
  F9: "FRONTIER", MX: "BREEZE", SY: "SUN COUNTRY"
};

Object.assign(CARRIER_NAMES, {
  PA: "PAN AM", OZ: "OZARK", NW: "NORTHWEST", NWO: "NORTHWEST ORIENT",
  TW: "TWA", RC: "REPUBLIC", QH: "AIR FLORIDA", EA: "EASTERN",
  NA: "NATIONAL", PI: "PIEDMONT", WA: "WESTERN", PE: "PEOPLE EXPRESS",
  AF: "AIR FRANCE", BA: "BOAC", HP: "AMERICA WEST", KL: "KLM", LH: "LUFTHANSA"
});

const CARRIER_IDS = Object.fromEntries(Object.entries(CARRIER_NAMES).map(([id, name]) => [name, id]));
const COMMONS_FILE = name => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}`;
const LOGO_FILES = {
  PA: "Pan Am Logo.svg",
  OZ: "Ozark Air Lines Logo, December 1985.svg",
  NW: "Northwest Airlines Logo.svg",
  NWO: "Northwest Orient Airlines (1969) Logo.jpg",
  TW: "TWA 1975 logo.svg",
  RC: "Republic Airlines Logo, October 1984.svg",
  QH: "Logoairflorida.svg",
  EA: "Eastern Airlines logo.svg",
  NA: "National Airlines (NA) Logo.png",
  PI: "Piedmont Airlines logo 1962-1974.svg",
  WA: "Western Airlines.svg",
  PE: "Logo of People Express Airlines (1987).png",
  AF: "Air France logo (1976-1990).svg",
  BA: "Logo wordmark British Overseas Airways Corporation (BOAC) 1939-1974.png",
  HP: "Former America West Airlines logo.svg",
  KL: "KLM logo.svg",
  LH: "Lufthansa-Logo 1964.svg"
};

const HERITAGE_CARRIERS = [
  { id: "PA", prefix: "PA", name: "PAN AM", cities: ["NEW YORK", "LONDON", "PARIS", "ROME", "FRANKFURT"] },
  { id: "OZ", prefix: "OZ", name: "OZARK", cities: ["ST LOUIS", "TULSA", "CEDAR RAPIDS", "NASHVILLE"] },
  { id: "NW", prefix: "NW", name: "NORTHWEST", cities: ["MINNEAPOLIS", "DETROIT", "SEATTLE", "PORTLAND"] },
  { id: "NWO", prefix: "NW", name: "NORTHWEST ORIENT", cities: ["TOKYO", "ANCHORAGE", "MINNEAPOLIS", "HONOLULU"] },
  { id: "TW", prefix: "TW", name: "TWA", cities: ["NEW YORK", "LOS ANGELES", "KANSAS CITY", "SAN FRANCISCO"] },
  { id: "RC", prefix: "RC", name: "REPUBLIC", cities: ["DETROIT", "MINNEAPOLIS", "ATLANTA", "CHICAGO"] },
  { id: "QH", prefix: "QH", name: "AIR FLORIDA", cities: ["MIAMI", "TAMPA", "WASHINGTON", "ORLANDO"] },
  { id: "EA", prefix: "EA", name: "EASTERN", cities: ["ATLANTA", "MIAMI", "NEW YORK", "BOSTON"] },
  { id: "NA", prefix: "NA", name: "NATIONAL", cities: ["MIAMI", "NEW ORLEANS", "LOS ANGELES", "HOUSTON"] },
  { id: "PI", prefix: "PI", name: "PIEDMONT", cities: ["CHARLOTTE", "ROANOKE", "WASHINGTON", "RICHMOND"] },
  { id: "WA", prefix: "WA", name: "WESTERN", cities: ["LOS ANGELES", "DENVER", "SALT LAKE", "SAN FRANCISCO"] },
  { id: "PE", prefix: "PE", name: "PEOPLE EXPRESS", cities: ["NEWARK", "BUFFALO", "BOSTON", "CLEVELAND"] },
  { id: "AF", prefix: "AF", name: "AIR FRANCE", cities: ["PARIS ORLY", "PARIS CDG", "MONTREAL", "NEW YORK"] },
  { id: "BA", prefix: "BA", name: "BOAC", cities: ["LONDON", "BERMUDA", "NEW YORK", "MONTREAL"] },
  { id: "HP", prefix: "HP", name: "AMERICA WEST", cities: ["PHOENIX", "LAS VEGAS", "SAN DIEGO", "LOS ANGELES"] },
  { id: "KL", prefix: "KL", name: "KLM", cities: ["AMSTERDAM", "NEW YORK", "MONTREAL", "CHICAGO"] },
  { id: "LH", prefix: "LH", name: "LUFTHANSA", cities: ["FRANKFURT", "HAMBURG", "NEW YORK", "CHICAGO"] }
];

function shuffle(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function refillHeritageDeck() {
  const panAm = HERITAGE_CARRIERS.find(carrier => carrier.id === "PA");
  heritageDeck = [panAm, ...shuffle(HERITAGE_CARRIERS.filter(carrier => carrier.id !== "PA"))];
}

function takeHeritageCarrier(excluded = new Set()) {
  if (!heritageDeck.length) refillHeritageDeck();
  let index = heritageDeck.findIndex(carrier => !excluded.has(carrier.id));
  if (index < 0) {
    refillHeritageDeck();
    index = heritageDeck.findIndex(carrier => !excluded.has(carrier.id));
  }
  return heritageDeck.splice(Math.max(index, 0), 1)[0];
}

function randomChoice(values) { return values[Math.floor(Math.random() * values.length)]; }

function heritageTime(position) {
  const value = new Date();
  value.setSeconds(0, 0);
  value.setMinutes(Math.ceil(value.getMinutes() / 5) * 5 + 10 + position * 15 + Math.floor(Math.random() * 3) * 5);
  return value.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function makeHeritageFlight(carrier, direction, position) {
  const remarks = direction === "departures"
    ? ["ON TIME", "BOARDING", "GATE OPEN", "FINAL CALL"]
    : ["ON TIME", "ARRIVED", "EXPECTED", "LANDED"];
  const number = 100 + Math.floor(Math.random() * 800);
  const gate = String(1 + Math.floor(Math.random() * 28));
  return [heritageTime(position), `${carrier.prefix}${number}`, carrier.name,
    randomChoice(carrier.cities), gate, randomChoice(remarks), carrier.id];
}

function buildHeritageSchedule() {
  refillHeritageDeck();
  const used = new Set();
  heritageFlights = { departures: [], arrivals: [] };
  ["departures", "arrivals"].forEach(direction => {
    for (let index = 0; index < 5; index += 1) {
      const carrier = takeHeritageCarrier(used);
      used.add(carrier.id);
      heritageFlights[direction].push(makeHeritageFlight(carrier, direction, index));
    }
  });
  heritageCursor = 0;
}

function rotateHeritageFlight() {
  const direction = heritageCursor % 2 === 0 ? "departures" : "arrivals";
  const rowIndex = Math.floor(heritageCursor / 2) % 5;
  const visible = new Set([...heritageFlights.departures, ...heritageFlights.arrivals].map(row => row[6]));
  const carrier = takeHeritageCarrier(visible);
  heritageFlights[direction][rowIndex] = makeHeritageFlight(carrier, direction, rowIndex);
  heritageCursor += 1;
  if (heritageOn) {
    flights = heritageFlights;
    render();
  }
}

function updateClock() {
  const now = new Date();
  const seconds = now.getSeconds();
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;
  $("secondHand").style.transform = `rotate(${seconds * 6}deg)`;
  $("minuteHand").style.transform = `rotate(${minutes * 6}deg)`;
  $("hourHand").style.transform = `rotate(${hours * 30}deg)`;
  $("analogClock").setAttribute("aria-label", `Memphis local time ${now.toLocaleTimeString("en-US")}`);
  $("date").textContent = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase();
}

function liveRow(flight) {
  const code = String(flight.airlinecode || "").toUpperCase();
  const number = String(flight.flightnumber || "");
  return [flight.scheduled || "--:--", `${code}${number}`, CARRIER_NAMES[code] || code,
    flight.city || "UNKNOWN", flight.gate || "--", String(flight.remarks || "ON TIME").toUpperCase()];
}

async function loadLiveFlights() {
  const checkedAt = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  try {
    const response = await fetch(`flights.json?_=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.departures?.length || !data.arrivals?.length) throw new Error("Incomplete flight data");
    const nextFlights = {
      departures: data.departures.map(liveRow),
      arrivals: data.arrivals.map(liveRow)
    };
    const nextSignature = JSON.stringify(nextFlights);
    liveFlights = nextFlights;
    usingLiveData = true;
    const ageMinutes = (Date.now() - new Date(data.updatedAt).getTime()) / 60000;
    const label = ageMinutes > 60 ? "MEM DATA DELAYED" : "LIVE MEM DATA";
    const updatedAt = new Date(data.updatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    if (!heritageOn) ui.status.textContent = `${label} · UPDATED ${updatedAt} · CHECKED ${checkedAt}`;
    if (!heritageOn && nextSignature !== liveSignature) {
      flights = nextFlights;
      liveSignature = nextSignature;
      render();
    }
  } catch {
    const shouldRender = usingLiveData;
    liveFlights = sampleFlights;
    usingLiveData = false;
    liveSignature = "";
    if (!heritageOn) ui.status.textContent = `SAMPLE DATA · LIVE MEM FEED UNAVAILABLE · CHECKED ${checkedAt}`;
    if (!heritageOn && shouldRender) {
      flights = sampleFlights;
      render();
    }
  }
}

function clickSound() {
  if (!soundOn) return;
  audio ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === "suspended") audio.resume();
  const now = audio.currentTime;
  const length = Math.ceil(audio.sampleRate * .034);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 4.2);
  }

  const impact = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  impact.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1120 + Math.random() * 240, now);
  filter.Q.setValueAtTime(.8, now);
  gain.gain.setValueAtTime(.031, now);
  gain.gain.exponentialRampToValueAtTime(.001, now + .034);
  impact.connect(filter).connect(gain).connect(audio.destination);
  impact.start(now);
}

function wheelCharacter(character) {
  return CHARACTER_WHEEL.includes(character) ? character : " ";
}

function nextCharacter(character) {
  const position = CHARACTER_WHEEL.indexOf(wheelCharacter(character));
  return CHARACTER_WHEEL[(position + 1) % CHARACTER_WHEEL.length];
}

function stepsToCharacter(from, to) {
  const start = CHARACTER_WHEEL.indexOf(wheelCharacter(from));
  const finish = CHARACTER_WHEEL.indexOf(wheelCharacter(to));
  return (finish - start + CHARACTER_WHEEL.length) % CHARACTER_WHEEL.length;
}

function showCharacter(flap, character) {
  flap.textContent = character === " " ? "\u00a0" : character;
}

function spinFlap(flap, from, to, startDelay) {
  let current = wheelCharacter(from);
  const steps = stepsToCharacter(current, to);
  showCharacter(flap, current);

  if (!steps) return;

  setTimeout(() => {
    let completed = 0;
    const advance = () => {
      current = nextCharacter(current);
      completed += 1;
      showCharacter(flap, current);
      flap.classList.remove("flip");
      void flap.offsetWidth;
      flap.classList.add("flip");
      clickSound();

      if (completed >= steps) {
        setTimeout(() => flap.classList.remove("flip"), STEP_INTERVAL);
        return;
      }
      setTimeout(advance, STEP_INTERVAL);
    };
    advance();
  }, startDelay);
}

function flapLine(value, previousValue = "", rowIndex = 0, columnIndex = 0) {
  const line = document.createElement("div");
  line.className = "flap-line";
  const target = String(value);
  const previous = String(previousValue).padEnd(target.length, " ");
  [...target].forEach((character, characterIndex) => {
    const flap = document.createElement("span");
    flap.className = "flap";
    const moduleNumber = rowIndex * 41 + columnIndex * 13 + characterIndex * 7;
    const startDelay = 35 + (moduleNumber % 9) * 17;
    spinFlap(flap, previous[characterIndex] || " ", character, startDelay);
    line.append(flap);
  });
  return line;
}

function fixedField(value, width) {
  return String(value).toUpperCase().slice(0, width).padEnd(width, " ");
}

function renderTitle() {
  const target = fixedField(heritageOn ? "HERITAGE" : mode, 10);
  ui.title.replaceChildren(flapLine(target, displayedTitle, 7, 2));
  displayedTitle = target;
}

function statusClass(value) { return `status-${value.toLowerCase().replaceAll(" ", "-")}`; }

function carrierCode(flightNumber) {
  return String(flightNumber).slice(0, 2).padEnd(2, "-");
}

function carrierModule(code, previousCode, rowIndex) {
  const module = document.createElement("div");
  module.className = `carrier-module carrier-${code.trim()}`;
  if (heritageOn) module.classList.add("heritage-carrier");
  module.setAttribute("aria-label", `Carrier ${CARRIER_NAMES[code.trim()] || code.trim()}`);
  let emblem;
  if (heritageOn && LOGO_FILES[code.trim()]) {
    emblem = document.createElement("img");
    emblem.className = "carrier-logo";
    emblem.alt = "";
    emblem.src = COMMONS_FILE(LOGO_FILES[code.trim()]);
    emblem.addEventListener("error", () => {
      const fallback = document.createElement("span");
      fallback.className = "carrier-emblem";
      fallback.textContent = code.trim().slice(0, 2);
      emblem.replaceWith(fallback);
    }, { once: true });
  } else {
    emblem = document.createElement("span");
    emblem.className = "carrier-emblem";
    if (heritageOn) emblem.textContent = code.trim().slice(0, 2);
  }
  const details = document.createElement("span");
  details.className = "carrier-details";
  const name = document.createElement("span");
  name.className = "carrier-name";
  name.textContent = CARRIER_NAMES[code.trim()] || "AIRLINE";
  details.append(name);
  module.append(emblem, details);
  if (code !== previousCode) {
    setTimeout(() => {
      module.classList.add("flip");
      clickSound();
      setTimeout(() => module.classList.remove("flip"), 620);
    }, 80 + rowIndex * 95);
  }
  return module;
}

function displayRow(values) {
  const [time, flight, airline, city, gate, status, heritageId] = values;
  return [flight, heritageId || CARRIER_IDS[airline] || carrierCode(flight), time, city, gate, status];
}

function render() {
  ui.rows.replaceChildren();
  const departing = mode === "departures";
  ui.city.textContent = departing ? "TO" : "FROM";
  renderTitle();
  ui.departures.classList.toggle("active", departing);
  ui.arrivals.classList.toggle("active", !departing);
  ui.departures.setAttribute("aria-pressed", departing);
  ui.arrivals.setAttribute("aria-pressed", !departing);

  const boardRows = flights[mode].map(displayRow);
  boardRows.forEach((values, rowIndex) => {
    const row = document.createElement("tr");
    values.forEach((value, columnIndex) => {
      const cell = document.createElement("td");
      if (columnIndex === 1) cell.className = "carrier-cell";
      if (columnIndex === 4) cell.classList.add("gate-cell");
      if (columnIndex === 5) cell.classList.add(statusClass(flights[mode][rowIndex][5]));
      const fieldValue = fixedField(value, FIELD_WIDTHS[columnIndex]);
      const previousValue = displayedFlights?.[rowIndex]?.[columnIndex] || "";
      cell.append(columnIndex === 1
        ? carrierModule(fieldValue, previousValue, rowIndex)
        : flapLine(fieldValue, previousValue, rowIndex, columnIndex));
      row.append(cell);
    });
    ui.rows.append(row);
  });
  displayedFlights = boardRows.map(row =>
    row.map((value, columnIndex) => fixedField(value, FIELD_WIDTHS[columnIndex]))
  );
}

function setMode(next) { mode = next; render(); }

function setHeritage(next) {
  heritageOn = next;
  ui.heritage.classList.toggle("active", next);
  ui.heritage.setAttribute("aria-pressed", next);
  clearInterval(heritageTimer);
  displayedFlights = null;
  displayedTitle = "";

  if (next) {
    if (!heritageFlights.departures.length) buildHeritageSchedule();
    flights = heritageFlights;
    ui.status.textContent = "HERITAGE DISPLAY · FICTIONAL NON-REPEATING TIMETABLE";
    ui.verification.textContent = "AIRLINE MARKS SHOWN FOR HISTORICAL DISPLAY";
    heritageTimer = setInterval(rotateHeritageFlight, 30000);
    render();
  } else {
    flights = liveFlights;
    ui.status.textContent = "LIVE MEM DATA · REFRESHING";
    ui.verification.textContent = "VERIFY INFORMATION WITH MEM OR YOUR AIRLINE";
    render();
    loadLiveFlights();
  }
}

function setCycle(next) {
  cycleOn = next;
  localStorage.setItem("mem-cycle", next ? "on" : "off");
  ui.cycle.textContent = `AUTO CYCLE: ${next ? "ON" : "OFF"}`;
  ui.cycle.classList.toggle("active", next);
  ui.cycle.setAttribute("aria-pressed", next);
  clearInterval(cycleTimer);
  cycleTimer = next ? setInterval(() => setMode(mode === "departures" ? "arrivals" : "departures"), 15000) : null;
}

function setSound(next) {
  soundOn = next;
  localStorage.setItem("mem-sound", next ? "on" : "off");
  ui.sound.textContent = `SOUND: ${next ? "ON" : "OFF"}`;
  ui.sound.classList.toggle("active", next);
  ui.sound.setAttribute("aria-pressed", next);
  if (next) clickSound();
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch { alert("Full-screen mode was blocked. You can also press F11."); }
}

ui.departures.addEventListener("click", () => setMode("departures"));
ui.arrivals.addEventListener("click", () => setMode("arrivals"));
ui.heritage.addEventListener("click", () => setHeritage(!heritageOn));
ui.cycle.addEventListener("click", () => setCycle(!cycleOn));
ui.sound.addEventListener("click", () => setSound(!soundOn));
ui.fullscreen.addEventListener("click", toggleFullscreen);

document.addEventListener("fullscreenchange", () => {
  const active = Boolean(document.fullscreenElement);
  document.body.classList.toggle("fullscreen-mode", active);
  ui.fullscreen.textContent = active ? "EXIT FULL SCREEN" : "FULL SCREEN";
});

document.addEventListener("keydown", event => {
  if (event.target.matches("button")) return;
  const key = event.key.toLowerCase();
  if (key === "a") setCycle(!cycleOn);
  if (key === "h") setHeritage(!heritageOn);
  if (key === "s") setSound(!soundOn);
  if (key === "f") toggleFullscreen();
  if (event.key === "ArrowLeft") setMode("departures");
  if (event.key === "ArrowRight") setMode("arrivals");
});

updateClock();
setInterval(updateClock, 1000);
setCycle(cycleOn);
setSound(soundOn);
render();
loadLiveFlights();
setInterval(loadLiveFlights, 300000);
