const S = {
  index: null,
  toc: [],
  part: localStorage.getItem("pntt_part") || "part1",
  chapter: +(localStorage.getItem("pntt_chapter") || 1),
  font: +(localStorage.getItem("pntt_font") || 20),
  theme: localStorage.getItem("pntt_theme") || "dark"
};

const $ = id => document.getElementById(id);
const meta = () => S.index.parts.find(p => p.id === S.part) || S.index.parts[0];

const chapterUrl = (part, chapter) =>
  `./data/${part}/${String(chapter).padStart(4, "0")}.json`;

const tocUrl = part => `./data/toc-${part}.json`;

const clamp = n =>
  Math.max(1, Math.min(+n || 1, meta().chapters));

const esc = s =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

function renderText(text) {
  return text
    .split(/\n\s*\n/g)
    .map(p => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}


/* =========================================================
   THEME
========================================================= */

function setTheme(theme) {
  S.theme = theme;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("pntt_theme", theme);

  $("themeBtn").textContent =
    theme === "dark" ? "☀ Light" : "🌙 Dark";
}

function toggleTheme() {
  setTheme(S.theme === "dark" ? "light" : "dark");
}


/* =========================================================
   FONT
========================================================= */

function setFont(size) {
  S.font = Math.max(16, Math.min(size, 30));

  document.documentElement.style.setProperty(
    "--reader-size",
    `${S.font}px`
  );

  localStorage.setItem("pntt_font", S.font);
}


/* =========================================================
   STATE
========================================================= */

function save() {
  localStorage.setItem("pntt_part", S.part);
  localStorage.setItem("pntt_chapter", S.chapter);
  localStorage.setItem(`pntt_last_${S.part}`, S.chapter);
}


/* =========================================================
   TOC
========================================================= */

async function loadTOC() {
  const select = $("chapterSelect");

  select.disabled = true;
  select.innerHTML = "<option>Đang tải mục lục...</option>";

  const r = await fetch(tocUrl(S.part));
  if (!r.ok) throw Error(`Không tải được mục lục: HTTP ${r.status}`);

  S.toc = await r.json();

  select.innerHTML = S.toc
    .map(c => `<option value="${c.chapter}">${esc(c.title)}</option>`)
    .join("");

  select.disabled = false;
  select.value = S.chapter;
}


/* =========================================================
   CHAPTER
========================================================= */

async function loadChapter() {
  S.chapter = clamp(S.chapter);
  save();

  const m = meta();

  $("chapterInput").min = 1;
  $("chapterInput").max = m.chapters;
  $("chapterInput").value = S.chapter;

  $("chapterSelect").value = S.chapter;

  ["prevBtn", "prevBtnBottom"].forEach(
    id => $(id).disabled = S.chapter <= 1
  );

  ["nextBtn", "nextBtnBottom"].forEach(
    id => $(id).disabled = S.chapter >= m.chapters
  );

  $("statusText").textContent =
    `${m.name} · ${S.chapter}/${m.chapters}`;

  $("chapterTitle").textContent =
    `Đang tải chương ${S.chapter}…`;

  $("chapterContent").innerHTML = "";

  try {
    const r = await fetch(chapterUrl(S.part, S.chapter));
    if (!r.ok) throw Error(`HTTP ${r.status}`);

    const d = await r.json();

    $("chapterTitle").textContent =
      d.title || `Chương ${S.chapter}`;

    $("chapterContent").innerHTML =
      renderText(d.content || "");

    document.title =
      `${d.title || `Chương ${S.chapter}`} - PNTT`;

  } catch (e) {
    $("chapterTitle").textContent =
      `Không tải được chương ${S.chapter}`;

    $("chapterContent").innerHTML =
      `<p>${esc(e.message)}</p>`;
  }
}

function go(chapter) {
  S.chapter = clamp(chapter);
  window.scrollTo(0, 0);
  loadChapter();
}


/* =========================================================
   PART
========================================================= */

async function changePart(part) {
  S.part = part;

  S.chapter = +(
    localStorage.getItem(`pntt_last_${part}`) || 1
  );

  S.chapter = clamp(S.chapter);

  await loadTOC();
  await loadChapter();

  window.scrollTo(0, 0);
}


/* =========================================================
   OFFLINE
========================================================= */

async function cachePart() {
  if (!("caches" in window)) return;

  const btn = $("offlineBtn");
  const cache = await caches.open("pntt-reader-chapters-v3");

  btn.disabled = true;

  const queue = Array.from(
    { length: meta().chapters },
    (_, i) => i + 1
  );

  const total = queue.length;

  let done = 0;
  let added = 0;
  let existing = 0;
  let failed = 0;

  async function worker() {
    while (queue.length) {
      const chapter = queue.shift();
      const u = chapterUrl(S.part, chapter);

      try {
        if (await cache.match(u)) {
          existing++;
        } else {
          const r = await fetch(u);
          if (!r.ok) throw Error(r.status);

          await cache.put(u, r.clone());
          added++;
        }
      } catch {
        failed++;
      }

      done++;

      $("offlineStatus").textContent =
        `${done}/${total} · mới ${added} · đã có ${existing} · lỗi ${failed}`;
    }
  }

  await Promise.all(
    Array.from({ length: 8 }, () => worker())
  );

  $("offlineStatus").textContent =
    failed
      ? `Có ${failed} chương lỗi. Bấm lại để thử tiếp.`
      : `✓ Đã có đủ ${total} chương offline`;

  btn.disabled = false;
}


/* =========================================================
   INIT
========================================================= */

async function init() {
  setTheme(S.theme);
  setFont(S.font);

  const r = await fetch("./data/index.json");
  if (!r.ok) throw Error("Không tìm thấy data/index.json");

  S.index = await r.json();

  if (!S.index.parts.some(p => p.id === S.part))
    S.part = S.index.parts[0].id;

  $("partSelect").innerHTML = S.index.parts
    .map(p =>
      `<option value="${p.id}">${p.name} (${p.chapters} chương)</option>`
    )
    .join("");

  $("partSelect").value = S.part;

  S.chapter = clamp(S.chapter);

  await loadTOC();
  await loadChapter();


  $("partSelect").onchange =
    e => changePart(e.target.value);

  $("chapterSelect").onchange =
    e => go(e.target.value);

  $("goBtn").onclick =
    () => go($("chapterInput").value);

  $("chapterInput").onkeydown =
    e => e.key === "Enter" && go(e.target.value);

  ["prevBtn", "prevBtnBottom"].forEach(
    id => $(id).onclick = () => go(S.chapter - 1)
  );

  ["nextBtn", "nextBtnBottom"].forEach(
    id => $(id).onclick = () => go(S.chapter + 1)
  );

  $("fontDown").onclick = () => setFont(S.font - 1);
  $("fontUp").onclick = () => setFont(S.font + 1);
  $("themeBtn").onclick = toggleTheme;

  $("topBtn").onclick =
    () => window.scrollTo({ top: 0, behavior: "smooth" });

  $("offlineBtn").onclick = cachePart;


  window.addEventListener("keydown", e => {
    if (e.target.matches("input, select, textarea")) return;

    if (e.key === "ArrowLeft" && S.chapter > 1)
      go(S.chapter - 1);

    if (e.key === "ArrowRight" && S.chapter < meta().chapters)
      go(S.chapter + 1);
  });


  if ("serviceWorker" in navigator)
    navigator.serviceWorker.register("./sw.js").catch(console.error);
}

init().catch(e => {
  console.error(e);
  $("statusText").textContent = "Lỗi";
  $("chapterTitle").textContent = e.message;
});