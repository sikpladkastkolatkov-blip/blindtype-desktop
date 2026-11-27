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
const defaultData = () => ({chars: {}, totals: {exercises: 0, chars: 0, seconds: 0, bestSpeed: 0, perfect: 0, fixer: 0, sentences: 0, weakEx: 0, bestAcc: 0, perfectRun: 0, bestPerfectRun: 0, combo: 0, records: 0, maxDayEx: 0, early: 0, owl: 0}, days: {}, goalDays: {}, ach: {}});
const defaultSettings = {theme: "dark", fontSize: 26, uiScale: 1, showKeyboard: true, showHands: true, alwaysOnTop: false, words: 24, dailyExercises: 25, soundKey: false, soundErr: false, mode: "normal"};
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
let exMode = "normal", target = "", typed = "", startedAt = null, timerId = null, finished = false, ks = 0, ms = 0, weakActive = false, currentView = "train", unsaved = 0;

// ===== Проблемные буквы =====
function weakLetters(limit = 5) {
  const list = [];
  for (const [ch, s] of Object.entries(data.chars)) {
    if (!/[а-я]/.test(ch) || s.a < 6 || s.e < 2) continue;
    const rate = s.e / s.a;
    if (rate >= 0.08) list.push({ch, rate, a: s.a, e: s.e, score: rate * Math.log(2 + s.a)});
  }
  return list.sort((x, y) => y.score - x.score).slice(0, limit);
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
const sentenceBank = [
  "Жизнь прекрасна, когда рядом хорошие друзья.","Утром я пью горячий чай и читаю новости.","Мы поехали в горы, чтобы увидеть восход солнца.",
  "Хороший разговор лучше долгого молчания.","Весной в нашем городе цветут яблони и сирень.","Каждый день нужно делать маленький шаг вперед.",
  "Книга открывает перед нами целый мир.","Скорость приходит с практикой, а точность с вниманием.","На улице идет дождь, но дома тепло и уютно.",
  "Мой друг очень любит играть на гитаре по вечерам.","Река медленно течет между зеленых холмов.","Если долго тренироваться, пальцы начнут находить буквы сами.",
  "Вечером мы всей семьей собираемся за большим столом.","Старый маяк стоит на берегу уже сто лет.","Кошка тихо сидит на подоконнике и смотрит на птиц.",
  "Терпение и труд все перетрут.","Без труда не вытянешь и рыбку из пруда.","Одна голова хорошо, а две лучше.","Семь раз отмерь, один раз отрежь.",
  "Не имей сто рублей, а имей сто друзей.","Повторение мать учения.","Лучше поздно, чем никогда.","Ученье свет, а неученье тьма.","Что посеешь, то и пожнешь.",
  "Утро вечера мудренее.","Работа не волк, в лес не убежит.","Тише едешь, дальше будешь.","Красота спасет мир, а доброта согреет сердце.",
  "Завтра я начну заниматься еще усерднее.","Осенью листья на деревьях становятся желтыми и красными.","Зимой снег покрывает поля тонким белым одеялом.",
  "Летом мы купаемся в озере и жарим картошку на костре.","В библиотеке всегда тихо, и там приятно думать.","Мой брат работает инженером и строит большие мосты.",
  "Сегодня я выучил несколько новых слов и очень этому рад.","Хорошая шутка поднимает настроение всей команде.","Самолет плавно набрал высоту и скрылся в облаках.",
  "Поезд отправляется со второго пути ровно в полдень.","На рынке продают свежие овощи, фрукты и душистый мед.","Художник долго смотрел на картину и наконец улыбнулся.",
  "Музыка помогает сосредоточиться и забыть об усталости.","Дорога к успеху начинается с первого шага.","Чтобы печатать быстро, не нужно смотреть на клавиатуру.",
  "Держи спину прямо, а запястья на весу.","Каждый палец отвечает за свои клавиши.","Мягко нажимай на клавиши и не торопись.",
  "Лучше печатать медленно и без ошибок, чем быстро и с ошибками.","Ритм важнее скорости, потому что скорость придет сама.","Среднему ряду нужно уделять особое внимание.",
  "Сегодня отличный день, чтобы научиться новому.","Звезды ярко светят над тихим ночным городом.","Мальчик нашел в саду маленького ежика и принес его домой.",
  "Бабушка печет пироги с капустой и яблоками.","Мы с друзьями ходили в кино на новый фильм.","Телефон зазвонил в самый неподходящий момент.",
  "Ветер раскачивал ветки, и на землю падали шишки.","В комнате пахло свежим хлебом и кофе.","Спортсмены тренируются каждый день, чтобы стать лучше.",
  "Учитель объяснил задачу так просто, что все сразу поняли.","Врач посоветовал больше гулять на свежем воздухе.","Фермер рано утром вышел в поле проверить урожай.",
  "Электричество появилось в нашей деревне давно.","Эхо в пещере повторило каждое сказанное слово.","Этот экзамен я сдам, потому что хорошо подготовился.",
  "Щенок радостно виляет хвостом и просит поиграть.","Цветы на окне поливают каждое утро.","Ящик с инструментами стоит в гараже на нижней полке.",
  "Юноша мечтает стать капитаном и увидеть далекие страны.","Объявление о концерте повесили на дверях школы.","Подъезд нашего дома недавно покрасили в светлый цвет.",
  "Съезд делегатов начнется в понедельник утром.","Фонарь освещает дорожку, по которой мы идем домой.","Шарик улетел высоко в небо, и малыш помахал ему рукой.",
  "Чайка кричит над морем, а волны бьются о скалы.","Жираф дотянулся до самых верхних листьев на дереве.","Хозяйка накрыла стол и позвала всех к ужину.",
  "Цирк приехал в город, и афиши появились на каждом углу.","Дождь закончился, и над полями появилась радуга.","Космонавт посмотрел в иллюминатор и увидел нашу планету.",
  "Лодка тихо скользила по воде, оставляя за собой легкий след.","Мама попросила меня купить хлеб, молоко и немного сыра.",
  "Новый телефон работает быстро, а батарея держит заряд целый день.","Мы договорились встретиться возле фонтана в центре города.",
  "Горы покрыты снегом даже в самые жаркие дни лета.","Сначала подумай, а потом говори.","Маленькие победы каждый день приводят к большим результатам.",
  "Спокойный темп и ровное дыхание помогают не делать ошибок.","Ошибки это не повод останавливаться, а повод стать внимательнее.",
  "Тренировка по десять минут в день лучше, чем час раз в неделю.","Сильные руки печатают точно, когда они расслаблены.",
  "Рассвет окрасил небо в нежные розовые и золотые цвета.","Старая яблоня во дворе каждый год дает много плодов.","Птицы вернулись с юга, и в роще стало шумно.",
  "Тропинка вела через лес к небольшому озеру.","На берегу мы разожгли костер и пели песни.","Соседи подарили нам банку варенья из малины.",
  "Дети строят замок из песка и украшают его ракушками.","Спасибо за помощь, без вас мы бы не справились.","Пожалуйста, закрой окно, потому что на улице холодно.",
  "Здравствуйте, меня зовут Алексей, и я учусь печатать вслепую.","Добрый вечер, как прошел ваш день.","До встречи завтра в то же время.",
  "Погода сегодня просто замечательная, и настроение отличное.","Я люблю читать книги про путешествия и приключения.",
  "Чтобы стать мастером, нужно много терпения и желания.","Каждая буква на клавиатуре имеет свое место.",
  "Хорошая привычка формируется за несколько недель регулярных занятий.","Тишина в лесу успокаивает лучше любых слов."
];
function makeSentences() {
  const n = Number(settings.words) || 24, pool = [...sentenceBank].sort(() => Math.random() - 0.5), out = [];
  let words = 0;
  for (const s of pool) { out.push(s); words += s.split(" ").length; if (words >= n) break; }
  return out.join(" ");
}
function makeText() {
  if (settings.mode === "sentences") { weakActive = false; return makeSentences(); }
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
  $("speedSub").textContent = `симв./мин · ≈${Math.round(m.speed / 5)} слов/мин`;
  $("accuracyStat").textContent = m.accuracy + "%";
  $("errorsStat").textContent = m.errors;
  $("timeStat").textContent = formatTime(m.elapsed);
}
const dailyGoal = () => Math.max(25, Math.min(500, Math.round(Number(settings.dailyExercises)) || 25));
function updateGoal() {
  const goal = dailyGoal(), done = dayRecord().ex;
  $("goalStat").textContent = done;
  $("goalOf").textContent = done >= goal ? "цель выполнена ✓" : `/ ${goal} упр.`;
  $("goalBar").style.width = Math.min(100, done / goal * 100) + "%";
  $("goalBar").parentElement.classList.toggle("done", done >= goal);
}
function renderWeakStrip() {
  const weak = weakLetters(5), el = $("weakStrip");
  if (!weak.length) { el.innerHTML = '<span class="muted-text">Проблемные буквы появятся здесь, когда накопится статистика ошибок.</span>'; return; }
  el.innerHTML = '<span class="muted-text">Проблемные буквы:</span>' + weak.map(w => `<span class="chip"><b>${w.ch}</b> ${Math.round(w.rate * 100)}%</span>`).join("");
}
function updateModeTitle() {
  $("modeTitle").textContent = settings.mode === "sentences" ? "Предложения"
    : settings.mode === "weak" ? (weakActive ? "Проблемные буквы" : "Проблемные буквы (пока нет данных — обычный текст)") : "Случайный текст";
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
function bestGoalStreak() {
  const keys = Object.keys(data.goalDays).sort();
  let best = 0, run = 0, prev = null;
  for (const k of keys) {
    const t = new Date(k + "T00:00:00").getTime();
    run = prev !== null && Math.round((t - prev) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run); prev = t;
  }
  return best;
}
const okCount = (ch) => { const s = data.chars[ch]; return s ? s.a - s.e : 0; };
const sumOk = (letters) => [...letters].reduce((n, ch) => n + okCount(ch), 0);
const masteredLetters = () => Object.entries(data.chars).filter(([ch, s]) => /[а-я]/.test(ch) && s.a >= 30 && s.e / s.a <= 0.03).length;
const totalAttempts = () => Object.values(data.chars).reduce((n, s) => n + s.a, 0);
const wpm = () => Math.round(data.totals.bestSpeed / 5);
const T = () => data.totals;
const ACHIEVEMENTS = [
  // Упражнения
  {cat: "Упражнения", id: "first", icon: "🌱", title: "Первый шаг", desc: "Заверши первое упражнение", max: 1, cur: () => T().exercises},
  {cat: "Упражнения", id: "ex10", icon: "🔟", title: "Разогрев", desc: "Заверши 10 упражнений", max: 10, cur: () => T().exercises},
  {cat: "Упражнения", id: "ex25", icon: "🥉", title: "Четверть сотни", desc: "Заверши 25 упражнений", max: 25, cur: () => T().exercises},
  {cat: "Упражнения", id: "ex100", icon: "💯", title: "Сотня", desc: "Заверши 100 упражнений", max: 100, cur: () => T().exercises},
  {cat: "Упражнения", id: "ex250", icon: "🏋️", title: "Закалка", desc: "Заверши 250 упражнений", max: 250, cur: () => T().exercises},
  {cat: "Упражнения", id: "ex500", icon: "🏛️", title: "Легенда клавиатуры", desc: "Заверши 500 упражнений", max: 500, cur: () => T().exercises},
  // Скорость (слов в минуту)
  {cat: "Скорость", id: "wpm20", icon: "🐢", title: "Уверенный старт", desc: "Достигни 20 слов в минуту", max: 20, cur: wpm},
  {cat: "Скорость", id: "wpm30", icon: "🚶", title: "Бодрый шаг", desc: "Достигни 30 слов в минуту", max: 30, cur: wpm},
  {cat: "Скорость", id: "wpm40", icon: "🏃", title: "Лёгкий бег", desc: "Достигни 40 слов в минуту", max: 40, cur: wpm},
  {cat: "Скорость", id: "wpm50", icon: "⚡", title: "Полсотни", desc: "Достигни 50 слов в минуту", max: 50, cur: wpm},
  {cat: "Скорость", id: "wpm60", icon: "🚀", title: "Реактивный", desc: "Достигни 60 слов в минуту", max: 60, cur: wpm},
  {cat: "Скорость", id: "wpm80", icon: "🔥", title: "Скорость звука", desc: "Достигни 80 слов в минуту", max: 80, cur: wpm},
  // Точность
  {cat: "Точность", id: "acc95", icon: "🎯", title: "На прицеле", desc: "Заверши упражнение с точностью от 95%", max: 95, cur: () => T().bestAcc},
  {cat: "Точность", id: "acc98", icon: "🏹", title: "Снайпер", desc: "Заверши упражнение с точностью от 98%", max: 98, cur: () => T().bestAcc},
  {cat: "Точность", id: "perfect", icon: "💎", title: "Ни одной ошибки", desc: "Пройди упражнение со 100% точностью", max: 1, cur: () => T().perfect},
  {cat: "Точность", id: "perfect3", icon: "🔗", title: "Тройная чистота", desc: "Пройди 3 упражнения подряд без единой ошибки", max: 3, cur: () => T().bestPerfectRun},
  {cat: "Точность", id: "combo", icon: "⚔️", title: "Быстро и чисто", desc: "От 40 слов/мин и точность от 97% в одном упражнении", max: 1, cur: () => T().combo},
  // Объём
  {cat: "Объём", id: "chars1k", icon: "📝", title: "Тысяча знаков", desc: "Напечатай верно 1 000 символов", max: 1000, cur: () => T().chars},
  {cat: "Объём", id: "chars5k", icon: "📄", title: "Пять тысяч", desc: "Напечатай верно 5 000 символов", max: 5000, cur: () => T().chars},
  {cat: "Объём", id: "chars10k", icon: "📚", title: "Десять тысяч", desc: "Напечатай верно 10 000 символов", max: 10000, cur: () => T().chars},
  {cat: "Объём", id: "chars50k", icon: "📖", title: "Роман в кармане", desc: "Напечатай верно 50 000 символов", max: 50000, cur: () => T().chars},
  {cat: "Объём", id: "chars100k", icon: "🏔️", title: "Сто тысяч", desc: "Напечатай верно 100 000 символов", max: 100000, cur: () => T().chars},
  // Время
  {cat: "Время", id: "min10", icon: "⏳", title: "Десять минут", desc: "Суммарно потренируйся 10 минут", max: 600, cur: () => Math.round(T().seconds)},
  {cat: "Время", id: "hour1", icon: "⏱️", title: "Час практики", desc: "Суммарно потренируйся 1 час", max: 3600, cur: () => Math.round(T().seconds)},
  {cat: "Время", id: "hour5", icon: "🕰️", title: "Пять часов", desc: "Суммарно потренируйся 5 часов", max: 18000, cur: () => Math.round(T().seconds)},
  {cat: "Время", id: "hour10", icon: "⌛", title: "Десять часов", desc: "Суммарно потренируйся 10 часов", max: 36000, cur: () => Math.round(T().seconds)},
  // Серии и цели
  {cat: "Серии и цели", id: "streak3", icon: "📅", title: "Три дня подряд", desc: "Тренируйся 3 дня подряд", max: 3, cur: streakDays},
  {cat: "Серии и цели", id: "streak7", icon: "🗓️", title: "Неделя подряд", desc: "Тренируйся 7 дней подряд", max: 7, cur: streakDays},
  {cat: "Серии и цели", id: "streak14", icon: "🌗", title: "Две недели подряд", desc: "Тренируйся 14 дней подряд", max: 14, cur: streakDays},
  {cat: "Серии и цели", id: "streak30", icon: "🌕", title: "Месяц без пропусков", desc: "Тренируйся 30 дней подряд", max: 30, cur: streakDays},
  {cat: "Серии и цели", id: "goal1", icon: "✅", title: "Цель достигнута", desc: "Выполни цель на день", max: 1, cur: () => Object.keys(data.goalDays).length},
  {cat: "Серии и цели", id: "goal7", icon: "🏆", title: "Неделя целей", desc: "Выполни цель на день 7 раз", max: 7, cur: () => Object.keys(data.goalDays).length},
  {cat: "Серии и цели", id: "goalrun3", icon: "🎖️", title: "Цели подряд", desc: "Выполни цель на день 3 дня подряд", max: 3, cur: bestGoalStreak},
  // Режимы
  {cat: "Режимы", id: "sent1", icon: "💬", title: "Целые фразы", desc: "Заверши упражнение в режиме «Предложения»", max: 1, cur: () => T().sentences},
  {cat: "Режимы", id: "sent25", icon: "✍️", title: "Писатель", desc: "Заверши 25 упражнений в режиме «Предложения»", max: 25, cur: () => T().sentences},
  {cat: "Режимы", id: "weak1", icon: "🔍", title: "Взгляд на слабости", desc: "Заверши упражнение на проблемные буквы", max: 1, cur: () => T().weakEx},
  {cat: "Режимы", id: "weak10", icon: "🧗", title: "Упорство", desc: "Заверши 10 упражнений на проблемные буквы", max: 10, cur: () => T().weakEx},
  {cat: "Режимы", id: "fixer", icon: "🛠️", title: "Работа над ошибками", desc: "Пройди упражнение на проблемные буквы с точностью от 95%", max: 1, cur: () => T().fixer},
  // Буквы
  {cat: "Буквы", id: "alphabet", icon: "🔤", title: "Весь алфавит", desc: "Верно напечатай каждую из 32 букв (без Ё)", max: 32, cur: () => [..."абвгдежзийклмнопрстуфхцчшщъыьэюя"].filter(c => okCount(c) >= 1).length},
  {cat: "Буквы", id: "master5", icon: "⭐", title: "Пять отличников", desc: "Освой 5 букв: от 30 нажатий и не более 3% ошибок", max: 5, cur: masteredLetters},
  {cat: "Буквы", id: "master15", icon: "🌟", title: "Пятнадцать отличников", desc: "Освой 15 букв: от 30 нажатий и не более 3% ошибок", max: 15, cur: masteredLetters},
  {cat: "Буквы", id: "rowHome", icon: "🏠", title: "Домашний ряд", desc: "Верно напечатай 500 букв среднего ряда (ФЫВАПРОЛДЖЭ)", max: 500, cur: () => sumOk("фывапролджэ")},
  {cat: "Буквы", id: "rowTop", icon: "🗼", title: "Верхний этаж", desc: "Верно напечатай 300 букв верхнего ряда (ЙЦУКЕНГШЩЗХЪ)", max: 300, cur: () => sumOk("йцукенгшщзхъ")},
  {cat: "Буквы", id: "rowBottom", icon: "⚓", title: "Нижний ряд", desc: "Верно напечатай 300 букв нижнего ряда (ЯЧСМИТЬБЮ)", max: 300, cur: () => sumOk("ячсмитьбю")},
  {cat: "Буквы", id: "rare", icon: "💠", title: "Редкие буквы", desc: "Напечатай верно по 5 раз каждую из букв Ъ, Ф, Щ, Э, Ц", max: 5, cur: () => [..."ъфщэц"].filter(c => okCount(c) >= 5).length},
  {cat: "Буквы", id: "clean", icon: "🧼", title: "Чистый лист", desc: "Набери 300 нажатий, и чтобы проблемных букв не осталось", max: 1, cur: () => totalAttempts() >= 300 && weakLetters().length === 0 ? 1 : 0},
  // Привычки
  {cat: "Привычки", id: "early", icon: "🌅", title: "Ранняя пташка", desc: "Заверши упражнение до 8 утра", max: 1, cur: () => T().early},
  {cat: "Привычки", id: "owl", icon: "🦉", title: "Ночная сова", desc: "Заверши упражнение после 23:00 или до 5 утра", max: 1, cur: () => T().owl},
  {cat: "Привычки", id: "busy", icon: "🔋", title: "Насыщенный день", desc: "Заверши 10 упражнений за один день", max: 10, cur: () => T().maxDayEx},
  {cat: "Привычки", id: "records", icon: "📈", title: "Рекордсмен", desc: "Побей свой рекорд скорости 5 раз", max: 5, cur: () => T().records}
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
  const card = (a) => {
    const ok = !!data.ach[a.id], cur = Math.min(a.cur(), a.max);
    return `<article class="ach ${ok ? "unlocked" : "locked"}"><div class="ach-icon">${a.icon}</div><div class="ach-body"><h3>${a.title}</h3><p>${a.desc}</p>` +
      `<div class="ach-bar"><div style="width:${Math.round(cur / a.max * 100)}%"></div></div><small>${ok ? "Получено" : `${cur.toLocaleString("ru-RU")} / ${a.max.toLocaleString("ru-RU")}`}</small></div></article>`;
  };
  const cats = [...new Set(ACHIEVEMENTS.map(a => a.cat))];
  $("achGrid").innerHTML = cats.map(c => {
    const list = ACHIEVEMENTS.filter(a => a.cat === c);
    return `<h2 class="ach-cat">${c} <span>${list.filter(a => data.ach[a.id]).length}/${list.length}</span></h2><div class="ach-row">${list.map(card).join("")}</div>`;
  }).join("");
}

// ===== Статистика =====
function renderStats() {
  const t = data.totals;
  let a = 0, e = 0;
  for (const s of Object.values(data.chars)) { a += s.a; e += s.e; }
  const mins = Math.floor(t.seconds / 60);
  const cards = [["УПРАЖНЕНИЙ", t.exercises, "завершено"], ["СИМВОЛОВ", t.chars, "напечатано верно"], ["ВРЕМЯ", mins >= 60 ? `${Math.floor(mins / 60)}ч ${mins % 60}м` : `${mins} мин`, "в тренировках"],
    ["РЕКОРД", Math.round(t.bestSpeed / 5), "слов/мин"], ["ТОЧНОСТЬ", a ? Math.round((a - e) / a * 100) + "%" : "—", "за всё время"], ["СЕРИЯ", streakDays(), "дней подряд"]];
  $("totalsGrid").innerHTML = cards.map(([l, v, s]) => `<article class="stat-card"><span class="stat-label">${l}</span><strong>${v}</strong><small>${s}</small></article>`).join("");
  const rowsData = Object.entries(data.chars).filter(([ch, s]) => ch !== " " && s.a >= 3 && s.e > 0).map(([ch, s]) => ({ch, a: s.a, e: s.e, rate: s.e / s.a})).sort((x, y) => y.rate - x.rate).slice(0, 10);
  $("weakList").innerHTML = rowsData.length ? rowsData.map(r => `<div class="weak-row"><span class="weak-letter">${r.ch}</span><div class="weak-bar"><div style="width:${Math.min(100, Math.round(r.rate * 100) * 2)}%"></div></div><span class="weak-num">${Math.round(r.rate * 100)}% · ${r.e} из ${r.a}</span></div>`).join("")
    : '<p class="muted-text">Пока нет ошибок для анализа. Потренируйся, и здесь появятся буквы, которые стоит подтянуть.</p>';
  const days = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push({k: d.toLocaleDateString("sv-SE"), l: d.toLocaleDateString("ru-RU", {weekday: "short"})}); }
  const max = Math.max(1, dailyGoal(), ...days.map(d => data.days[d.k]?.ex || 0));
  $("weekChart").innerHTML = days.map(d => { const c = data.days[d.k]?.ex || 0; return `<div class="wk"><div class="wk-bar ${data.goalDays[d.k] ? "goal" : ""}" style="height:${Math.max(3, Math.round(c / max * 100))}%" title="${c} упр."></div><span>${d.l}</span><small>${c}</small></div>`; }).join("");
}

// ===== Ход упражнения =====
function finish() {
  if (finished) return;
  finished = true;
  clearInterval(timerId);
  const m = getMetrics(), t = data.totals, now = new Date(), prevBest = t.bestSpeed;
  t.exercises++; t.seconds += m.elapsed;
  if (m.speed > t.bestSpeed) { if (prevBest > 0) t.records++; t.bestSpeed = m.speed; }
  t.bestAcc = Math.max(t.bestAcc, m.accuracy);
  if (ms === 0) { t.perfect++; t.perfectRun++; t.bestPerfectRun = Math.max(t.bestPerfectRun, t.perfectRun); } else t.perfectRun = 0;
  if (m.speed / 5 >= 40 && m.accuracy >= 97) t.combo = 1;
  if (exMode === "sentences") t.sentences++;
  if (exMode === "weak") { t.weakEx++; if (m.accuracy >= 95) t.fixer++; }
  if (now.getHours() < 8) t.early = 1;
  if (now.getHours() >= 23 || now.getHours() < 5) t.owl = 1;
  const rec = dayRecord(), goal = dailyGoal();
  rec.ex++; t.maxDayEx = Math.max(t.maxDayEx, rec.ex);
  if (rec.ex === goal) { data.goalDays[todayKey()] = true; toast("🎉 Цель на день выполнена!"); }
  saveData(); unsaved = 0; updateGoal();
  const fresh = checkAchievements();
  $("finalSpeed").textContent = m.speed; $("finalAccuracy").textContent = m.accuracy + "%";
  $("finalTime").textContent = formatTime(m.elapsed); $("finalErrors").textContent = m.errors;
  const weak = weakLetters(3);
  let extra = `<p>Скорость: <b>≈${Math.round(m.speed / 5)} слов/мин</b> · рекорд <b>${Math.round(t.bestSpeed / 5)}</b></p>`;
  extra += `<p>Цель на день: <b>${Math.min(rec.ex, goal)} / ${goal}</b> упражнений${rec.ex >= goal ? " — выполнена ✓" : ""}</p>`;
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
  exMode = settings.mode === "sentences" ? "sentences" : weakActive ? "weak" : "normal";
  modal.classList.add("hidden");
  $("hintText").textContent = "Нажми любую клавишу, чтобы начать";
  renderPrompt(); updateStats(); updateGoal(); updateModeTitle(); renderWeakStrip(); markWeakKeys(); highlightNext();
  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
}
function resolveChar(e) {
  if (e.key.length !== 1) return null;
  const k = e.key.toLowerCase();
  if (/[а-яё0-9 ]/.test(k)) return k;
  if (e.code === "Slash" && (k === "." || k === ",")) return k;     // русская раскладка: «.» и «,»
  if (codeToChar[e.code]) return codeToChar[e.code];                  // латинская раскладка: берём букву по положению клавиши
  return k;
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
  const expected = target[typed.length], low = expected.toLowerCase(), ok = ch === low;   // заглавные принимаются и без Shift
  const st = data.chars[low] || (data.chars[low] = {a: 0, e: 0});
  st.a++; ks++;
  if (ok) { data.totals.chars++; dayRecord().chars++; } else { st.e++; ms++; }
  if (settings.soundKey && ok) beep(900, 0.04, 0.05);
  if (settings.soundErr && !ok) beep(160, 0.12, 0.08);
  flashKey(keyForChar(ch), ok ? "pressed" : "error");
  if (ok) tapHands();
  typed += ok ? expected : ch;
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
    if (el.type === "number") {
      const min = Number(el.min), max = Number(el.max);
      el.addEventListener("input", () => {          // применяем сразу, как только введено допустимое число
        const v = Number(el.value);
        if (Number.isInteger(v) && v >= min && v <= max) { settings[key] = v; saveSettings(); applySettings(); }
      });
      el.addEventListener("change", () => {          // при уходе из поля исправляем недопустимое значение
        const v = Math.min(max, Math.max(min, Math.round(Number(el.value)) || min));
        el.value = v; settings[key] = v; saveSettings(); applySettings();
      });
      return;
    }
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
  const shown = (activeChar === " " ? "Пробел" : "«" + activeChar + "»") + (ch !== ch.toLowerCase() ? " + Shift" : "");
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
