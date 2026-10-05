const CACHE='songmu-admin-v2';
const BASE='/songmu-booking/admin/';
const SHELL=[BASE,BASE+'index.html',BASE+'config.js',BASE+'xlsx.js',BASE+'manifest.webmanifest',BASE+'icon.svg',BASE+'icon-192-v2.png',BASE+'icon-512-v2.png',BASE+'icon-maskable-512-v2.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('songmu-admin-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(BASE))return;
 const recovery=url.searchParams.has('code')||url.searchParams.has('token')||url.searchParams.has('token_hash')||url.searchParams.has('access_token')||url.searchParams.has('error');
 if(recovery){event.respondWith(fetch(request).catch(()=>caches.match(BASE)));return}
 if(request.mode==='navigate'){
 event.respondWith(fetch(request).then(response=>{if(response.ok&&url.pathname===BASE&&!url.search)event.waitUntil(caches.open(CACHE).then(cache=>cache.put(BASE,response.clone())));return response}).catch(()=>caches.match(BASE)));
 return;
 }
 if(!SHELL.includes(url.pathname)||url.search)return;
 event.respondWith(fetch(request).then(response=>{if(response.ok)event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,response.clone())));return response}).catch(()=>caches.match(request)));
});
