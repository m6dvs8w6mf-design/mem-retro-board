const departures = [
  {
    time: "3:20 PM",
    flight: "DL 2478",
    airline: "DELTA",
    city: "ATLANTA",
    gate: "B17",
    status: "ON TIME"
  },
  {
    time: "3:45 PM",
    flight: "AA 1834",
    airline: "AMERICAN",
    city: "CHARLOTTE",
    gate: "B06",
    status: "BOARDING"
  },
  {
    time: "4:05 PM",
    flight: "WN 1928",
    airline: "SOUTHWEST",
    city: "DALLAS LOVE",
    gate: "A24",
    status: "DELAYED"
  },
  {
    time: "4:25 PM",
    flight: "UA 5412",
    airline: "UNITED",
    city: "CHICAGO",
    gate: "B18",
    status: "ON TIME"
  },
  {
    time: "4:50 PM",
    flight: "G4 176",
    airline: "ALLEGIANT",
    city: "ORLANDO",
    gate: "C03",
    status: "FINAL CALL"
  }
];

const arrivals = [
  {
    time: "3:12 PM",
    flight: "DL 2081",
    airline: "DELTA",
    city: "ATLANTA",
    gate: "B15",
    status: "ARRIVED"
  },
  {
    time: "3:38 PM",
    flight: "AA 1640",
    airline: "AMERICAN",
    city: "DALLAS",
    gate: "B08",
    status: "ON TIME"
  },
  {
    time: "4:02 PM",
    flight: "WN 2810",
    airline: "SOUTHWEST",
    city: "HOUSTON",
    gate: "A21",
    status: "ON TIME"
  },
  {
    time: "4:30 PM",
    flight: "UA 4371",
    airline: "UNITED",
    city: "DENVER",
    gate: "B20",
    status: "DELAYED"
  },
  {
    time: "4:55 PM",
    flight: "NK 221",
    airline: "SPIRIT",
    city: "LAS VEGAS",
    gate: "A09",
    status: "ON TIME"
  }
];

let currentMode = "departures";
let autoCycleEnabled = false;
let autoCycleTimer = null;

const departuresButton =
  document.getElementById("departuresButton");

const arrivalsButton =
  document.getElementById("arrivalsButton");

const cycleButton =
  document.getElementById("cycleButton");

const fullscreenButton =
  document.getElementById("fullscreenButton");

const flightRows =
  document.getElementById("flightRows");

function updateClock() {
  const now = new Date();

  document.getElementById("time").textContent =
    now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

  document.getElementById("date").textContent =
    now.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).toUpperCase();
}

function makeFlaps(text) {
  const container = document.createElement("div");

  container.className = "flap-line";

  String(text).split("").forEach(character => {
    const flap = document.createElement("span");

    flap.className = "flap";
    flap.textContent =
      character === " " ? "\u00A0" : character;

    container.appendChild(flap);
  });

  return container;
}

function getStatusClass(status) {
  return "status-" +
    status
      .toLowerCase()
      .replaceAll(" ", "-");
}

function animateRow(row) {
  const flaps = row.querySelectorAll(".flap");

  flaps.forEach((flap, index) => {
    setTimeout(() => {
      flap.classList.add("flip");

      setTimeout(() => {
        flap.classList.remove("flip");
      }, 520);
    }, index * 22);
  });
}

function updateModeButtons() {
  const showingDepartures =
    currentMode === "departures";

  departuresButton.classList.toggle(
    "active",
    showingDepartures
  );

  arrivalsButton.classList.toggle(
    "active",
    !showingDepartures
  );
}

function renderBoard() {
  const flights =
    currentMode === "departures"
      ? departures
      : arrivals;

  flightRows.innerHTML = "";

  document.getElementById("cityHeading").textContent =
    currentMode === "departures"
      ? "DESTINATION"
      : "ORIGIN";

  updateModeButtons();

  flights.forEach((flight, rowIndex) => {
    const row = document.createElement("tr");

    const values = [
      flight.time,
      flight.flight,
      flight.airline,
      flight.city,
      flight.gate,
      flight.status
    ];

    values.forEach((value, columnIndex) => {
      const cell = document.createElement("td");

      if (columnIndex === 5) {
        cell.className =
          getStatusClass(flight.status);
      }

      cell.appendChild(makeFlaps(value));
      row.appendChild(cell);
    });

    flightRows.appendChild(row);

    setTimeout(() => {
      animateRow(row);
    }, rowIndex * 160);
  });
}

function switchMode(mode) {
  currentMode = mode;
  renderBoard();
}

function toggleAutoCycle() {
  autoCycleEnabled = !autoCycleEnabled;

  cycleButton.textContent =
    autoCycleEnabled
      ? "AUTO CYCLE: ON"
      : "AUTO CYCLE: OFF";

  cycleButton.classList.toggle(
    "active",
    autoCycleEnabled
  );

  if (autoCycleEnabled) {
    autoCycleTimer = setInterval(() => {
      currentMode =
        currentMode === "departures"
          ? "arrivals"
          : "departures";

      renderBoard();
    }, 15000);
  } else {
    clearInterval(autoCycleTimer);
    autoCycleTimer = null;
  }
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch {
    alert(
      "Full-screen mode was blocked. You can also press F11."
    );
  }
}

departuresButton.addEventListener("click", () => {
  switchMode("departures");
});

arrivalsButton.addEventListener("click", () => {
  switchMode("arrivals");
});

cycleButton.addEventListener(
  "click",
  toggleAutoCycle
);

fullscreenButton.addEventListener(
  "click",
  toggleFullscreen
);

document.addEventListener(
  "fullscreenchange",
  () => {
    const isFullscreen =
      Boolean(document.fullscreenElement);

    document.body.classList.toggle(
      "fullscreen-mode",
      isFullscreen
    );

    fullscreenButton.textContent =
      isFullscreen
        ? "EXIT FULL SCREEN"
        : "FULL SCREEN";
  }
);

document.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();

  if (key === "a") {
    toggleAutoCycle();
  }

  if (key === "f") {
    toggleFullscreen();
  }

  if (event.key === "ArrowLeft") {
    switchMode("departures");
  }

  if (event.key === "ArrowRight") {
    switchMode("arrivals");
  }
});

updateClock();
setInterval(updateClock, 1000);

renderBoard();
