// ===== Данные упражнений =====
const wordBank = (
  "солнце дорога клавиша пальцы скорость точность комната время работа весна машина книга город облако система музыка природа встреча задача команда " +
  "спокойно быстро правильно сегодня каждый новый сильный интересный вместе вперед фильм фонарь фабрика форма фрукты февраль физика формула флаг фото " +
  "цветок центр цель цена цирк царь цифра целый концерт улица щека щука щит площадь товарищ овощи помощь общий щенок щель ощущение " +
  "этаж экран эхо энергия этот эпоха экзамен эстафета электричество поэт жизнь жук жара жена железо журнал должен можно важный " +
  "хлеб холод хороший художник хозяин храм хвост воздух йогурт мой твой край музей чай герой юг юбка юноша юмор люблю июль " +
  "яблоко язык ясно ягода яркий ящик январь заря зима звезда здание зеркало зебра знание объект подъезд съезд объявление субъект изъян " +
  "зубы зверь берег ветер вечер дерево друг есть живой забота игра идея камень картина лампа лето мост небо облачко окно ответ пример река рука " +
  "сад слово собака стол страна улыбка успех утро хобби цвет число читать шарик школа шляпа щётка шум эхо юмор радость история сила тишина " +
  "четверг пятница суббота вторник среда понедельник воскресенье зимний летний осенний весенний бегать прыгать думать видеть слышать писать читать " +
  "печатать учиться тренироваться стараться получать побеждать продолжать начинать заканчивать выбирать"
).split(/\s+/).filter(Boolean).filter((w, i, a) => a.indexOf(w) === i && !/ё/.test(w));
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
const promptEl = document.getElementById("promptText");
const modal = document.getElementById("resultModal");
const $ = (id) => document.getElementById(id);

// ===== Хранилище (localStorage с защитой от ошибок) =====
const DATA_KEY = "sneis-data-v1", SET_KEY = "sneis-settings-v1";
const defaultData = () => ({chars: {}, totals: {exercises: 0, chars: 0, seconds: 0, bestSpeed: 0, perfect: 0, fixer: 0}, days: {}, goalDays: {}, ach: {}});
const defaultSettings = {theme: "dark", fontSize: 26, uiScale: 1, showKeyboard: true, showHands: true, alwaysOnTop: false, words: 24, dailyGoal: 1000, soundKey: false, soundErr: false, mode: "normal"};
function readStore(key, def) {
  try { const raw = localStorage.getItem(key); if (raw) return {...def, ...JSON.parse(raw)}; } catch (e) {}
  return {...def};
}
function writeStore(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }
let data = readStore(DATA_KEY, defaultData());
data.totals = {...defaultData().totals, ...data.totals};
let settings = readStore(SET_KEY, defaultSettings);
const saveData = () => writeStore(DATA_KEY, data);
const saveSettings = () => writeStore(SET_KEY, settings);
const todayKey = () => new Date().toLocaleDateString("sv-SE");
function dayRecord(key = todayKey()) { return data.days[key] || (data.days[key] = {chars: 0, ex: 0}); }

// ===== Состояние упражнения =====
let target = "", typed = "", startedAt = null, timerId = null, finished = false, ks = 0, ms = 0, weakActive = false, currentView = "train", unsaved = 0;

// ===== Проблемные буквы =====
function weakLetters(limit = 5) {
  const list = [];
  for (const [ch, s] of Object.entries(data.chars)) {
    if (ch === " " || s.a < 6 || s.e < 2) continue;
    const rate = s.e / s.a;
    if (rate >= 0.08) list.push({ch, rate, a: s.a, e: s.e, score: rate * Math.log(2 + s.a)});
  }
  return list.sort((x, y) => y.score - x.score).slice(0, limit);
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function makeText() {
  const n = Number(settings.words) || 24, weak = settings.mode === "weak" ? weakLetters(4).map(w => w.ch) : [];
  weakActive = weak.length > 0;
  const weighted = [];
  if (weakActive) for (const w of wordBank) { const s = [...w].filter(c => weak.includes(c)).length; for (let i = 0; i < s; i++) weighted.push(w); }
  const words = [];
  for (let i = 0; i < n; i++) {
    let w, tries = 0;
    do { w = weakActive && weighted.length && Math.random() < 0.85 ? pick(weighted) : pick(wordBank); } while (w === words[i - 1] && ++tries < 8);
    words.push(w);
  }
  return words.join(" ");
}

// ===== Клавиатура =====
function createKeyboard() {
  keyboard.innerHTML = "";
  rows.forEach((row) => {
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
      rowEl.appendChild(key);
    });
    keyboard.appendChild(rowEl);
  });
}
function keyForChar(char) {
  const normalized = char?.toLowerCase();
  return [...keyboard.querySelectorAll(".key")].find(el => el.dataset.char === normalized);
}
function markWeakKeys() {
  const weak = new Set(weakLetters(5).map(w => w.ch));
  keyboard.querySelectorAll(".key").forEach(k => k.classList.toggle("weak", weak.has(k.dataset.char)));
}
function highlightNext() {
  keyboard.querySelectorAll(".key.active").forEach(k => k.classList.remove("active"));
  const next = target[typed.length];
  if (next !== undefined) keyForChar(next)?.classList.add("active");
  setActiveFinger(next);
}
function flashKey(el, cls) {
  if (!el) return;
  el.classList.remove("pressed", "error");
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 170);
}

