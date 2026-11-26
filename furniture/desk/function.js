// A tiny desktop computer: boots up, then you can use Notes, Paint, Calculator, a little Browser and Settings.
// Notes and the wallpaper are remembered.
const WALLS = [
  ["Teal", "#1f7a7a"],
  ["Blue", "#2b5797"],
  ["Gray", "#596273"],
  ["Black", "#14161c"],
];
const PAGES = {
  home: ["Blockhaven Web", "Welcome! Type a page or a word in the address bar and press Enter.\n\nPages: cats, weather, news, recipes, jokes", ["cats", "weather", "news", "recipes", "jokes"]],
  recipes: ["Recipes", "Toast: put bread in toaster. Wait. Eat.\n\nCheese on toast: as above, but with cheese.\n\nTea: boil water, add tea, stand there thinking.", ["home"]],
  jokes: ["Jokes", "Why did the block cross the road? It was pushed.\n\nWhat do you call cheese that is not yours? Nacho cheese.\n\nI would tell you a construction joke, but I am still working on it.", ["home"]],
  notfound: ["Page not found", "Nothing here. Try: cats, weather, news, recipes, jokes.", ["home"]],
  cats: ["Cats", "Cats sleep about 14 hours a day.\nA group of cats is called a clowder.\nThey do not care about your deadline.\n\n(Forty tabs open. Mostly cats.)", ["home"]],
  weather: ["Weather", "Today: sunny with a chance of blocks.\nTomorrow: also sunny.\nThe day after: ask the cat.", ["home"]],
  news: ["News", "LOCAL MAN REARRANGES SOFA AGAIN. Experts say it looked fine before.\n\nNEIGHBOUR'S PIANO: FOUR NOTES NOW IN TUNE.\n\nCHEESE STILL DELICIOUS, SOURCES CONFIRM.", ["home"]],
};

