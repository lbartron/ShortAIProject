const STORAGE_KEY = "focus-study-log-v1";

const timeDisplay = document.getElementById("time-display");
const clockDial = document.getElementById("clock-dial");
const clockTicks = document.getElementById("clock-ticks");
const clockHand = document.getElementById("clock-hand");
const durationValue = document.getElementById("duration-value");
const taskInput = document.getElementById("task");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");
const clearLogBtn = document.getElementById("clear-log");
const logBody = document.getElementById("log-body");
const noteInput = document.getElementById("note-input");
const addNoteBtn = document.getElementById("add-note");
const clearNotesBtn = document.getElementById("clear-notes");
const notesList = document.getElementById("notes-list");

let timerId = null;
let sessionMinutes = 25;
let remainingSeconds = sessionMinutes * 60;
let running = false;
let temporaryNotes = [];
let draggingClockHand = false;

function formatSeconds(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function renderTime() {
  timeDisplay.textContent = formatSeconds(remainingSeconds);
}

function loadLog() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLog(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function sanitizeText(text) {
  return text.replace(/[<>]/g, "");
}

function renderLog() {
  const entries = loadLog();

  if (!entries.length) {
    logBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="3">No completed sessions yet.</td>
      </tr>
    `;
    return;
  }

  logBody.innerHTML = entries
    .map((entry) => {
      const safeTopic = sanitizeText(entry.topic || "-");
      return `
        <tr>
          <td>${entry.date}</td>
          <td>${entry.duration} min</td>
          <td>${safeTopic}</td>
        </tr>
      `;
    })
    .join("");
}

function setButtons() {
  startBtn.disabled = running;
  pauseBtn.disabled = !running;
  clockDial.classList.toggle("is-disabled", running);
}

function drawClockTicks() {
  const center = 110;
  const outerRadius = 88;

  for (let i = 0; i < 60; i += 1) {
    const isMajor = i % 5 === 0;
    const tickLength = isMajor ? 12 : 6;
    const angle = (i * 6 - 90) * (Math.PI / 180);
    const x1 = center + Math.cos(angle) * (outerRadius - tickLength);
    const y1 = center + Math.sin(angle) * (outerRadius - tickLength);
    const x2 = center + Math.cos(angle) * outerRadius;
    const y2 = center + Math.sin(angle) * outerRadius;

    const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tick.setAttribute("x1", x1.toFixed(2));
    tick.setAttribute("y1", y1.toFixed(2));
    tick.setAttribute("x2", x2.toFixed(2));
    tick.setAttribute("y2", y2.toFixed(2));
    tick.setAttribute("class", isMajor ? "clock-tick major" : "clock-tick");
    clockTicks.appendChild(tick);
  }
}

function renderClockHand() {
  const minuteValue = sessionMinutes === 60 ? 60 : sessionMinutes;
  const angle = (minuteValue % 60) * 6;
  const radians = (angle - 90) * (Math.PI / 180);
  const x2 = 110 + Math.cos(radians) * 68;
  const y2 = 110 + Math.sin(radians) * 68;

  clockHand.setAttribute("x2", x2.toFixed(2));
  clockHand.setAttribute("y2", y2.toFixed(2));
  durationValue.textContent = sessionMinutes.toString();
  clockDial.setAttribute("aria-valuenow", sessionMinutes.toString());
}

function setSessionMinutes(nextMinutes, updateRemaining = true) {
  sessionMinutes = Math.max(1, Math.min(60, nextMinutes));
  renderClockHand();

  if (updateRemaining && !running) {
    remainingSeconds = sessionMinutes * 60;
    renderTime();
  }
}

function getPointerMinutes(clientX, clientY) {
  const rect = clockDial.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = clientX - centerX;
  const dy = clientY - centerY;

  let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (angle < 0) {
    angle += 360;
  }

  let minute = Math.round(angle / 6);
  if (minute === 0) {
    minute = 60;
  }
  return minute;
}

function updateFromPointer(clientX, clientY) {
  if (running) {
    return;
  }
  const minute = getPointerMinutes(clientX, clientY);
  setSessionMinutes(minute);
}

function renderNotes() {
  if (!temporaryNotes.length) {
    notesList.innerHTML = '<li class="empty-note">No notes yet.</li>';
    return;
  }

  notesList.innerHTML = temporaryNotes
    .map(
      (note, index) => `
        <li>
          <p class="note-content">${sanitizeText(note)}</p>
          <button class="btn note-delete" type="button" data-note-index="${index}">Delete</button>
        </li>
      `
    )
    .join("");
}

function addNote() {
  const newNote = noteInput.value.trim();
  if (!newNote) {
    return;
  }

  temporaryNotes.unshift(newNote);
  noteInput.value = "";
  renderNotes();
}

function clearNotes() {
  temporaryNotes = [];
  renderNotes();
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  running = false;
  setButtons();
}

function addCompletedSession() {
  const now = new Date();
  const dateLabel = now.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const entries = loadLog();
  entries.unshift({
    date: dateLabel,
    duration: sessionMinutes,
    topic: taskInput.value.trim() || "-",
  });

  saveLog(entries.slice(0, 100));
  renderLog();
}

function startTimer() {
  if (running) {
    return;
  }

  running = true;
  setButtons();

  timerId = setInterval(() => {
    remainingSeconds -= 1;
    renderTime();

    if (remainingSeconds <= 0) {
      stopTimer();
      addCompletedSession();
      remainingSeconds = sessionMinutes * 60;
      renderTime();
      taskInput.value = "";
      window.alert("Focus session complete.");
    }
  }, 1000);
}

function pauseTimer() {
  stopTimer();
}

function resetTimer() {
  stopTimer();
  remainingSeconds = sessionMinutes * 60;
  renderTime();
}

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

clockDial.addEventListener("pointerdown", (event) => {
  if (running) {
    return;
  }
  draggingClockHand = true;
  clockDial.setPointerCapture(event.pointerId);
  updateFromPointer(event.clientX, event.clientY);
});

clockDial.addEventListener("pointermove", (event) => {
  if (!draggingClockHand) {
    return;
  }
  updateFromPointer(event.clientX, event.clientY);
});

clockDial.addEventListener("pointerup", (event) => {
  draggingClockHand = false;
  clockDial.releasePointerCapture(event.pointerId);
});

clockDial.addEventListener("pointercancel", (event) => {
  draggingClockHand = false;
  clockDial.releasePointerCapture(event.pointerId);
});

clockDial.addEventListener("keydown", (event) => {
  if (running) {
    return;
  }

  if (event.key === "ArrowRight" || event.key === "ArrowUp") {
    event.preventDefault();
    setSessionMinutes(sessionMinutes + 1);
  }

  if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
    event.preventDefault();
    setSessionMinutes(sessionMinutes - 1);
  }
});

clearLogBtn.addEventListener("click", () => {
  const confirmed = window.confirm("Clear all study log entries?");
  if (!confirmed) {
    return;
  }

  saveLog([]);
  renderLog();
});

addNoteBtn.addEventListener("click", addNote);

noteInput.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    addNote();
  }
});

clearNotesBtn.addEventListener("click", clearNotes);

notesList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const index = Number(target.dataset.noteIndex);
  if (Number.isNaN(index)) {
    return;
  }

  temporaryNotes.splice(index, 1);
  renderNotes();
});

renderTime();
renderLog();
renderNotes();
drawClockTicks();
setSessionMinutes(25, false);
setButtons();
