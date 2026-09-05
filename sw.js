// v88 - HTML은 캐시 무시하고 항상 새로 받기(no-store) → 그냥 새로고침만 해도 최신
const CACHE = 'gstory-v88';
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil((async function(){
    var keys = await caches.keys();
    await Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;                 // 저장(PATCH) 등은 건드리지 않음
  if(req.url.indexOf('supabase') !== -1) return;    // 서버 동기화는 항상 네트워크 직결
  if(req.mode === 'navigate' || req.destination === 'document'){
    // HTML은 캐시를 완전히 무시하고 네트워크에서 직접 → 새로고침만 해도 최신. 실패(오프라인) 시에만 캐시.
    e.respondWith((async function(){
      try{
        var fresh = await fetch(req, { cache: 'no-store' });
        var c = await caches.open(CACHE);
        c.put(req, fresh.clone());
        return fresh;
      }catch(_){
        var cached = await caches.match(req);
        return cached || Response.error();
      }
    })());
  }
});