// ===== Отрисовка упражнения =====
function renderPrompt() {
  promptEl.innerHTML = "";
  for (let i = 0; i < target.length; i++) {
    const span = document.createElement("span");
    const isSpace = target[i] === " ";
    const state = i < typed.length ? (typed[i] === target[i] ? "correct" : "incorrect") : i === typed.length ? "current" : "";
    // Текущий/ошибочный пробел рисуем видимым (два неразрывных), иначе подчёркивание в конце слова пропадает.
    // \u200b после них сохраняет возможность переноса строки.
    span.textContent = isSpace && state !== "correct" ? "\u00a0\u00a0\u200b" : target[i];
    if (state) span.className = state;
    promptEl.appendChild(span);
  }
  const progress = Math.min(100, Math.round(typed.length / target.length * 100));
  $("progressText").textContent = progress + "%";
  $("progressBar").style.width = progress + "%";
  promptEl.querySelector(".current")?.scrollIntoView({block: "nearest"});
}
function getMetrics() {
  let correct = 0;
  for (let i = 0; i < typed.length; i++) if (typed[i] === target[i]) correct++;
  const elapsed = startedAt ? Math.max(1, (Date.now() - startedAt) / 1000) : 0;
  return {correct, errors: ms, accuracy: ks ? Math.max(0, Math.round((ks - ms) / ks * 100)) : 100, speed: elapsed ? Math.round(correct / elapsed * 60) : 0, elapsed};
}
const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s) % 60).padStart(2, "0")}`;
function updateStats() {
  const m = getMetrics();
  $("speedStat").textContent = m.speed;
  $("accuracyStat").textContent = m.accuracy + "%";
  $("errorsStat").textContent = m.errors;
  $("timeStat").textContent = formatTime(m.elapsed);
}
function updateGoal() {
  const goal = Number(settings.dailyGoal) || 1000, done = dayRecord().chars;
  $("goalStat").textContent = done;
  $("goalOf").textContent = done >= goal ? "цель выполнена ✓" : `/ ${goal} симв.`;
  $("goalBar").style.width = Math.min(100, done / goal * 100) + "%";
  $("goalBar").parentElement.classList.toggle("done", done >= goal);
}
function renderWeakStrip() {
  const weak = weakLetters(5), el = $("weakStrip");
  if (!weak.length) { el.innerHTML = '<span class="muted-text">Проблемные буквы появятся здесь, когда накопится статистика ошибок.</span>'; return; }
  el.innerHTML = '<span class="muted-text">Проблемные буквы:</span>' + weak.map(w => `<span class="chip"><b>${w.ch}</b> ${Math.round(w.rate * 100)}%</span>`).join("");
}
function updateModeTitle() {
  $("modeTitle").textContent = settings.mode === "weak" ? (weakActive ? "Проблемные буквы" : "Проблемные буквы (пока нет данных — обычный текст)") : "Случайный текст";
  $("modeSelect").value = settings.mode;
}

// ===== Звук =====
let audioCtx = null;
function beep(freq, dur, vol) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t = audioCtx.currentTime;
    o.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t + dur);
  } catch (e) {}
}

// ===== Достижения =====
function streakDays() {
  let n = 0; const d = new Date();
  if (!(data.days[d.toLocaleDateString("sv-SE")]?.ex > 0)) d.setDate(d.getDate() - 1);
  while (data.days[d.toLocaleDateString("sv-SE")]?.ex > 0) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
const ACHIEVEMENTS = [
  {id: "first", icon: "🌱", title: "Первый шаг", desc: "Заверши первое упражнение", max: 1, cur: () => data.totals.exercises},
  {id: "ten", icon: "🔟", title: "Разогрев", desc: "Заверши 10 упражнений", max: 10, cur: () => data.totals.exercises},
  {id: "fifty", icon: "🏋️", title: "Постоянство", desc: "Заверши 50 упражнений", max: 50, cur: () => data.totals.exercises},
  {id: "perfect", icon: "🎯", title: "Ни одной ошибки", desc: "Пройди упражнение со 100% точностью", max: 1, cur: () => data.totals.perfect},
  {id: "speed100", icon: "⚡", title: "Скорость 100", desc: "Достигни 100 симв./мин", max: 100, cur: () => data.totals.bestSpeed},
  {id: "speed200", icon: "🚀", title: "Скорость 200", desc: "Достигни 200 симв./мин", max: 200, cur: () => data.totals.bestSpeed},
  {id: "speed300", icon: "🔥", title: "Скорость 300", desc: "Достигни 300 симв./мин", max: 300, cur: () => data.totals.bestSpeed},
  {id: "chars1k", icon: "📝", title: "Тысяча знаков", desc: "Напечатай 1 000 символов", max: 1000, cur: () => data.totals.chars},
  {id: "chars10k", icon: "📚", title: "Десять тысяч", desc: "Напечатай 10 000 символов", max: 10000, cur: () => data.totals.chars},
  {id: "goal", icon: "✅", title: "Цель достигнута", desc: "Выполни цель на день", max: 1, cur: () => Object.keys(data.goalDays).length},
  {id: "goal7", icon: "🏆", title: "Неделя целей", desc: "Выполни цель на день 7 раз", max: 7, cur: () => Object.keys(data.goalDays).length},
  {id: "streak3", icon: "📅", title: "Три дня подряд", desc: "Тренируйся 3 дня подряд", max: 3, cur: streakDays},
  {id: "streak7", icon: "🗓️", title: "Неделя подряд", desc: "Тренируйся 7 дней подряд", max: 7, cur: streakDays},
  {id: "fixer", icon: "🛠️", title: "Работа над ошибками", desc: "Пройди упражнение на проблемные буквы с точностью от 95%", max: 1, cur: () => data.totals.fixer},
  {id: "hour", icon: "⏱️", title: "Час практики", desc: "Суммарно потренируйся 1 час", max: 3600, cur: () => Math.round(data.totals.seconds)}
];
function toast(text) {
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = text;
  $("toasts").appendChild(el);
  setTimeout(() => el.classList.add("out"), 3600);
  setTimeout(() => el.remove(), 4100);
}
function checkAchievements() {
  const fresh = [];
  for (const a of ACHIEVEMENTS) if (!data.ach[a.id] && a.cur() >= a.max) { data.ach[a.id] = Date.now(); fresh.push(a); toast(`${a.icon} Достижение: ${a.title}`); }
  if (fresh.length) saveData();
  return fresh;
}
function renderAchievements() {
  const got = ACHIEVEMENTS.filter(a => data.ach[a.id]).length;
  $("achSummary").textContent = `Открыто ${got} из ${ACHIEVEMENTS.length}`;
  $("achGrid").innerHTML = ACHIEVEMENTS.map(a => {
    const ok = !!data.ach[a.id], cur = Math.min(a.cur(), a.max);
    return `<article class="ach ${ok ? "unlocked" : "locked"}"><div class="ach-icon">${a.icon}</div><div class="ach-body"><h3>${a.title}</h3><p>${a.desc}</p>` +
      `<div class="ach-bar"><div style="width:${Math.round(cur / a.max * 100)}%"></div></div><small>${ok ? "Получено" : `${cur} / ${a.max}`}</small></div></article>`;
  }).join("");
}

// ===== Статистика =====
function renderStats() {
  const t = data.totals;
  let a = 0, e = 0;
  for (const s of Object.values(data.chars)) { a += s.a; e += s.e; }
  const mins = Math.floor(t.seconds / 60);
  const cards = [["УПРАЖНЕНИЙ", t.exercises, "завершено"], ["СИМВОЛОВ", t.chars, "напечатано верно"], ["ВРЕМЯ", mins >= 60 ? `${Math.floor(mins / 60)}ч ${mins % 60}м` : `${mins} мин`, "в тренировках"],
    ["РЕКОРД", t.bestSpeed, "симв./мин"], ["ТОЧНОСТЬ", a ? Math.round((a - e) / a * 100) + "%" : "—", "за всё время"], ["СЕРИЯ", streakDays(), "дней подряд"]];
  $("totalsGrid").innerHTML = cards.map(([l, v, s]) => `<article class="stat-card"><span class="stat-label">${l}</span><strong>${v}</strong><small>${s}</small></article>`).join("");
  const rowsData = Object.entries(data.chars).filter(([ch, s]) => ch !== " " && s.a >= 3 && s.e > 0).map(([ch, s]) => ({ch, a: s.a, e: s.e, rate: s.e / s.a})).sort((x, y) => y.rate - x.rate).slice(0, 10);
  $("weakList").innerHTML = rowsData.length ? rowsData.map(r => `<div class="weak-row"><span class="weak-letter">${r.ch}</span><div class="weak-bar"><div style="width:${Math.min(100, Math.round(r.rate * 100) * 2)}%"></div></div><span class="weak-num">${Math.round(r.rate * 100)}% · ${r.e} из ${r.a}</span></div>`).join("")
    : '<p class="muted-text">Пока нет ошибок для анализа. Потренируйся, и здесь появятся буквы, которые стоит подтянуть.</p>';
  const days = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push({k: d.toLocaleDateString("sv-SE"), l: d.toLocaleDateString("ru-RU", {weekday: "short"})}); }
  const max = Math.max(1, Number(settings.dailyGoal) || 1000, ...days.map(d => data.days[d.k]?.chars || 0));
  $("weekChart").innerHTML = days.map(d => { const c = data.days[d.k]?.chars || 0; return `<div class="wk"><div class="wk-bar ${data.goalDays[d.k] ? "goal" : ""}" style="height:${Math.max(3, Math.round(c / max * 100))}%" title="${c} симв."></div><span>${d.l}</span><small>${c}</small></div>`; }).join("");
}

// ===== Ход упражнения =====
function finish() {
  if (finished) return;
  finished = true;
  clearInterval(timerId);
  const m = getMetrics(), t = data.totals;
  t.exercises++; t.seconds += m.elapsed; t.bestSpeed = Math.max(t.bestSpeed, m.speed);
  if (ms === 0) t.perfect++;
  if (weakActive && m.accuracy >= 95) t.fixer++;
  dayRecord().ex++;
  saveData(); unsaved = 0;
  const fresh = checkAchievements();
  $("finalSpeed").textContent = m.speed; $("finalAccuracy").textContent = m.accuracy + "%";
  $("finalTime").textContent = formatTime(m.elapsed); $("finalErrors").textContent = m.errors;
  const goal = Number(settings.dailyGoal) || 1000, done = dayRecord().chars, weak = weakLetters(3);
  let extra = `<p>Цель на день: <b>${Math.min(done, goal)} / ${goal}</b> символов${done >= goal ? " — выполнена ✓" : ""}</p>`;
  if (weak.length) extra += `<p>Проблемные буквы: ${weak.map(w => `<b>${w.ch}</b> (${Math.round(w.rate * 100)}%)`).join(", ")}</p>`;
  if (fresh.length) extra += `<p class="ach-line">${fresh.map(a => `${a.icon} ${a.title}`).join(" · ")}</p>`;
  $("resultExtra").innerHTML = extra;
  modal.classList.remove("hidden");
  $("againBtn").focus();
  markWeakKeys(); renderWeakStrip();
}
function restart() {
  clearInterval(timerId);
  timerId = null; startedAt = null; finished = false; typed = ""; ks = 0; ms = 0;
  target = makeText();
  modal.classList.add("hidden");
  $("hintText").textContent = "Нажми любую клавишу, чтобы начать";
  renderPrompt(); updateStats(); updateGoal(); updateModeTitle(); renderWeakStrip(); markWeakKeys(); highlightNext();
  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
}
function resolveChar(e) {
  if (e.key.length !== 1) return null;
  let ch = e.key.toLowerCase();
  // Если включена латинская раскладка, берём русскую букву по положению клавиши.
  if (/[a-z]/.test(ch) && codeToChar[e.code]) ch = codeToChar[e.code];
  return ch;
}
function handleTyping(e) {
  if (e.key === "Backspace") { if (typed.length) { typed = typed.slice(0, -1); renderPrompt(); highlightNext(); } return; }
  const ch = resolveChar(e);
  if (ch === null || typed.length >= target.length) return;
  if (!startedAt) {
    startedAt = Date.now();
    timerId = setInterval(updateStats, 250);
    $("hintText").textContent = "Отлично! Продолжай в своём темпе";
  }
  const expected = target[typed.length], ok = ch === expected;
  const st = data.chars[expected] || (data.chars[expected] = {a: 0, e: 0});
  st.a++; ks++;
  if (ok) {
    data.totals.chars++;
    const rec = dayRecord(), goal = Number(settings.dailyGoal) || 1000;
    rec.chars++;
    if (rec.chars === goal) { data.goalDays[todayKey()] = true; toast("🎉 Цель на день выполнена!"); checkAchievements(); }
    updateGoal();
  } else { st.e++; ms++; }
  if (settings.soundKey && ok) beep(900, 0.04, 0.05);
  if (settings.soundErr && !ok) beep(160, 0.12, 0.08);
  flashKey(keyForChar(ch), ok ? "pressed" : "error");
  if (ok) tapHands();
  typed += ch;
  if (++unsaved >= 25) { saveData(); unsaved = 0; }
  renderPrompt(); updateStats(); highlightNext();
  if (typed.length >= target.length) finish();
}

// ===== Вкладки и настройки =====
function showView(name) {
  currentView = name;
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("hidden", v.id !== "view-" + name));
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === name));
  if (name === "stats") renderStats();
  if (name === "achievements") renderAchievements();
  if (name === "train") { applyKeyboardVisibility(); requestAnimationFrame(layoutHands); }
}
function applyKeyboardVisibility() {
  $("keyboardSection").classList.toggle("hidden", !settings.showKeyboard);
  handsSvg.style.display = settings.showHands ? "" : "none";
}
function applySettings() {
  document.body.classList.toggle("light", settings.theme === "light");
  document.documentElement.style.setProperty("--prompt-size", settings.fontSize + "px");
  $("fontSizeVal").textContent = settings.fontSize + " px";
  applyKeyboardVisibility();
  window.desktop?.setZoom?.(Number(settings.uiScale) || 1);
  window.desktop?.setAlwaysOnTop?.(!!settings.alwaysOnTop);
  updateGoal();
  requestAnimationFrame(layoutHands);
}
function bindSettings() {
  document.querySelectorAll("[data-setting]").forEach(el => {
    const key = el.dataset.setting;
    if (el.type === "checkbox") el.checked = !!settings[key]; else el.value = settings[key];
    el.addEventListener("input", () => {
      const prev = settings[key];
      settings[key] = el.type === "checkbox" ? el.checked : el.type === "range" ? Number(el.value) : (isNaN(Number(el.value)) ? el.value : Number(el.value));
      saveSettings(); applySettings();
      if (key === "words" && prev !== settings[key]) restart();
    });
  });
}

// ===== Обработчики =====
window.addEventListener("keydown", (e) => {
  if (e.key === "F11") { e.preventDefault(); window.desktop?.toggleFullscreen?.(); return; }
  if (!modal.classList.contains("hidden")) { if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); restart(); } return; }
  if (currentView !== "train") return;
  if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "Escape") { e.preventDefault(); restart(); return; }
  if (e.key === "Tab") { e.preventDefault(); return; }
  if (e.key === "Backspace" || e.key.length === 1) { e.preventDefault(); handleTyping(e); }
});
window.addEventListener("beforeunload", saveData);
document.addEventListener("click", (e) => { e.target.closest?.("button")?.blur(); });
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => showView(t.dataset.view)));
$("restartBtn").addEventListener("click", restart);
$("againBtn").addEventListener("click", restart);
$("modeSelect").addEventListener("change", (e) => { settings.mode = e.target.value; saveSettings(); restart(); });
$("trainWeakBtn").addEventListener("click", () => { settings.mode = "weak"; saveSettings(); showView("train"); restart(); });
$("fullscreenBtn").addEventListener("click", () => window.desktop?.toggleFullscreen?.());
$("resetBtn").addEventListener("click", () => {
  if (!confirm("Удалить всю статистику, достижения и прогресс дня? Это нельзя отменить.")) return;
  data = defaultData(); saveData(); restart(); renderStats(); renderAchievements(); toast("Прогресс сброшен");
});
$("minimizeBtn").addEventListener("click", () => window.desktop?.minimize());
$("maximizeBtn").addEventListener("click", () => window.desktop?.toggleMaximize());
$("closeBtn").addEventListener("click", () => window.desktop?.close());

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
bindSettings();
applySettings();
layoutHands();
restart();
requestAnimationFrame(handsFrame);
