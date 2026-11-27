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

// ---------- Руки в стиле рентгена: кости фиксированной длины ----------
// Палец не растягивается: если клавиша далеко, смещается вся кисть; вблизи палец «сгибается» (становится короче в проекции).
const FINGERS = {
  lp:{name:"левый мизинец",color:"#b48cf2",L:150,fw:26,bw:5,br:6.5,home:"ф"}, lr:{name:"левый безымянный",color:"#5aa9f2",L:184,fw:31,bw:6,br:7.5,home:"ы"},
  lm:{name:"левый средний",color:"#5fd6a0",L:198,fw:33,bw:6,br:7.5,home:"в"}, li:{name:"левый указательный",color:"#f2c35a",L:188,fw:32,bw:6,br:7.5,home:"а"},
  lt:{name:"левый большой",color:"#f08a7a",L:120,fw:36,bw:7,br:8.5,home:" ",thumb:true}, rt:{name:"большой палец",color:"#f08a7a",L:120,fw:36,bw:7,br:8.5,home:" ",thumb:true},
  ri:{name:"правый указательный",color:"#f2c35a",L:188,fw:32,bw:6,br:7.5,home:"о"}, rm:{name:"правый средний",color:"#5fd6a0",L:198,fw:33,bw:6,br:7.5,home:"л"},
  rr:{name:"правый безымянный",color:"#5aa9f2",L:184,fw:31,bw:6,br:7.5,home:"д"}, rp:{name:"правый мизинец",color:"#b48cf2",L:150,fw:26,bw:5,br:6.5,home:"ж"}
};
const fingerChars = {lp:"ё1йфя", lr:"2цыч", lm:"3увс", li:"45кепами", ri:"67нгроть", rm:"8шлб", rr:"9щдю", rp:"0-=зхъжэ,."};
const fingerOf = {Backspace:"rp", " ":"rt"};
for (const [f, chars] of Object.entries(fingerChars)) for (const ch of chars) fingerOf[ch] = f;

const stage = document.querySelector(".keyboard-stage");
const handsSvg = document.getElementById("hands");
const SVGNS = "http://www.w3.org/2000/svg";
const TIP_DY = 14, GAP = 5, REST_K = 0.7, MAX_K = 0.97, MIN_K = 0.34;
const geo = {}, rest = {}, hand = {}, side = {l:{ox:0,oy:0}, r:{ox:0,oy:0}};
let stageW = 0, stageH = 0, activeFinger = null, activeChar = null, tapUntil = 0, ready = false;

