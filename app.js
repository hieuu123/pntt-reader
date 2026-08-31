// ============================================================
// STATE
// ============================================================

const S = {

  index: null,

  toc: [],

  part:
    localStorage.getItem(
      "pntt_part"
    )
    || "part1",

  chapter:
    Number(
      localStorage.getItem(
        "pntt_chapter"
      )
      || 1
    ),

  font:
    Number(
      localStorage.getItem(
        "pntt_font"
      )
      || 20
    ),

};


// ============================================================
// DOM HELPER
// ============================================================

const $ = (id) =>
  document.getElementById(id);


// ============================================================
// PART META
// ============================================================

function meta() {

  return (
    S.index.parts.find(
      p => p.id === S.part
    )
    ||
    S.index.parts[0]
  );

}


// ============================================================
// URLS
// ============================================================

function chapterUrl(
  part,
  chapter
) {

  return (
    `./data/${part}/`
    + `${String(chapter).padStart(4, "0")}.json`
  );

}


function tocUrl(part) {

  return (
    `./data/toc-${part}.json`
  );

}


// ============================================================
// CHAPTER LIMIT
// ============================================================

function clampChapter(n) {

  const max = meta().chapters;

  return Math.max(
    1,
    Math.min(
      Number(n) || 1,
      max
    )
  );

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    );

}


// ============================================================
// CONTENT -> HTML
// ============================================================

function renderText(text) {

  return text

    .split(
      /\n\s*\n/g
    )

    .map(
      paragraph => {

        const safe = escapeHtml(
          paragraph
        ).replace(
          /\n/g,
          "<br>"
        );

        return (
          `<p>${safe}</p>`
        );

      }
    )

    .join("");

}


// ============================================================
// FONT
// ============================================================

function setFont(size) {

  S.font = Math.max(
    16,
    Math.min(
      size,
      30
    )
  );

  document.documentElement
    .style
    .setProperty(
      "--reader-size",
      `${S.font}px`
    );

  localStorage.setItem(
    "pntt_font",
    S.font
  );

}


// ============================================================
// SAVE STATE
// ============================================================

function saveState() {

  localStorage.setItem(
    "pntt_part",
    S.part
  );

  localStorage.setItem(
    "pntt_chapter",
    S.chapter
  );

  localStorage.setItem(
    `pntt_last_${S.part}`,
    S.chapter
  );

}


// ============================================================
// PART SELECT
// ============================================================

function renderPartSelect() {

  const select = $(
    "partSelect"
  );

  select.innerHTML = "";

  for (
    const part
    of S.index.parts
  ) {

    const option =
      document.createElement(
        "option"
      );

    option.value =
      part.id;

    option.textContent =
      `${part.name} (${part.chapters} chương)`;

    select.appendChild(
      option
    );

  }

  select.value =
    S.part;

}


// ============================================================
// LOAD TOC
// ============================================================

async function loadTOC() {

  const select = $(
    "chapterSelect"
  );

  select.disabled = true;

  select.innerHTML = "";

  const loading =
    document.createElement(
      "option"
    );

  loading.textContent =
    "Đang tải danh sách chương...";

  select.appendChild(
    loading
  );


  const response =
    await fetch(
      tocUrl(S.part)
    );


  if (!response.ok) {

    throw new Error(
      `Không tải được mục lục: HTTP ${response.status}`
    );

  }


  S.toc =
    await response.json();


  renderTOC();

}


// ============================================================
// RENDER TOC
// ============================================================

function renderTOC() {

  const select = $(
    "chapterSelect"
  );

  select.innerHTML = "";


  const fragment =
    document.createDocumentFragment();


  for (
    const item
    of S.toc
  ) {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      item.chapter;


    option.textContent =
      item.title;


    fragment.appendChild(
      option
    );

  }


  select.appendChild(
    fragment
  );


  select.disabled = false;


  syncChapterSelect();

}


// ============================================================
// SYNC DROPDOWN
// ============================================================

function syncChapterSelect() {

  const select = $(
    "chapterSelect"
  );

  if (!select) {
    return;
  }

  select.value =
    String(S.chapter);

}


// ============================================================
// LOAD CHAPTER
// ============================================================

