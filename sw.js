const SHELL="pntt-shell-v1",CH="pntt-reader-chapters-v1";
self.addEventListener("install",e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(["./","./index.html","./style.css","./app.js","./manifest.webmanifest","./data/index.json"])));self.skipWaiting()});
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url),isCh=/\/data\/part[12]\/\d{4}\.json$/.test(u.pathname);
 if(isCh){e.respondWith(caches.open(CH).then(async c=>{const hit=await c.match(e.request);if(hit)return hit;const r=await fetch(e.request);if(r.ok)c.put(e.request,r.clone());return r}));return}
 e.respondWith(caches.match(e.request).then(x=>x||fetch(e.request)));
});