function mk(tag, attrs, parent) {
  const el = document.createElementNS(SVGNS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  parent.appendChild(el);
  return el;
}
function makeBone(parent) {
  const g = mk("g", {}, parent);
  return {g, shaft: mk("line", {"stroke-linecap": "round"}, g), a: mk("circle", {}, g), b: mk("circle", {}, g)};
}
function setBone(bn, x0, y0, x1, y1, w, r, color, op) {
  bn.shaft.setAttribute("x1", x0); bn.shaft.setAttribute("y1", y0); bn.shaft.setAttribute("x2", x1); bn.shaft.setAttribute("y2", y1);
  bn.shaft.setAttribute("stroke-width", w); bn.shaft.style.stroke = color;
  for (const [c, x, y] of [[bn.a, x0, y0], [bn.b, x1, y1]]) { c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", r); c.style.fill = color; }
  bn.g.setAttribute("opacity", op);
}
function buildHands() {
  handsSvg.innerHTML = "";
  for (const s of ["l", "r"]) {
    const g = mk("g", {}, handsSvg);
    side[s].tissue = mk("g", {}, g);                       // мягкие ткани (подложка)
    side[s].palm = mk("ellipse", {}, side[s].tissue);
    side[s].wrist = mk("rect", {rx: 40}, side[s].tissue);
    side[s].carpal = mk("g", {}, g);                       // запястье
    side[s].carpals = [[-30,0],[-10,-6],[12,-6],[32,0],[-22,24],[0,22],[22,24]].map(([x, y]) => mk("ellipse", {rx: 12, ry: 10, cx: x, cy: y}, side[s].carpal));
    side[s].forearm = [-24, 6].map(x => mk("rect", {x, y: 50, width: 18, height: 260, rx: 9}, side[s].carpal));
    side[s].layer = g;
    [side[s].palm, side[s].wrist].forEach(e => { e.style.fill = "var(--tissue)"; });
    [...side[s].carpals, ...side[s].forearm].forEach(e => { e.style.fill = "var(--bone)"; e.setAttribute("opacity", ".5"); });
  }
  for (const [id, f] of Object.entries(FINGERS)) {
    const g = side[id[0]].layer;
    hand[id] = {
      x: 0, y: 0, ready: false,
      flesh: mk("line", {"stroke-linecap": "round", "stroke-width": f.fw}, side[id[0]].tissue),
      meta: makeBone(g), ph: [makeBone(g), makeBone(g), makeBone(g)].slice(0, f.thumb ? 2 : 3),
      pad: mk("circle", {r: f.fw / 2 - 2}, g)
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
  if (!geo[" "]) return;
  const tips = {};
  for (const id of Object.keys(FINGERS)) tips[id] = restPoint(id);
  for (const s of ["l", "r"]) {
    const ids = s === "l" ? ["lp","lr","lm","li"] : ["ri","rm","rr","rp"];
    const c = (tips[ids[0]].x + tips[ids[3]].x) / 2;
    side[s].c = c;
    let ky = 0;
    for (const id of ids) {
      const f = FINGERS[id], t = tips[id], d = f.L * REST_K, dx = (c - t.x) * 0.33;
      const K0 = {x: t.x + dx, y: t.y + Math.sqrt(Math.max(d * d - dx * dx, 100))};
      rest[id] = {tip: t, K0}; ky += K0.y;
    }
    ky /= 4; side[s].ky = ky; side[s].by = ky + 100;
    for (const id of ids) rest[id].P0 = {x: c + (rest[id].K0.x - c) * 0.5, y: side[s].by};
    const th = s === "l" ? "lt" : "rt", f = FINGERS[th], t = tips[th], d = f.L * 0.6;
    rest[th] = {tip: t, K0: {x: t.x + (c - t.x) * 0.2, y: t.y + d}, P0: {x: c + (s === "l" ? 30 : -30), y: side[s].by - 8}};
    const span = Math.abs(tips[ids[3]].x - tips[ids[0]].x);
    side[s].palm.setAttribute("cx", c); side[s].palm.setAttribute("cy", ky + 40);
    side[s].palm.setAttribute("rx", span / 2 + 30); side[s].palm.setAttribute("ry", 64);
    side[s].wrist.setAttribute("x", c - 46); side[s].wrist.setAttribute("y", side[s].by); side[s].wrist.setAttribute("width", 92); side[s].wrist.setAttribute("height", 320);
    side[s].carpals.forEach(e => { e.setAttribute("transform", `translate(${c} ${side[s].by})`); });
    side[s].forearm.forEach(e => { e.setAttribute("transform", `translate(${c} ${side[s].by})`); });
  }
}
function restPoint(id) {
  const sp = geo[" "];
  if (id === "lt") return {x: sp.x + sp.w * 0.33, y: sp.y + sp.h / 2 + TIP_DY};
  if (id === "rt") return {x: sp.x + sp.w * 0.67, y: sp.y + sp.h / 2 + TIP_DY};
  const g = geo[FINGERS[id].home];
  return {x: g.x + g.w / 2, y: g.y + g.h / 2 + TIP_DY};
}
function targetPoint(id) {
  if (id === activeFinger && activeChar !== null && activeChar !== " " && geo[activeChar]) {
    const g = geo[activeChar];
    return {x: g.x + g.w / 2, y: g.y + g.h / 2 + TIP_DY};
  }
  return rest[id].tip;
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
const lerp = (a, b, k) => a + (b - a) * k;
function handsFrame(now) {
  if (stageW && geo[" "] && rest.lp) {
    // 1) смещение кисти: только если палец не дотягивается без растяжения
    for (const s of ["l", "r"]) {
      let want = {x: 0, y: 0};
      const id = activeFinger && activeFinger[0] === s && !FINGERS[activeFinger].thumb ? activeFinger : null;
      if (id) {
        const t = targetPoint(id), K = rest[id].K0, vx = t.x - K.x, vy = t.y - K.y, d = Math.hypot(vx, vy), m = FINGERS[id].L * MAX_K * 0.96;
        if (d > m) { const k = 1 - m / d; want = {x: vx * k, y: vy * k}; }
      }
      side[s].ox = lerp(side[s].ox, want.x, 0.2); side[s].oy = lerp(side[s].oy, want.y, 0.2);
      side[s].layer.setAttribute("transform", "translate(0 0)");
      side[s].carpal.setAttribute("transform", `translate(${side[s].ox} ${side[s].oy})`);
      side[s].tissue.setAttribute("transform", `translate(${side[s].ox} ${side[s].oy})`);
    }
    // 2) пальцы
    for (const id of Object.keys(FINGERS)) {
      const f = FINGERS[id], h = hand[id], s = side[id[0]], R = rest[id], isA = id === activeFinger;
      if (!h.ready) { h.x = R.tip.x; h.y = R.tip.y; h.ready = true; }
      const t = targetPoint(id);
      h.x = lerp(h.x, t.x, 0.3); h.y = lerp(h.y, t.y, 0.3);
      const K = {x: R.K0.x + s.ox, y: R.K0.y + s.oy}, P = {x: R.P0.x + s.ox, y: R.P0.y + s.oy};
      let vx = h.x - K.x, vy = h.y - K.y, d = Math.hypot(vx, vy) || 1;
      const ux = vx / d, uy = vy / d;
      d = Math.min(f.L * MAX_K, Math.max(f.L * MIN_K, d));            // длина кости не растягивается
      if (isA && now < tapUntil) d *= 0.94;                            // «нажатие»
      const tipX = K.x + ux * d, tipY = K.y + uy * d;
      const col = isA ? f.color : "var(--bone)", op = isA ? 0.95 : 0.62;
      const ratios = f.thumb ? [0.56, 1] : [0.46, 0.76, 1], end = d - 6;
      let px = K.x, py = K.y, prev = 0;
      h.ph.forEach((bn, i) => {
        const a = prev * end + (i === 0 ? GAP : GAP), b = ratios[i] * end - GAP;
        setBone(bn, K.x + ux * a, K.y + uy * a, K.x + ux * Math.max(a + 2, b), K.y + uy * Math.max(a + 2, b), f.bw, f.br, col, op);
        prev = ratios[i];
      });
      setBone(h.meta, P.x, P.y, K.x, K.y, f.bw + 0.5, f.br + 0.5, col, isA ? 0.8 : 0.5);
      h.flesh.setAttribute("x1", K.x - s.ox); h.flesh.setAttribute("y1", K.y - s.oy); h.flesh.setAttribute("x2", tipX - s.ox); h.flesh.setAttribute("y2", tipY - s.oy);
      h.flesh.style.stroke = isA ? f.color : "var(--tissue)"; h.flesh.setAttribute("stroke-opacity", isA ? ".4" : "1");
      h.pad.setAttribute("cx", tipX); h.pad.setAttribute("cy", tipY); h.pad.style.fill = isA ? f.color : "var(--tissue)"; h.pad.setAttribute("fill-opacity", isA ? ".5" : "1");
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