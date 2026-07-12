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

function flapLine(value) {
  const line = document.createElement("div");
  line.className = "flap-line";
  [...String(value)].forEach(character => {
    const flap = document.createElement("span");
    flap.className = "flap";
    flap.textContent = character === " " ? "\u00a0" : character;
    line.append(flap);
  });
  return line;
}

function statusClass(value) { return `status-${value.toLowerCase().replaceAll(" ", "-")}`; }

function animate(row, rowIndex) {
  row.querySelectorAll(".flap").forEach((flap, index) => {
    setTimeout(() => {
      flap.classList.add("flip");
      if (index % 2 === 0) clickSound();
      setTimeout(() => flap.classList.remove("flip"), 680);
    }, rowIndex * 150 + index * 34);
  });
}

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
      cell.append(flapLine(value));
      row.append(cell);
    });
    ui.rows.append(row);
    animate(row, rowIndex);
  });
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