async function loadChapter() {

  S.chapter =
    clampChapter(
      S.chapter
    );


  saveState();


  const currentMeta =
    meta();


  // ----------------------------------------------------------
  // INPUT
  // ----------------------------------------------------------

  $("chapterInput").min =
    1;

  $("chapterInput").max =
    currentMeta.chapters;

  $("chapterInput").value =
    S.chapter;


  // ----------------------------------------------------------
  // TOC
  // ----------------------------------------------------------

  syncChapterSelect();


  // ----------------------------------------------------------
  // NAV BUTTON
  // ----------------------------------------------------------

  const isFirst =
    S.chapter <= 1;

  const isLast =
    S.chapter
    >= currentMeta.chapters;


  for (
    const id
    of [
      "prevBtn",
      "prevBtnBottom"
    ]
  ) {

    $(id).disabled =
      isFirst;

  }


  for (
    const id
    of [
      "nextBtn",
      "nextBtnBottom"
    ]
  ) {

    $(id).disabled =
      isLast;

  }


  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  $("statusText")
    .textContent =
      `${currentMeta.name}`
      + ` · ${S.chapter}`
      + `/${currentMeta.chapters}`;


  $("chapterTitle")
    .textContent =
      `Đang tải chương ${S.chapter}…`;


  $("chapterContent")
    .innerHTML = "";


  // ----------------------------------------------------------
  // REQUEST
  // ----------------------------------------------------------

  try {

    const response =
      await fetch(
        chapterUrl(
          S.part,
          S.chapter
        )
      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    $("chapterTitle")
      .textContent =
        data.title
        ||
        `Chương ${S.chapter}`;


    $("chapterContent")
      .innerHTML =
        renderText(
          data.content || ""
        );


    document.title =
      (
        data.title
        ||
        `Chương ${S.chapter}`
      )
      + " - PNTT";


  } catch (error) {

    $("chapterTitle")
      .textContent =
        `Không tải được chương ${S.chapter}`;


    $("chapterContent")
      .innerHTML =
        `
        <p>
          ${escapeHtml(error.message)}
        </p>

        <p>
          Nếu đang offline,
          chương này có thể chưa được
          tải về thiết bị.
        </p>
        `;

  }

}


// ============================================================
// GO TO CHAPTER
// ============================================================

function go(chapter) {

  S.chapter =
    clampChapter(
      chapter
    );


  window.scrollTo(
    0,
    0
  );


  loadChapter();

}


// ============================================================
// CHANGE PART
// ============================================================

async function changePart(
  part
) {

  S.part =
    part;


  // ----------------------------------------------------------
  // Remember last chapter of each part
  // ----------------------------------------------------------

  S.chapter =
    Number(
      localStorage.getItem(
        `pntt_last_${S.part}`
      )
      || 1
    );


  S.chapter =
    clampChapter(
      S.chapter
    );


  saveState();


  window.scrollTo(
    0,
    0
  );


  // ----------------------------------------------------------
  // New TOC
  // ----------------------------------------------------------

  await loadTOC();


  // ----------------------------------------------------------
  // Chapter
  // ----------------------------------------------------------

  await loadChapter();

}


// ============================================================
// CACHE CURRENT PART OFFLINE
// ============================================================

async function cachePart() {

  if (
    !(
      "caches"
      in window
    )
  ) {

    $("offlineStatus")
      .textContent =
        "Browser không hỗ trợ cache.";

    return;

  }


  const button =
    $("offlineBtn");


  button.disabled =
    true;


  const cache =
    await caches.open(
      "pntt-reader-chapters-v2"
    );


  const total =
    meta().chapters;


  const queue =
    Array.from(
      {
        length: total
      },
      (_, i) => i + 1
    );


  let done = 0;

  let success = 0;

  let existing = 0;

  let failed = 0;


  const concurrency =
    8;


  async function worker() {

    while (
      queue.length
    ) {

      const chapter =
        queue.shift();


      const chapterURL =
        chapterUrl(
          S.part,
          chapter
        );


      try {

        const cached =
          await cache.match(
            chapterURL
          );


        if (cached) {

          existing++;

        } else {

          const response =
            await fetch(
              chapterURL
            );


          if (!response.ok) {

            throw new Error(
              `HTTP ${response.status}`
            );

          }


          await cache.put(
            chapterURL,
            response.clone()
          );


          success++;

        }


      } catch (error) {

        failed++;


        console.error(
          `Chapter ${chapter}`,
          error
        );

      }


      done++;


      $("offlineStatus")
        .textContent =
          `Đang xử lý ${done}/${total}`
          + ` · mới ${success}`
          + ` · đã có ${existing}`
          + ` · lỗi ${failed}`;

    }

  }


  await Promise.all(

    Array.from(
      {
        length: concurrency
      },
      () => worker()
    )

  );


  if (
    failed === 0
  ) {

    $("offlineStatus")
      .textContent =
        `✓ Đã có đủ ${total} chương offline`;

  } else {

    $("offlineStatus")
      .textContent =
        `Có ${failed} chương lỗi. `
        + `Bấm lại để thử lại.`;

  }


  button.disabled =
    false;

}


// ============================================================
// INIT
// ============================================================

async function init() {

  // ----------------------------------------------------------
  // FONT
  // ----------------------------------------------------------

  setFont(
    S.font
  );


  // ----------------------------------------------------------
  // LOAD INDEX
  // ----------------------------------------------------------

  const response =
    await fetch(
      "./data/index.json"
    );


  if (!response.ok) {

    throw new Error(
      "Không tìm thấy data/index.json"
    );

  }


  S.index =
    await response.json();


  // ----------------------------------------------------------
  // Validate saved part
  // ----------------------------------------------------------

  if (
    !S.index.parts.some(
      p => p.id === S.part
    )
  ) {

    S.part =
      S.index.parts[0].id;

  }


  // ----------------------------------------------------------
  // PART UI
  // ----------------------------------------------------------

  renderPartSelect();


  // ----------------------------------------------------------
  // CHAPTER
  // ----------------------------------------------------------

  S.chapter =
    clampChapter(
      S.chapter
    );


  // ----------------------------------------------------------
  // TOC
  // ----------------------------------------------------------

  await loadTOC();


  // ----------------------------------------------------------
  // CHAPTER DATA
  // ----------------------------------------------------------

  await loadChapter();


  // ==========================================================
  // EVENTS
  // ==========================================================


  // ----------------------------------------------------------
  // PART
  // ----------------------------------------------------------

  $("partSelect")
    .addEventListener(
      "change",
      async event => {

        await changePart(
          event.target.value
        );

      }
    );


  // ----------------------------------------------------------
  // TOC SELECT
  // ----------------------------------------------------------

  $("chapterSelect")
    .addEventListener(
      "change",
      event => {

        go(
          Number(
            event.target.value
          )
        );

      }
    );


  // ----------------------------------------------------------
  // GO BUTTON
  // ----------------------------------------------------------

  $("goBtn")
    .addEventListener(
      "click",
      () => {

        go(
          $("chapterInput").value
        );

      }
    );


  // ----------------------------------------------------------
  // ENTER ON NUMBER INPUT
  // ----------------------------------------------------------

  $("chapterInput")
    .addEventListener(
      "keydown",
      event => {

        if (
          event.key
          === "Enter"
        ) {

          go(
            event.target.value
          );

        }

      }
    );


  // ----------------------------------------------------------
  // PREVIOUS
  // ----------------------------------------------------------

  for (
    const id
    of [
      "prevBtn",
      "prevBtnBottom"
    ]
  ) {

    $(id)
      .addEventListener(
        "click",
        () => {

          go(
            S.chapter - 1
          );

        }
      );

  }


  // ----------------------------------------------------------
  // NEXT
  // ----------------------------------------------------------

  for (
    const id
    of [
      "nextBtn",
      "nextBtnBottom"
    ]
  ) {

    $(id)
      .addEventListener(
        "click",
        () => {

          go(
            S.chapter + 1
          );

        }
      );

  }


  // ----------------------------------------------------------
  // FONT
  // ----------------------------------------------------------

  $("fontDown")
    .addEventListener(
      "click",
      () => {

        setFont(
          S.font - 1
        );

      }
    );


  $("fontUp")
    .addEventListener(
      "click",
      () => {

        setFont(
          S.font + 1
        );

      }
    );


  // ----------------------------------------------------------
  // TOP
  // ----------------------------------------------------------

  $("topBtn")
    .addEventListener(
      "click",
      () => {

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      }
    );


  // ----------------------------------------------------------
  // OFFLINE
  // ----------------------------------------------------------

  $("offlineBtn")
    .addEventListener(
      "click",
      cachePart
    );


  // ----------------------------------------------------------
  // KEYBOARD
  //
  // Left  -> previous
  // Right -> next
  // ----------------------------------------------------------

  window.addEventListener(
    "keydown",
    event => {

      if (
        event.target.matches(
          "input, select, textarea"
        )
      ) {

        return;

      }


      if (
        event.key
        === "ArrowLeft"
        &&
        S.chapter > 1
      ) {

        go(
          S.chapter - 1
        );

      }


      if (
        event.key
        === "ArrowRight"
        &&
        S.chapter
        < meta().chapters
      ) {

        go(
          S.chapter + 1
        );

      }

    }
  );


  // ----------------------------------------------------------
  // SERVICE WORKER
  // ----------------------------------------------------------

  if (
    "serviceWorker"
    in navigator
  ) {

    navigator
      .serviceWorker
      .register(
        "./sw.js"
      )
      .catch(
        error => {

          console.error(
            "Service Worker:",
            error
          );

        }
      );

  }

}


// ============================================================
// START
// ============================================================

init()

  .catch(
    error => {

      console.error(
        error
      );


      $("statusText")
        .textContent =
          "Lỗi khởi tạo";


      $("chapterTitle")
        .textContent =
          "Không mở được reader";


      $("chapterContent")
        .innerHTML =
          `<p>${escapeHtml(error.message)}</p>`;

    }
  );
