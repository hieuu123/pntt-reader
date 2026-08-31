const S={index:null,part:localStorage.getItem("pntt_part")||"part1",chapter:+(localStorage.getItem("pntt_chapter")||1),font:+(localStorage.getItem("pntt_font")||20)};
const $=id=>document.getElementById(id);
const meta=()=>S.index.parts.find(p=>p.id===S.part)||S.index.parts[0];
const url=(p,c)=>`./data/${p}/${String(c).padStart(4,"0")}.json`;
const clamp=n=>Math.max(1,Math.min(+n||1,meta().chapters));
const esc=s=>String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
function setFont(n){S.font=Math.max(16,Math.min(n,30));document.documentElement.style.setProperty("--reader-size",S.font+"px");localStorage.setItem("pntt_font",S.font)}
function save(){localStorage.setItem("pntt_part",S.part);localStorage.setItem("pntt_chapter",S.chapter);localStorage.setItem("pntt_last_"+S.part,S.chapter)}
function renderText(t){return t.split(/\n\s*\n/g).map(p=>`<p>${esc(p).replace(/\n/g,"<br>")}</p>`).join("")}
async function load(){
  S.chapter=clamp(S.chapter);save();
  $("chapterInput").min=1;$("chapterInput").max=meta().chapters;$("chapterInput").value=S.chapter;
  ["prevBtn","prevBtnBottom"].forEach(id=>$(id).disabled=S.chapter<=1);
  ["nextBtn","nextBtnBottom"].forEach(id=>$(id).disabled=S.chapter>=meta().chapters);
  $("statusText").textContent=`${meta().name} · ${S.chapter}/${meta().chapters}`;
  $("chapterTitle").textContent=`Đang tải chương ${S.chapter}…`;
  $("chapterContent").innerHTML="";
  try{
    const r=await fetch(url(S.part,S.chapter));if(!r.ok)throw Error("HTTP "+r.status);
    const d=await r.json();
    $("chapterTitle").textContent=d.title||`Chương ${S.chapter}`;
    $("chapterContent").innerHTML=renderText(d.content||"");
    document.title=(d.title||`Chương ${S.chapter}`)+" - PNTT";
  }catch(e){
    $("chapterTitle").textContent=`Không tải được chương ${S.chapter}`;
    $("chapterContent").innerHTML=`<p>${esc(e.message)}</p><p>Nếu đang offline, chương này có thể chưa được tải về thiết bị.</p>`;
  }
}
function go(n){S.chapter=clamp(n);window.scrollTo(0,0);load()}
async function cachePart(){
  if(!("caches" in window)){ $("offlineStatus").textContent="Browser không hỗ trợ cache."; return; }
  const b=$("offlineBtn");b.disabled=true;
  const cache=await caches.open("pntt-reader-chapters-v1");
  const q=Array.from({length:meta().chapters},(_,i)=>i+1);let done=0,total=q.length;
  async function worker(){
    while(q.length){
      const c=q.shift(),u=url(S.part,c);
      try{if(!(await cache.match(u))){const r=await fetch(u);if(r.ok)await cache.put(u,r.clone())}}catch(_){}
      done++;$("offlineStatus").textContent=`Đang tải offline: ${done}/${total}`;
    }
  }
  await Promise.all(Array.from({length:8},worker));
  $("offlineStatus").textContent=`Đã xử lý ${total} chương.`;b.disabled=false;
}
async function init(){
  setFont(S.font);
  const r=await fetch("./data/index.json");if(!r.ok)throw Error("Không tìm thấy data/index.json");
  S.index=await r.json();
  $("partSelect").innerHTML=S.index.parts.map(p=>`<option value="${p.id}">${p.name} (${p.chapters} chương)</option>`).join("");
  if(!S.index.parts.some(p=>p.id===S.part))S.part=S.index.parts[0].id;
  $("partSelect").value=S.part;S.chapter=clamp(S.chapter);await load();
  $("partSelect").onchange=e=>{S.part=e.target.value;S.chapter=+(localStorage.getItem("pntt_last_"+S.part)||1);window.scrollTo(0,0);load()};
  $("goBtn").onclick=()=>go($("chapterInput").value);
  $("chapterInput").onkeydown=e=>{if(e.key==="Enter")go(e.target.value)};
  ["prevBtn","prevBtnBottom"].forEach(id=>$(id).onclick=()=>go(S.chapter-1));
  ["nextBtn","nextBtnBottom"].forEach(id=>$(id).onclick=()=>go(S.chapter+1));
  $("fontDown").onclick=()=>setFont(S.font-1);$("fontUp").onclick=()=>setFont(S.font+1);
  $("topBtn").onclick=()=>window.scrollTo({top:0,behavior:"smooth"});
  $("offlineBtn").onclick=cachePart;
  if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
}
init().catch(e=>{$("statusText").textContent="Lỗi";$("chapterTitle").textContent=e.message});
