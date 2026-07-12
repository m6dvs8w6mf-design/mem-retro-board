const flights = {
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

const $ = id => document.getElementById(id);
const ui = {
  departures: $("departuresButton"), arrivals: $("arrivalsButton"),
  cycle: $("cycleButton"), sound: $("soundButton"), fullscreen: $("fullscreenButton"),
  rows: $("flightRows"), city: $("cityHeading"), title: $("boardTitle")
};

let mode = "departures";
let cycleOn = localStorage.getItem("mem-cycle") === "on";
let soundOn = localStorage.getItem("mem-sound") === "on";
let cycleTimer = null;
let audio = null;
let displayedFlights = null;
const CHARACTER_WHEEL = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:.-/";

function updateClock() {
  const now = new Date();
  $("time").textContent = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
  $("date").textContent = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase();
}

function clickSound() {
  if (!soundOn) return;
  audio ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === "suspended") audio.resume();
  const now = audio.currentTime;
  const length = Math.ceil(audio.sampleRate * .022);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 5);
  }

  const impact = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  impact.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1450 + Math.random() * 350, now);
  filter.Q.setValueAtTime(.65, now);
  gain.gain.setValueAtTime(.035, now);
  gain.gain.exponentialRampToValueAtTime(.001, now + .022);
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
    const timer = setInterval(() => {
      current = nextCharacter(current);
      completed += 1;
      showCharacter(flap, current);
      flap.classList.remove("flip");
      void flap.offsetWidth;
      flap.classList.add("flip");
      if (completed % 2 === 1) clickSound();

      if (completed >= steps) {
        clearInterval(timer);
        setTimeout(() => flap.classList.remove("flip"), 150);
      }
    }, 58);
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

function statusClass(value) { return `status-${value.toLowerCase().replaceAll(" ", "-")}`; }

function render() {
  ui.rows.replaceChildren();
  const departing = mode === "departures";
  ui.city.textContent = departing ? "DESTINATION" : "ORIGIN";
  ui.title.textContent = mode.toUpperCase();
  ui.departures.classList.toggle("active", departing);
  ui.arrivals.classList.toggle("active", !departing);
  ui.departures.setAttribute("aria-pressed", departing);
  ui.arrivals.setAttribute("aria-pressed", !departing);

  flights[mode].forEach((values, rowIndex) => {
    const row = document.createElement("tr");
    values.forEach((value, columnIndex) => {
      const cell = document.createElement("td");
      if (columnIndex === 5) cell.className = statusClass(value);
      const previousValue = displayedFlights?.[rowIndex]?.[columnIndex] || "";
      cell.append(flapLine(value, previousValue, rowIndex, columnIndex));
      row.append(cell);
    });
    ui.rows.append(row);
  });
  displayedFlights = flights[mode].map(row => [...row]);
}

function setMode(next) { mode = next; render(); }

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
