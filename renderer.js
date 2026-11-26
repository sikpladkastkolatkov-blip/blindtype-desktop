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
      if (fingerOf[label]) key.dataset.finger = fingerOf[label];
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
  setActiveFinger(next);
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
    tapHands();
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

// ---------- Руки: каждый палец нажимает «свои» клавиши ----------
const FINGERS = {
  lp:{name:"левый мизинец",color:"#b48cf2",w:19,home:"ф"}, lr:{name:"левый безымянный",color:"#5aa9f2",w:22,home:"ы"},
  lm:{name:"левый средний",color:"#5fd6a0",w:24,home:"в"}, li:{name:"левый указательный",color:"#f2c35a",w:23,home:"а"},
  lt:{name:"левый большой",color:"#f08a7a",w:26,home:" "}, rt:{name:"большой палец",color:"#f08a7a",w:26,home:" "},
  ri:{name:"правый указательный",color:"#f2c35a",w:23,home:"о"}, rm:{name:"правый средний",color:"#5fd6a0",w:24,home:"л"},
  rr:{name:"правый безымянный",color:"#5aa9f2",w:22,home:"д"}, rp:{name:"правый мизинец",color:"#b48cf2",w:19,home:"ж"}
};
const fingerChars = {lp:"ё1йфя", lr:"2цыч", lm:"3увс", li:"45кепами", ri:"67нгроть", rm:"8шлб", rr:"9щдю", rp:"0-=зхъжэ,."};
const fingerOf = {Backspace:"rp", " ":"rt"};
for (const [f, chars] of Object.entries(fingerChars)) for (const ch of chars) fingerOf[ch] = f;

const stage = document.querySelector(".keyboard-stage");
const handsSvg = document.getElementById("hands");
const SVGNS = "http://www.w3.org/2000/svg";
const TIP_DY = 18;               // кончик пальца упирается в нижнюю часть клавиши
const geo = {};                  // char -> {x,y,w,h} относительно сцены
const hand = {};                 // состояние каждого пальца
let stageW = 0, stageH = 0, activeFinger = null, activeChar = null, tapUntil = 0;

function mk(tag, attrs, parent) {
  const el = document.createElementNS(SVGNS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  parent.appendChild(el);
  return el;
}
function buildHands() {
  handsSvg.innerHTML = "";
  const gPalm = mk("g", {opacity: ".13", fill: "currentColor"}, handsSvg);
  hand.palmL = mk("ellipse", {}, gPalm); hand.palmR = mk("ellipse", {}, gPalm);
  const gBody = mk("g", {"stroke-linecap": "round", fill: "none"}, handsSvg);
  const gTip = mk("g", {}, handsSvg);
  for (const [id, f] of Object.entries(FINGERS)) {
    hand[id] = {
      x: 0, y: 0, ready: false,
      body: mk("line", {stroke: f.color, "stroke-width": f.w}, gBody),
      tip: mk("circle", {r: f.w / 2, fill: f.color, stroke: f.color, "stroke-width": 2}, gTip),
      shine: mk("ellipse", {rx: f.w / 4.2, ry: f.w / 6, fill: "#fff", opacity: ".35"}, gTip)
    };
  }
}
function layoutHands() {
  const sr = stage.getBoundingClientRect();
  stageW = stage.clientWidth; stageH = stage.clientHeight;
  handsSvg.setAttribute("viewBox", `0 0 ${stageW} ${stageH}`);
  keyboard.querySelectorAll(".key").forEach(k => {
    const r = k.getBoundingClientRect();
    geo[k.dataset.char] = {x: r.left - sr.left - stage.clientLeft, y: r.top - sr.top - stage.clientTop, w: r.width, h: r.height};
  });
}
function restPoint(id) {
  const sp = geo[" "];
  if (id === "lt") return {x: sp.x + sp.w * 0.33, y: sp.y + sp.h / 2 + TIP_DY};
  if (id === "rt") return {x: sp.x + sp.w * 0.67, y: sp.y + sp.h / 2 + TIP_DY};
  const g = geo[FINGERS[id].home];
  return {x: g.x + g.w / 2, y: g.y + g.h / 2 + TIP_DY};
}
function targetPoint(id) {
  if (id === activeFinger && activeChar !== null) {
    const g = geo[activeChar === " " ? " " : activeChar];
    if (g) {
      if (activeChar === " ") return restPoint(id);
      return {x: g.x + g.w / 2, y: g.y + g.h / 2 + TIP_DY};
    }
  }
  return restPoint(id);
}
function setActiveFinger(ch) {
  activeChar = ch === undefined ? null : ch.toLowerCase();
  activeFinger = activeChar !== null ? (fingerOf[activeChar] || null) : null;
  const label = document.getElementById("fingerName");
  if (!label) return;
  if (!activeFinger) { label.textContent = "Подсказка следующей клавиши"; return; }
  const shown = activeChar === " " ? "Пробел" : "«" + activeChar + "»";
  label.textContent = `${shown} — ${FINGERS[activeFinger].name}`;
}
function tapHands() { tapUntil = performance.now() + 150; }
function handsFrame(now) {
  if (stageW && geo[" "]) {
    const lx = ["lp","lr","lm","li"].map(i => restPoint(i).x), rx = ["ri","rm","rr","rp"].map(i => restPoint(i).x);
    const cL = (lx[0] + lx[3]) / 2, cR = (rx[0] + rx[3]) / 2, baseY = stageH + 30;
    for (const [pal, c] of [[hand.palmL, cL], [hand.palmR, cR]]) {
      pal.setAttribute("cx", c); pal.setAttribute("cy", stageH - 28); pal.setAttribute("rx", 112); pal.setAttribute("ry", 46);
    }
    for (const id of Object.keys(FINGERS)) {
      const h = hand[id], t = targetPoint(id), rest = restPoint(id), left = id[0] === "l";
      if (!h.ready) { h.x = rest.x; h.y = rest.y; h.ready = true; }
      h.x += (t.x - h.x) * 0.3; h.y += (t.y - h.y) * 0.3;
      const isActive = id === activeFinger;
      const dy = isActive && now < tapUntil ? 4 : 0;
      const c = left ? cL : cR, thumb = id === "lt" || id === "rt";
      const ax = thumb ? c + (left ? 55 : -55) : rest.x + (c - rest.x) * 0.45;
      h.body.setAttribute("x1", ax); h.body.setAttribute("y1", baseY);
      h.body.setAttribute("x2", h.x); h.body.setAttribute("y2", h.y + dy);
      h.body.setAttribute("opacity", isActive ? ".55" : ".2");
      h.tip.setAttribute("cx", h.x); h.tip.setAttribute("cy", h.y + dy);
      h.tip.setAttribute("fill-opacity", isActive ? ".95" : ".38");
      h.tip.setAttribute("stroke-opacity", isActive ? "1" : ".6");
      h.shine.setAttribute("cx", h.x); h.shine.setAttribute("cy", h.y + dy - FINGERS[id].w / 5);
      h.shine.setAttribute("opacity", isActive ? ".45" : ".18");
    }
  }
  requestAnimationFrame(handsFrame);
}
buildHands();
window.addEventListener("resize", layoutHands);
if (window.ResizeObserver) new ResizeObserver(layoutHands).observe(stage);

createKeyboard();
layoutHands();
restart();
requestAnimationFrame(handsFrame);