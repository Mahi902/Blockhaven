// A tiny desktop computer: boots up, then you can use Notes, Paint, Calculator, a little Browser and Settings.
// Notes and the wallpaper are remembered.
const WALLS = [
  ["Sunrise", "linear-gradient(160deg,#ff9a76,#ffd27a 55%,#8cc8ff)"],
  ["Ocean", "linear-gradient(180deg,#1e5fbf,#2bc9d8 70%,#bff0ff)"],
  ["Forest", "linear-gradient(160deg,#14532d,#2fa953 60%,#9ee03a)"],
  ["Night", "linear-gradient(180deg,#0b1020,#2b2263 70%,#6a4bb3)"],
];
const PAGES = {
  home: ["Blockhaven Web", "Welcome! Pick a page:\n\n- Cats: the internet's favourite subject\n- Weather: always sunny in Blockhaven\n- News: very important stories", ["cats", "weather", "news"]],
  cats: ["Cats", "Cats sleep about 14 hours a day.\nA group of cats is called a clowder.\nThey do not care about your deadline.\n\n(Forty tabs open. Mostly cats.)", ["home"]],
  weather: ["Weather", "Today: sunny with a chance of blocks.\nTomorrow: also sunny.\nThe day after: ask the cat.", ["home"]],
  news: ["News", "LOCAL MAN REARRANGES SOFA AGAIN. Experts say it looked fine before.\n\nNEIGHBOUR'S PIANO: FOUR NOTES NOW IN TUNE.\n\nCHEESE STILL DELICIOUS, SOURCES CONFIRM.", ["home"]],
};
export default api => {
  const { h, button } = api.ui;
  const st = api.state;
  let wall = (st.wall | 0) % WALLS.length;
  const css = o => o;

  const screen = h("div", { style: css({ position: "relative", height: "390px", borderRadius: "10px", border: "8px solid #1a1d29", overflow: "hidden", background: "#000", color: "#fff", fontFamily: "sans-serif" }) });
  let tick = null;
  const body = h("div", {}, screen);

  // ---------- boot
  const boot = () => {
    screen.innerHTML = "";
    const bar = h("div", { style: css({ height: "100%", width: "0%", background: "#8cc8ff", transition: "width 1.4s linear" }) });
    screen.append(h("div", { style: css({ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px" }) },
      h("div", { style: css({ font: "700 26px Fredoka, sans-serif", letterSpacing: ".15em" }) }, "BLOCK OS"),
      h("div", { style: css({ width: "160px", height: "8px", background: "#222", borderRadius: "4px", overflow: "hidden" }) }, bar)));
    setTimeout(() => { bar.style.width = "100%"; }, 30);
    setTimeout(() => { if (screen.isConnected) desktop(); }, 1500);
  };

  // ---------- desktop
  let win = null, clock = null, menuEl = null;
  const desktop = () => {
    screen.innerHTML = ""; win = null;
    const wp = h("div", { style: css({ position: "absolute", inset: 0, background: WALLS[wall][1] }) });
    const icons = [["Notes", "\u{1F4DD}", notes], ["Paint", "\u{1F3A8}", paint], ["Calculator", "\u{1F9EE}", calc], ["Browser", "\u{1F310}", browser], ["Settings", "\u2699\uFE0F", settings]];
    const grid = h("div", { style: css({ position: "absolute", left: "10px", top: "10px", display: "grid", gridTemplateColumns: "repeat(1, 70px)", gap: "10px" }) },
      icons.map(([n, e, fn]) => {
        const b = h("button", { type: "button", style: css({ background: "none", border: "none", color: "#fff", cursor: "pointer", textAlign: "center", textShadow: "0 1px 3px #000", font: "600 11px sans-serif" }) },
          h("div", { style: css({ fontSize: "30px", lineHeight: "34px" }) }, e), n);
        b.addEventListener("click", () => { api.sound("click"); fn(); });
        return b;
      }));
    clock = h("span", { style: css({ font: "600 12px sans-serif" }) }, "");
    const upd = () => { const d = new Date(); clock.textContent = d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0"); };
    upd(); tick = setInterval(upd, 5000);
    const start = h("button", { type: "button", style: css({ background: "#3166e0", color: "#fff", border: "none", borderRadius: "6px", padding: "3px 10px", font: "700 12px sans-serif", cursor: "pointer" }) }, "\u229E Start");
    start.addEventListener("click", () => {
      api.sound("click");
      if (menuEl) { menuEl.remove(); menuEl = null; return; }
      menuEl = h("div", { style: css({ position: "absolute", left: "6px", bottom: "34px", background: "#1f2433", border: "1px solid #444", borderRadius: "8px", padding: "6px", minWidth: "140px", zIndex: 5 }) },
        ...icons.map(([n, e, fn]) => { const r = h("div", { style: css({ padding: "6px 8px", cursor: "pointer", font: "600 13px sans-serif" }) }, e + "  " + n); r.addEventListener("click", () => { menuEl.remove(); menuEl = null; fn(); }); return r; }),
        (() => { const r = h("div", { style: css({ padding: "6px 8px", cursor: "pointer", font: "600 13px sans-serif", borderTop: "1px solid #444", marginTop: "4px", color: "#ff8a8a" }) }, "\u23FB  Shut down"); r.addEventListener("click", () => { api.closeModal(); api.say("Computer off."); }); return r; })());
      screen.append(menuEl);
    });
    const bar = h("div", { style: css({ position: "absolute", left: 0, right: 0, bottom: 0, height: "30px", background: "rgba(15,18,30,.92)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px" }) }, start, clock);
    screen.append(wp, grid, bar);
  };

  const openWin = (title, content, onClose) => {
    if (win) win.remove();
    if (menuEl) { menuEl.remove(); menuEl = null; }
    const x = h("button", { type: "button", style: css({ background: "#e03c3c", color: "#fff", border: "none", borderRadius: "4px", width: "22px", height: "20px", cursor: "pointer", font: "700 12px sans-serif" }) }, "\u2715");
    win = h("div", { style: css({ position: "absolute", left: "84px", right: "10px", top: "10px", bottom: "40px", background: "#f4f5f8", color: "#222", borderRadius: "8px", boxShadow: "0 6px 20px rgba(0,0,0,.5)", display: "flex", flexDirection: "column", overflow: "hidden" }) },
      h("div", { style: css({ background: "#3166e0", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", font: "700 13px sans-serif" }) }, title, x),
      h("div", { style: css({ flex: 1, padding: "8px", overflow: "auto", display: "flex", flexDirection: "column", gap: "6px" }) }, content));
    x.addEventListener("click", () => { if (onClose) onClose(); win.remove(); win = null; api.sound("click"); });
    screen.append(win);
  };

  // ---------- apps
  const notes = () => {
    const ta = h("textarea", { placeholder: "Type here... (saved automatically)", style: css({ flex: 1, minHeight: "200px", resize: "none", border: "1px solid #ccc", borderRadius: "6px", padding: "8px", font: "14px/1.4 monospace", color: "#222", userSelect: "text" }) });
    ta.value = st.notes || "";
    ta.addEventListener("input", () => { st.notes = ta.value; });
    openWin("Notes", ta, () => api.save());
    ta.focus();
  };

  const paint = () => {
    const cv = h("canvas", { width: 300, height: 200, style: css({ background: "#fff", border: "1px solid #bbb", borderRadius: "4px", touchAction: "none", width: "100%", maxHeight: "200px" }) });
    const g = cv.getContext("2d"); g.lineCap = "round"; g.lineJoin = "round";
    let col = "#222", size = 4, down = false, lx = 0, ly = 0;
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
    cv.addEventListener("pointerdown", e => { down = true; [lx, ly] = pos(e); g.fillStyle = col; g.beginPath(); g.arc(lx, ly, size / 2, 0, 7); g.fill(); cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", e => { if (!down) return; const [x, y] = pos(e); g.strokeStyle = col; g.lineWidth = size; g.beginPath(); g.moveTo(lx, ly); g.lineTo(x, y); g.stroke(); lx = x; ly = y; });
    const up = () => { down = false; }; cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    const cols = ["#222", "#e03c3c", "#f28a2e", "#f6d43c", "#2fa953", "#3166e0", "#8c52d8", "#ffffff"];
    const row = h("div", { style: css({ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }) },
      ...cols.map(c => { const b = h("button", { type: "button", style: css({ width: "22px", height: "22px", borderRadius: "50%", border: "2px solid #555", background: c, cursor: "pointer" }) }); b.addEventListener("click", () => { col = c; }); return b; }),
      (() => { const b = h("button", { type: "button", style: css({ padding: "2px 8px", cursor: "pointer" }) }, "Size"); b.addEventListener("click", () => { size = size >= 16 ? 2 : size + 4; b.textContent = "Size " + size; }); return b; })(),
      (() => { const b = h("button", { type: "button", style: css({ padding: "2px 8px", cursor: "pointer" }) }, "Clear"); b.addEventListener("click", () => g.clearRect(0, 0, 300, 200)); return b; })());
    openWin("Paint", [row, cv]);
  };

  const calc = () => {
    let cur = "0", acc = null, op = null, fresh = true;
    const disp = h("div", { style: css({ background: "#111", color: "#8ff0a4", font: "700 24px monospace", textAlign: "right", padding: "8px", borderRadius: "6px", minHeight: "42px", overflow: "hidden" }) }, "0");
    const run = () => { const a = acc, b = parseFloat(cur); if (op === "+") return a + b; if (op === "-") return a - b; if (op === "*") return a * b; if (op === "/") return b === 0 ? NaN : a / b; return b; };
    const show = () => { disp.textContent = cur.length > 12 ? String(Number(cur).toPrecision(9)) : cur; };
    const press = k => {
      if (/\d|\./.test(k)) { if (fresh) { cur = k === "." ? "0." : k; fresh = false; } else if (!(k === "." && cur.includes("."))) cur += k; }
      else if (k === "C") { cur = "0"; acc = null; op = null; fresh = true; }
      else if (k === "=") { if (op) { cur = String(+run().toFixed(10)); acc = null; op = null; fresh = true; } }
      else { if (op && !fresh) { cur = String(+run().toFixed(10)); } acc = parseFloat(cur); op = k; fresh = true; }
      if (cur === "NaN") { cur = "Error"; acc = null; op = null; } show();
    };
    const keys = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+"];
    const grid = h("div", { style: css({ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "5px" }) },
      ...keys.map(k => { const b = h("button", { type: "button", style: css({ padding: "9px 0", font: "700 16px sans-serif", cursor: "pointer", borderRadius: "6px", border: "1px solid #bbb", background: /\d|\./.test(k) ? "#fff" : "#dfe6f6" }) }, k === "*" ? "\u00D7" : k === "/" ? "\u00F7" : k); b.addEventListener("click", () => press(k)); return b; }),
      (() => { const b = h("button", { type: "button", style: css({ gridColumn: "1 / -1", padding: "7px", cursor: "pointer", borderRadius: "6px", border: "1px solid #bbb", background: "#ffd6d6", font: "700 14px sans-serif" }) }, "C"); b.addEventListener("click", () => press("C")); return b; })());
    openWin("Calculator", [disp, grid]);
  };

  const browser = (pg = "home") => {
    const [title, text, links] = PAGES[pg];
    const addr = h("div", { style: css({ background: "#fff", border: "1px solid #bbb", borderRadius: "14px", padding: "3px 10px", font: "12px monospace", color: "#555" }) }, "blockhaven://" + pg);
    const content = h("div", { style: css({ flex: 1, background: "#fff", border: "1px solid #ddd", borderRadius: "6px", padding: "10px", font: "14px/1.5 sans-serif", whiteSpace: "pre-wrap", userSelect: "text" }) }, h("div", { style: css({ font: "700 18px Fredoka, sans-serif", marginBottom: "6px" }) }, title), text);
    const nav = h("div", { style: css({ display: "flex", gap: "6px", flexWrap: "wrap" }) }, ...links.map(l => { const b = h("button", { type: "button", style: css({ padding: "4px 10px", cursor: "pointer", borderRadius: "6px", border: "1px solid #3166e0", background: "#e8efff", color: "#1d3f99", font: "700 12px sans-serif" }) }, "\u2192 " + PAGES[l][0]); b.addEventListener("click", () => { api.sound("click"); browser(l); }); return b; }));
    openWin("Browser", [addr, content, nav]);
  };

  const settings = () => {
    const opts = WALLS.map(([n, bg], i) => { const b = h("button", { type: "button", style: css({ height: "54px", borderRadius: "8px", border: i === wall ? "3px solid #3166e0" : "2px solid #999", background: bg, color: "#fff", font: "700 12px sans-serif", textShadow: "0 1px 2px #000", cursor: "pointer" }) }, n); b.addEventListener("click", () => { wall = i; st.wall = i; api.save(); desktop(); settings(); }); return b; });
    openWin("Settings", [h("div", { style: css({ font: "700 13px sans-serif" }) }, "Wallpaper"), h("div", { style: css({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }) }, ...opts), h("div", { style: css({ font: "11px sans-serif", color: "#666", marginTop: "8px" }) }, "Block OS 1.0 - Blockhaven")]);
  };

  api.modal({ title: "Computer", subtitle: "Block OS", wide: true, body, onClose: () => { clearInterval(tick); api.glow(null); } });
  api.glow("#8cc8ff", 2, { temp: true });
  api.sound("switch");
  boot();
};
