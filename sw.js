// SemillApp: guarda la "cáscara" de la app para que abra rápido y sin señal. Los datos siempre vienen en vivo.
const CACHE="semillapp-v7";
const SHELL=["./","index.html","style.css","app.js","config.js","manifest.webmanifest","icon-192.png","icon-512.png","favicon.svg"];
self.addEventListener("install",e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin) return; // Supabase, fuentes y CDN van directo a internet
  e.respondWith(fetch(e.request).then(r=>{ const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r; }).catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html"))));
});
