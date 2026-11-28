(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const BASE = "https://github.com/sikpladkastkolatkov-blip/blindtype-desktop/releases/download/latest/";
  const FILES = {
    win: BASE + "Swift-Nimble-Exact-Input-System-Setup-1.0.0.exe",
    mac: BASE + "Swift-Nimble-Exact-Input-System-1.0.0-mac-arm64.dmg"
  };

  /* Навигация: фон после прокрутки */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 24);
  onScroll(); addEventListener("scroll", onScroll, {passive: true});

  /* Определение системы: главная кнопка ведёт сразу на нужный файл */
  const ua = navigator.userAgent, plat = navigator.userAgentData?.platform || navigator.platform || "";
  const mobile = /Android|iPhone|iPad|iPod/.test(ua);
  const isWin = !mobile && (/Win/i.test(plat) || /Windows/.test(ua));
  const isMac = !mobile && /Mac/i.test(plat);
  const cta = $("#heroCta"), note = $("#heroNote");
  if (isWin) {
    cta.textContent = "Скачать для Windows"; cta.href = FILES.win;
    $('.dl[data-os="win"]')?.classList.add("match");
  } else if (isMac) {
    cta.textContent = "Скачать для Mac"; cta.href = FILES.mac;
    note.textContent = "Для Mac с чипом Apple (M1 и новее). Если у вас Mac с процессором Intel, версия для него ниже, в разделе загрузки.";
    $('.dl[data-os="mac"]')?.classList.add("match");
  } else if (mobile) {
    note.textContent = "Это приложение для компьютера: откройте страницу на Windows или Mac.";
  }

  /* «Проявка» скриншотов при появлении на экране */
  const shots = $$(".shot img");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), {threshold: .18});
    shots.forEach(img => { img.classList.add("develop"); io.observe(img); });
  }

  /* Схема пальцев */
  const fingerChars = {"#c79bff": "ё1йфя0-=зхъжэ,.", "#6fb7ff": "2цыч9щдю", "#6df0b2": "3увс8шлб", "#f2c35a": "45кепами67нгроть"};
  const colorOf = {};
  for (const [c, chars] of Object.entries(fingerChars)) for (const ch of chars) colorOf[ch] = c;
  const board = $("#zoneBoard");
  if (board) {
    [["ё","1","2","3","4","5","6","7","8","9","0","-","="], ["й","ц","у","к","е","н","г","ш","щ","з","х","ъ"], ["ф","ы","в","а","п","р","о","л","д","ж","э"], ["я","ч","с","м","и","т","ь","б","ю",",","."], [" "]].forEach(row => {
      const r = document.createElement("div"); r.className = "zrow";
      row.forEach(ch => {
        const k = document.createElement("div"); k.className = "zk" + (ch === " " ? " sp" : "");
        k.style.setProperty("--c", ch === " " ? "#f08a7a" : colorOf[ch]);
        k.textContent = ch === " " ? "пробел" : ch; r.appendChild(k);
      });
      board.appendChild(r);
    });
  }

  /* Мини-тренажёр */
  const box = $("#trainer"); if (!box) return;
  const textEl = $("#trainerText"), wpmEl = $("#tWpm"), accEl = $("#tAcc"), hint = $("#tHint");
  const phrases = ["Тише едешь, дальше будешь.", "Каждый палец знает свою клавишу.", "Скорость приходит с практикой, а точность с вниманием.", "Лучше поздно, чем никогда.", "Мягко нажимай на клавиши и не торопись.", "Повторение мать учения."];
  const codeToChar = {KeyQ:"й",KeyW:"ц",KeyE:"у",KeyR:"к",KeyT:"е",KeyY:"н",KeyU:"г",KeyI:"ш",KeyO:"щ",KeyP:"з",BracketLeft:"х",BracketRight:"ъ",KeyA:"ф",KeyS:"ы",KeyD:"в",KeyF:"а",KeyG:"п",KeyH:"р",KeyJ:"о",KeyK:"л",KeyL:"д",Semicolon:"ж",Quote:"э",KeyZ:"я",KeyX:"ч",KeyC:"с",KeyV:"м",KeyB:"и",KeyN:"т",KeyM:"ь",Comma:"б",Period:"ю",Slash:".",Space:" "};
  const resolve = (e) => {
    if (e.key.length !== 1) return null;
    const k = e.key.toLowerCase();
    if (/[а-яё0-9 ]/.test(k)) return k;
    if (e.code === "Slash" && (k === "." || k === ",")) return k;
    return codeToChar[e.code] ?? null;
  };
  let target = "", typed = "", started = 0, keys = 0, errs = 0, done = false, last = -1;
  const pick = () => { let i; do { i = Math.floor(Math.random() * phrases.length); } while (i === last && phrases.length > 1); last = i; return phrases[i]; };
  const render = () => {
    textEl.innerHTML = "";
    [...target].forEach((c, i) => {
      const s = document.createElement("span");
      s.textContent = i === typed.length && c === " " ? "  ​" : c;
      s.className = i < typed.length ? (typed[i] === c ? "ok" : "bad") : i === typed.length ? "cur" : "";
      textEl.appendChild(s);
    });
  };
  const stats = () => {
    const mins = started ? Math.max(1 / 60, (Date.now() - started) / 60000) : 0;
    const ok = [...typed].filter((c, i) => c === target[i]).length;
    wpmEl.textContent = mins ? Math.round(ok / 5 / mins) : 0;
    accEl.textContent = (keys ? Math.round((keys - errs) / keys * 100) : 100) + "%";
  };
  const reset = () => { target = pick(); typed = ""; started = 0; keys = 0; errs = 0; done = false; render(); stats(); hint.textContent = box.classList.contains("on") ? "Печатайте" : "Нажмите сюда и начните печатать"; };
  box.addEventListener("focus", () => { box.classList.add("on"); if (!done && !started) hint.textContent = "Печатайте"; });
  box.addEventListener("blur", () => { box.classList.remove("on"); if (!done && !started) hint.textContent = "Нажмите сюда и начните печатать"; });
  box.addEventListener("click", () => box.focus());
  box.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key === "Tab") return;
    if (e.key === "Escape") { e.preventDefault(); reset(); return; }
    if (e.key === "Backspace") { e.preventDefault(); typed = typed.slice(0, -1); render(); return; }
    const ch = resolve(e); if (ch === null) return;
    e.preventDefault();
    if (done) reset();
    if (!started) started = Date.now();
    const exp = target[typed.length], ok = ch === exp.toLowerCase();
    keys++; if (!ok) errs++;
    typed += ok ? exp : ch;
    render(); stats();
    if (typed.length >= target.length) {
      done = true; stats();
      hint.textContent = "Готово. Нажмите любую клавишу, чтобы начать новую фразу";
    }
  });
  reset();
})();