const SVG = {
  Notes: '<svg viewBox="0 0 32 32" width="34" height="34"><path d="M7 3h14l5 5v21H7z" fill="#fff" stroke="#222" stroke-width="1.5"/><path d="M21 3v5h5" fill="#ddd" stroke="#222" stroke-width="1.5"/><path d="M10 13h13M10 17h13M10 21h13M10 25h8" stroke="#3a6ea5" stroke-width="1.6"/></svg>',
  Paint: '<svg viewBox="0 0 32 32" width="34" height="34"><path d="M16 4C8 4 3 9.5 3 15.5S8 27 14 27c3 0 3-2.5 2-4s0-3.5 3-3.5h5c3 0 5-2 5-5C29 8 23 4 16 4z" fill="#f2e2b8" stroke="#222" stroke-width="1.5"/><circle cx="10" cy="13" r="2.3" fill="#e03c3c"/><circle cx="16" cy="9.5" r="2.3" fill="#f6d43c"/><circle cx="22.5" cy="12" r="2.3" fill="#2fa953"/><circle cx="9.5" cy="20" r="2.3" fill="#3166e0"/></svg>',
  Calculator: '<svg viewBox="0 0 32 32" width="34" height="34"><rect x="6" y="3" width="20" height="26" rx="2" fill="#c8ccd4" stroke="#222" stroke-width="1.5"/><rect x="9" y="6" width="14" height="6" fill="#9be8a8" stroke="#222"/><g fill="#555"><rect x="9" y="15" width="4" height="3"/><rect x="14" y="15" width="4" height="3"/><rect x="19" y="15" width="4" height="3"/><rect x="9" y="20" width="4" height="3"/><rect x="14" y="20" width="4" height="3"/><rect x="19" y="20" width="4" height="3"/><rect x="9" y="25" width="9" height="2"/><rect x="19" y="25" width="4" height="2" fill="#e03c3c"/></g></svg>',
  Browser: '<svg viewBox="0 0 32 32" width="34" height="34"><circle cx="16" cy="16" r="12.5" fill="#4b8fe0" stroke="#222" stroke-width="1.5"/><path d="M4 16h24M16 3.5c-6 5-6 20 0 25M16 3.5c6 5 6 20 0 25M6 9.5h20M6 22.5h20" fill="none" stroke="#fff" stroke-width="1.2"/></svg>',
  Clock: '<svg viewBox="0 0 32 32" width="34" height="34"><circle cx="16" cy="16" r="12.5" fill="#fff" stroke="#222" stroke-width="1.8"/><path d="M16 7v9l6 3" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="16" r="1.4" fill="#e03c3c"/></svg>',
  Settings: '<svg viewBox="0 0 32 32" width="34" height="34"><g fill="#8a8f99" stroke="#222" stroke-width="1.2"><rect x="13.5" y="2" width="5" height="28" rx="1"/><rect x="13.5" y="2" width="5" height="28" rx="1" transform="rotate(45 16 16)"/><rect x="13.5" y="2" width="5" height="28" rx="1" transform="rotate(90 16 16)"/><rect x="13.5" y="2" width="5" height="28" rx="1" transform="rotate(135 16 16)"/></g><circle cx="16" cy="16" r="8" fill="#a9afba" stroke="#222" stroke-width="1.5"/><circle cx="16" cy="16" r="3.2" fill="#1f7a7a" stroke="#222"/></svg>',
};
const icon = n => { const d = document.createElement("div"); d.innerHTML = SVG[n]; d.style.cssText = "width:34px;height:34px;margin:0 auto 3px"; return d; };
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
    const bar = h("div", { style: css({ height: "100%", width: "0%", background: "#c0c0c0", transition: "width 1.4s linear" }) });
    screen.append(h("div", { style: css({ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px" }) },
      h("div", { style: css({ font: "14px monospace" }) }, "Starting Block OS..."),
      h("div", { style: css({ width: "160px", height: "8px", background: "#222", borderRadius: "4px", overflow: "hidden" }) }, bar)));
    setTimeout(() => { bar.style.width = "100%"; }, 30);
    setTimeout(() => { if (screen.isConnected) desktop(); }, 1500);
  };

  // ---------- desktop
  let win = null, clock = null, menuEl = null;
  const desktop = () => {
    screen.innerHTML = ""; win = null;
    const wp = h("div", { style: css({ position: "absolute", inset: 0, background: WALLS[wall][1] }) });
    const icons = [["Notes", "", notes], ["Paint", "", paint], ["Calculator", "", calc], ["Browser", "", browser], ["Clock", "", clockApp], ["Settings", "", settings]];
    const grid = h("div", { style: css({ position: "absolute", left: "10px", top: "10px", display: "grid", gridTemplateColumns: "repeat(2, 66px)", gap: "6px" }) },
      icons.map(([n, e, fn]) => {
        const b = h("button", { type: "button", style: css({ background: "none", border: "none", color: "#fff", cursor: "pointer", textAlign: "center", textShadow: "0 1px 2px #000", font: "11px sans-serif" }) },
          icon(n), n);
        b.addEventListener("click", () => { api.sound("click"); fn(); });
        return b;
      }));
    clock = h("span", { style: css({ font: "600 12px sans-serif" }) }, "");
    const upd = () => { const d = new Date(); clock.textContent = d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0"); };
    upd(); tick = setInterval(upd, 5000);
    const start = h("button", { type: "button", style: css({ background: "#d4d0c8", color: "#000", border: "2px outset #fff", borderRadius: "0", padding: "2px 12px", font: "bold 12px sans-serif", cursor: "pointer" }) }, "Start");
    start.addEventListener("click", () => {
      api.sound("click");
      if (menuEl) { menuEl.remove(); menuEl = null; return; }
      menuEl = h("div", { style: css({ position: "absolute", left: "6px", bottom: "34px", background: "#c0c0c0", color: "#000", border: "2px outset #fff", padding: "2px", minWidth: "140px", zIndex: 5 }) },
        ...icons.map(([n, e, fn]) => { const r = h("div", { style: css({ padding: "5px 8px", cursor: "pointer", font: "13px sans-serif" }) }, n); r.addEventListener("click", () => { menuEl.remove(); menuEl = null; fn(); }); return r; }),
        (() => { const r = h("div", { style: css({ padding: "6px 8px", cursor: "pointer", font: "600 13px sans-serif", borderTop: "1px solid #666", marginTop: "3px" }) }, "Shut down"); r.addEventListener("click", () => { api.closeModal(); api.say("Computer off."); }); return r; })());
      screen.append(menuEl);
    });
    const bar = h("div", { style: css({ position: "absolute", left: 0, right: 0, bottom: 0, height: "30px", background: "#c0c0c0", color: "#000", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px" }) }, start, clock);
    screen.append(wp, grid, bar);
  };

  const openWin = (title, content, onClose) => {
    if (win) win.remove();
    if (menuEl) { menuEl.remove(); menuEl = null; }
    const x = h("button", { type: "button", style: css({ background: "#c0c0c0", color: "#000", border: "2px outset #fff", borderRadius: "0", width: "20px", height: "18px", padding: "0", cursor: "pointer", font: "bold 11px sans-serif" }) }, "x");
    win = h("div", { style: css({ position: "absolute", left: "156px", right: "8px", top: "8px", bottom: "38px", background: "#c0c0c0", color: "#000", border: "2px outset #fff", borderRadius: "0", boxShadow: "2px 2px 0 rgba(0,0,0,.5)", display: "flex", flexDirection: "column", overflow: "hidden" }) },
      h("div", { style: css({ background: "#1a3f7a", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 4px 2px 6px", font: "bold 12px sans-serif" }) }, title, x),
      h("div", { style: css({ flex: 1, padding: "8px", overflow: "auto", display: "flex", flexDirection: "column", gap: "6px" }) }, content));
    x.addEventListener("click", () => { if (onClose) onClose(); win.remove(); win = null; api.sound("click"); });
    screen.append(win);
  };

  // ---------- apps
  const notes = () => {
    const ta = h("textarea", { placeholder: "Type here... (saved automatically)", style: css({ flex: 1, minHeight: "170px", resize: "none", border: "2px inset #fff", padding: "8px", font: "14px/1.4 monospace", color: "#222", userSelect: "text" }) });
    ta.value = st.notes || "";
    const info = h("span", { style: css({ font: "11px sans-serif" }) }, "");
    const count = () => { const t = ta.value; info.textContent = t.length + " chars, " + (t.trim() ? t.trim().split(/\s+/).length : 0) + " words - saved"; };
    ta.addEventListener("input", () => { st.notes = ta.value; count(); });
    const btn = (t, fn) => { const b = h("button", { type: "button", style: css({ padding: "2px 10px", cursor: "pointer" }) }, t); b.addEventListener("click", fn); return b; };
    const bar = h("div", { style: css({ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }) },
      btn("Clear", () => { ta.value = ""; st.notes = ""; count(); }),
      btn("Date", () => { ta.setRangeText(new Date().toLocaleString(), ta.selectionStart, ta.selectionEnd, "end"); st.notes = ta.value; count(); }),
      btn("Copy", () => { ta.select(); try { document.execCommand("copy"); } catch (e) {} }), info);
    count(); openWin("Notes", [bar, ta], () => api.save()); ta.focus();
  };

  const paint = () => {
    const cv = h("canvas", { width: 300, height: 200, style: css({ background: "#fff", border: "2px inset #fff", touchAction: "none", width: "100%", maxHeight: "190px" }) });
    const g = cv.getContext("2d"); g.lineCap = "round"; g.lineJoin = "round"; g.fillStyle = "#fff"; g.fillRect(0, 0, 300, 200);
    let col = "#222", size = 4, down = false, lx = 0, ly = 0, tool = "pen"; const undo = [];
    const snap = () => { undo.push(g.getImageData(0, 0, 300, 200)); if (undo.length > 20) undo.shift(); };
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
    const colour = () => (tool === "eraser" ? "#fff" : col);
    cv.addEventListener("pointerdown", e => { snap(); down = true; [lx, ly] = pos(e);
      if (tool === "fill") { fill(Math.floor(lx), Math.floor(ly), col); down = false; return; }
      g.fillStyle = colour(); g.beginPath(); g.arc(lx, ly, size / 2, 0, 7); g.fill(); cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", e => { if (!down) return; const [x, y] = pos(e); g.strokeStyle = colour(); g.lineWidth = size; g.beginPath(); g.moveTo(lx, ly); g.lineTo(x, y); g.stroke(); lx = x; ly = y; });
    const up = () => { down = false; }; cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    const fill = (x, y, hex) => {
      const img = g.getImageData(0, 0, 300, 200), d = img.data, w = 300, i0 = (y * w + x) * 4;
      const tr = d[i0], tg = d[i0 + 1], tb = d[i0 + 2], n = parseInt(hex.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
      if (tr === r && tg === gg && tb === b) return;
      const same = i => Math.abs(d[i] - tr) < 24 && Math.abs(d[i + 1] - tg) < 24 && Math.abs(d[i + 2] - tb) < 24, stack = [[x, y]];
      while (stack.length) { const [px, py] = stack.pop(); if (px < 0 || py < 0 || px >= 300 || py >= 200) continue; const i = (py * w + px) * 4; if (!same(i)) continue; d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255; stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]); }
      g.putImageData(img, 0, 0);
    };
    const cols = ["#222222", "#e03c3c", "#f28a2e", "#f6d43c", "#2fa953", "#3166e0", "#8c52d8", "#8b5a2b"];
    const mk = (t, fn) => { const b = h("button", { type: "button", style: css({ padding: "2px 8px", cursor: "pointer", font: "12px sans-serif" }) }, t); b.addEventListener("click", fn); return b; };
    const sw = h("div", { style: css({ display: "flex", gap: "4px", alignItems: "center", flexWrap: "wrap" }) },
      ...cols.map(c => { const b = h("button", { type: "button", style: css({ width: "20px", height: "20px", border: "2px outset #fff", background: c, cursor: "pointer", padding: 0 }) }); b.addEventListener("click", () => { col = c; if (tool === "eraser") tool = "pen"; }); return b; }));
    const tools = h("div", { style: css({ display: "flex", gap: "4px", alignItems: "center", flexWrap: "wrap" }) },
      mk("Pen", () => { tool = "pen"; }), mk("Eraser", () => { tool = "eraser"; }), mk("Fill", () => { tool = "fill"; }),
      mk("Undo", () => { const s0 = undo.pop(); if (s0) g.putImageData(s0, 0, 0); }),
      mk("Clear", () => { snap(); g.fillStyle = "#fff"; g.fillRect(0, 0, 300, 200); }),
      mk("Save", () => { const a = document.createElement("a"); a.download = "drawing.png"; a.href = cv.toDataURL("image/png"); a.click(); }),
      (() => { const r = h("input", { type: "range", min: 1, max: 24, value: 4, style: css({ width: "70px" }) }); r.addEventListener("input", () => { size = +r.value; }); return r; })());
    openWin("Paint", [tools, sw, cv]);
  };

  const calc = () => {
    let cur = "0", acc = null, op = null, fresh = true, hist = "";
    const disp = h("div", { style: css({ background: "#111", color: "#8ff0a4", font: "700 24px monospace", textAlign: "right", padding: "6px 8px", minHeight: "40px", overflow: "hidden" }) }, "0");
    const sub = h("div", { style: css({ font: "11px monospace", color: "#555", textAlign: "right", minHeight: "14px" }) }, "");
    const run = () => { const a = acc, b = parseFloat(cur); return op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : op === "/" ? (b === 0 ? NaN : a / b) : b; };
    const fmt = n => String(+Number(n).toPrecision(10));
    const show = () => { disp.textContent = cur.length > 12 ? Number(cur).toPrecision(8) : cur; sub.textContent = hist; };
    const press = k => {
      if (cur === "Error" && k !== "C") cur = "0";
      if (/^\d$|^\.$/.test(k)) { if (fresh) { cur = k === "." ? "0." : k; fresh = false; } else if (!(k === "." && cur.includes(".")) && cur.length < 14) cur += k; }
      else if (k === "C") { cur = "0"; acc = null; op = null; fresh = true; hist = ""; }
      else if (k === "<") { cur = cur.length > 1 && !fresh ? cur.slice(0, -1) : "0"; if (cur === "-") cur = "0"; }
      else if (k === "+-") { if (cur !== "0") cur = cur.startsWith("-") ? cur.slice(1) : "-" + cur; }
      else if (k === "%") { cur = fmt(parseFloat(cur) / 100); fresh = true; }
      else if (k === "sqrt") { const v = parseFloat(cur); cur = v < 0 ? "Error" : fmt(Math.sqrt(v)); fresh = true; }
      else if (k === "=") { if (op) { hist = fmt(acc) + " " + op.replace("*", "x") + " " + cur + " ="; cur = fmt(run()); acc = null; op = null; fresh = true; } }
      else { if (op && !fresh) cur = fmt(run()); acc = parseFloat(cur); op = k; hist = fmt(acc) + " " + k.replace("*", "x"); fresh = true; }
      if (cur === "NaN" || cur === "Infinity") cur = "Error"; show();
    };
    const keys = ["C", "<", "%", "/", "7", "8", "9", "*", "4", "5", "6", "-", "1", "2", "3", "+", "+-", "0", ".", "="];
    const grid = h("div", { style: css({ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px" }) },
      ...keys.map(k => { const b = h("button", { type: "button", style: css({ padding: "7px 0", font: "bold 15px sans-serif", cursor: "pointer", background: /^\d$|^\.$/.test(k) ? "#f2f2f2" : "#d4d0c8" }) }, k === "*" ? "\u00D7" : k === "/" ? "\u00F7" : k === "<" ? "\u232B" : k === "+-" ? "\u00B1" : k); b.addEventListener("click", () => press(k)); return b; }));
    const sq = h("button", { type: "button", style: css({ padding: "5px", cursor: "pointer", font: "bold 13px sans-serif" }) }, "Square root"); sq.addEventListener("click", () => press("sqrt"));
    const kh = e => { if (!win || !win.isConnected) { document.removeEventListener("keydown", kh, true); return; } const k = e.key; if (/^[\d.+\-*\/%]$/.test(k)) { e.preventDefault(); e.stopPropagation(); press(k); } else if (k === "Enter" || k === "=") { e.preventDefault(); e.stopPropagation(); press("="); } else if (k === "Backspace") { e.preventDefault(); press("<"); } else if (k === "Escape" || k.toLowerCase() === "c") { press("C"); } };
    document.addEventListener("keydown", kh, true);
    openWin("Calculator", [sub, disp, grid, sq], () => document.removeEventListener("keydown", kh, true));
  };

  const hist = []; let hpos = -1;
  const browser = (pg = "home", push = true) => {
    if (!PAGES[pg]) pg = "notfound";
    if (push) { hist.length = hpos + 1; hist.push(pg); hpos = hist.length - 1; }
    const [title, text, links] = PAGES[pg];
    const nb = (t, fn, dis) => { const b = h("button", { type: "button", style: css({ padding: "2px 8px", cursor: "pointer", font: "bold 12px sans-serif" }) }, t); if (dis) b.disabled = true; b.addEventListener("click", fn); return b; };
    const inp = h("input", { value: pg === "notfound" ? "" : pg, style: css({ flex: 1, minWidth: 0, border: "2px inset #fff", padding: "2px 6px", font: "12px monospace", userSelect: "text" }) });
    const go = () => { const q = inp.value.trim().toLowerCase().replace(/^blockhaven:\/\//, ""); browser(PAGES[q] ? q : (Object.keys(PAGES).find(k => PAGES[k][0].toLowerCase().includes(q) || PAGES[k][1].toLowerCase().includes(q)) || "notfound")); };
    inp.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
    const bar = h("div", { style: css({ display: "flex", gap: "4px", alignItems: "center" }) },
      nb("<", () => { if (hpos > 0) { hpos--; browser(hist[hpos], false); } }, hpos <= 0), nb(">", () => { if (hpos < hist.length - 1) { hpos++; browser(hist[hpos], false); } }, hpos >= hist.length - 1),
      nb("Home", () => browser("home")), inp, nb("Go", go));
    const content = h("div", { style: css({ flex: 1, background: "#fff", border: "2px inset #fff", padding: "10px", font: "14px/1.5 sans-serif", whiteSpace: "pre-wrap", userSelect: "text", overflow: "auto" }) }, h("div", { style: css({ font: "bold 18px sans-serif", marginBottom: "6px", color: "#1a3f7a" }) }, title), text);
    const nav = h("div", { style: css({ display: "flex", gap: "6px", flexWrap: "wrap" }) }, ...links.map(l => { const b = h("button", { type: "button", style: css({ padding: "3px 10px", cursor: "pointer", font: "bold 12px sans-serif", color: "#0000ee" }) }, PAGES[l][0]); b.addEventListener("click", () => { api.sound("click"); browser(l); }); return b; }));
    openWin("Browser", [bar, content, nav]);
  };

  const clockApp = () => {
    const big = h("div", { style: css({ font: "bold 34px monospace", textAlign: "center", color: "#1a3f7a" }) }, "");
    const date = h("div", { style: css({ textAlign: "center", font: "13px sans-serif" }) }, "");
    const sw = h("div", { style: css({ font: "bold 22px monospace", textAlign: "center" }) }, "00:00.0");
    let run = false, t0 = 0, acc = 0, iv = null;
    const upd = () => { const d = new Date(); big.textContent = d.toLocaleTimeString(); date.textContent = d.toDateString(); const ms = acc + (run ? Date.now() - t0 : 0); sw.textContent = String(Math.floor(ms / 60000)).padStart(2, "0") + ":" + String(Math.floor(ms / 1000) % 60).padStart(2, "0") + "." + Math.floor(ms / 100) % 10; };
    const mk = (t, fn) => { const b = h("button", { type: "button", style: css({ padding: "3px 12px", cursor: "pointer" }) }, t); b.addEventListener("click", fn); return b; };
    const row = h("div", { style: css({ display: "flex", gap: "6px", justifyContent: "center" }) },
      mk("Start / Stop", () => { if (run) { acc += Date.now() - t0; run = false; } else { t0 = Date.now(); run = true; } upd(); }), mk("Reset", () => { run = false; acc = 0; upd(); }));
    upd(); iv = setInterval(() => { if (!win || !win.isConnected) clearInterval(iv); else upd(); }, 100);
    openWin("Clock", [big, date, h("hr", {}), h("div", { style: css({ font: "bold 12px sans-serif" }) }, "Stopwatch"), sw, row], () => clearInterval(iv));
  };

  const settings = () => {
    const opts = WALLS.map(([n, bg], i) => { const b = h("button", { type: "button", style: css({ height: "54px", borderRadius: "8px", border: i === wall ? "3px solid #3166e0" : "2px solid #999", background: bg, color: "#fff", font: "700 12px sans-serif", textShadow: "0 1px 2px #000", cursor: "pointer" }) }, n); b.addEventListener("click", () => { wall = i; st.wall = i; api.save(); desktop(); settings(); }); return b; });
    openWin("Settings", [h("div", { style: css({ font: "bold 13px sans-serif" }) }, "Wallpaper"), h("div", { style: css({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }) }, ...opts), h("div", { style: css({ font: "11px sans-serif", color: "#666", marginTop: "8px" }) }, "Block OS 1.0 - Blockhaven")]);
  };

  api.modal({ title: "Computer", subtitle: "Block OS", wide: true, body, onClose: () => { clearInterval(tick); api.glow(null); } });
  api.glow("#8cc8ff", 2, { temp: true });
  api.sound("switch");
  boot();
};
