// Данные упражнения: короткие слова соединяются в естественный тренировочный текст.
const wordBank = [
  "солнце","дорога","клавиша","пальцы","скорость","точность","комната","время","работа","весна",
  "машина","книга","город","облако","система","музыка","природа","встреча","задача","команда",
  "спокойно","быстро","правильно","сегодня","каждый","новый","сильный","интересный","вместе","вперед"
];
const rows = [
  ["ё","1","2","3","4","5","6","7","8","9","0","-","=","Backspace"],
  ["й","ц","у","к","е","н","г","ш","щ","з","х","ъ"],
  ["ф","ы","в","а","п","р","о","л","д","ж","э"],
  ["я","ч","с","м","и","т","ь","б","ю",",","."],
  [" "]
];
const codeToChar = {
  Backquote:"ё",Digit1:"1",Digit2:"2",Digit3:"3",Digit4:"4",Digit5:"5",Digit6:"6",Digit7:"7",Digit8:"8",Digit9:"9",Digit0:"0",
  Minus:"-",Equal:"=",KeyQ:"й",KeyW:"ц",KeyE:"у",KeyR:"к",KeyT:"е",KeyY:"н",KeyU:"г",KeyI:"ш",KeyO:"щ",KeyP:"з",
  BracketLeft:"х",BracketRight:"ъ",KeyA:"ф",KeyS:"ы",KeyD:"в",KeyF:"а",KeyG:"п",KeyH:"р",KeyJ:"о",KeyK:"л",KeyL:"д",
  Semicolon:"ж",Quote:"э",KeyZ:"я",KeyX:"ч",KeyC:"с",KeyV:"м",KeyB:"и",KeyN:"т",KeyM:"ь",Comma:"б",Period:"ю",Slash:".",Space:" "
};
const keyboard = document.getElementById("keyboard");
const input = document.getElementById("typingInput");
const promptEl = document.getElementById("promptText");
const modal = document.getElementById("resultModal");
let target = "";
let startedAt = null;
let timerId = null;
let finished = false;
let lastPressed = null;

function makeText() {
  const count = 24;
  const words = [];
  for (let i = 0; i < count; i++) words.push(wordBank[Math.floor(Math.random() * wordBank.length)]);
  return words.join(" ");
}
function createKeyboard() {
  keyboard.innerHTML = "";
  rows.forEach((row, rowIndex) => {
    const rowEl = document.createElement("div");
    rowEl.className = "key-row";
    row.forEach((label) => {
      const key = document.createElement("div");
      key.className = "key";
      key.dataset.char = label;
      key.textContent = label === " " ? "Пробел" : label;
      if (label === "Backspace") key.classList.add("wide");
      if (label === " ") key.classList.add("space");
      if (rowIndex === 0 && ["Backspace"].includes(label)) key.classList.add("wide");
      rowEl.appendChild(key);
    });
    keyboard.appendChild(rowEl);
  });
}
function keyForChar(char) {
  const normalized = char?.toLowerCase();
  return [...keyboard.querySelectorAll(".key")].find(el => el.dataset.char === normalized);
}
function highlightNext() {
  keyboard.querySelectorAll(".key").forEach(k => k.classList.remove("active"));
  const next = target[input.value.length];
  if (next !== undefined) keyForChar(next)?.classList.add("active");
}
function renderPrompt() {
  const typed = input.value;
  promptEl.innerHTML = "";
  for (let i = 0; i < target.length; i++) {
    const span = document.createElement("span");
    span.textContent = target[i];
    if (i < typed.length) span.className = typed[i] === target[i] ? "correct" : "incorrect";
    else if (i === typed.length) span.className = "current";
    promptEl.appendChild(span);
  }
  const progress = Math.min(100, Math.round(typed.length / target.length * 100));
  document.getElementById("progressText").textContent = progress + "%";
  document.getElementById("progressBar").style.width = progress + "%";
}
function getMetrics() {
  const typed = input.value;
  let correct = 0, errors = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) correct++;
    else errors++;
  }
  const elapsed = startedAt ? Math.max(1, (Date.now() - startedAt) / 1000) : 0;
  const accuracy = typed.length ? Math.round(correct / typed.length * 100) : 100;
  const speed = elapsed ? Math.round(correct / elapsed * 60) : 0;
  return {correct, errors, accuracy, speed, elapsed};
}
function formatTime(seconds) {
  const s = Math.floor(seconds);
  return `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;
}
function updateStats() {
  const m = getMetrics();
  document.getElementById("speedStat").textContent = m.speed;
  document.getElementById("accuracyStat").textContent = m.accuracy + "%";
  document.getElementById("errorsStat").textContent = m.errors;
  document.getElementById("timeStat").textContent = formatTime(m.elapsed);
}
function finish() {
  if (finished) return;
  finished = true;
  clearInterval(timerId);
  const m = getMetrics();
  document.getElementById("finalSpeed").textContent = m.speed;
  document.getElementById("finalAccuracy").textContent = m.accuracy + "%";
  document.getElementById("finalTime").textContent = formatTime(m.elapsed);
  document.getElementById("finalErrors").textContent = m.errors;
  modal.classList.remove("hidden");
  document.getElementById("againBtn").focus();
}
function restart() {
  clearInterval(timerId);
  timerId = null; startedAt = null; finished = false;
  target = makeText();
  input.value = "";
  input.disabled = false;
  modal.classList.add("hidden");
  document.getElementById("hintText").textContent = "Нажми любую клавишу, чтобы начать тренировку";
  renderPrompt(); updateStats(); highlightNext(); input.focus();
}
input.addEventListener("input", () => {
  if (finished) return;
  if (input.value.length > target.length) input.value = input.value.slice(0, target.length);
  if (!startedAt && input.value.length) {
    startedAt = Date.now();
    timerId = setInterval(updateStats, 250);
    document.getElementById("hintText").textContent = "Отлично! Продолжай в своём темпе";
  }
  renderPrompt(); updateStats(); highlightNext();
  if (input.value.length >= target.length) finish();
});
input.addEventListener("keydown", (event) => {
  if (event.key === "Escape") { event.preventDefault(); restart(); return; }
  if (event.key === "Tab") event.preventDefault();
  const expected = target[input.value.length];
  const pressed = event.key === " " ? " " : event.key.toLowerCase();
  const visual = keyForChar(expected);
  if (visual && event.key.length === 1) {
    visual.classList.remove("pressed","error");
    void visual.offsetWidth;
    if (pressed === expected) visual.classList.add("pressed");
    else visual.classList.add("error");
    lastPressed = visual;
    setTimeout(() => visual.classList.remove("pressed","error"), 180);
  }
});
document.getElementById("restartBtn").addEventListener("click", restart);
document.getElementById("againBtn").addEventListener("click", restart);
document.getElementById("themeSelect").addEventListener("change", (e) => {
  document.body.classList.toggle("light", e.target.value === "light");
});
document.getElementById("minimizeBtn").addEventListener("click", () => window.desktop?.minimize());
document.getElementById("maximizeBtn").addEventListener("click", () => window.desktop?.toggleMaximize());
document.getElementById("closeBtn").addEventListener("click", () => window.desktop?.close());

createKeyboard();
restart();