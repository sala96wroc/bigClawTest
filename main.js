const DB_NAME='travelDiaryDB';
const STORE='entries';
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=e=>{const db=e.target.result;if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:'id'});};req.onsuccess=e=>resolve(e.target.result);req.onerror=e=>reject(e.target.error);});}
async function getAll(){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).getAll();req.onsuccess=()=>res(req.result);req.onerror=e=>rej(e);});}
async function deleteEntry(id){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>res();tx.onerror=e=>rej(e);});}
function emptySVG(){return 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#eef2f7"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="20">No cover</text></svg>');}
function fmtDate(ts){const d=new Date(ts);return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});} 
function fmtRange(start,end){if(!start) return '';const s=new Date(start).toLocaleDateString(undefined,{month:'short',day:'numeric'});if(!end) return s;const e=new Date(end).toLocaleDateString(undefined,{month:'short',day:'numeric'});return `${s} → ${e}`;}
const timelineEl=document.getElementById('timeline');
const emptyStateEl=document.getElementById('emptyState');
const searchInput=document.getElementById('searchInput');
const sortSelect=document.getElementById('sortSelect');
let allItems=[];
function sortItems(items){const mode=sortSelect.value;if(mode==='oldest') return items.sort((a,b)=>a.created-b.created);if(mode==='az') return items.sort((a,b)=>(a.title||a.placeLabel||'').localeCompare(b.title||b.placeLabel||''));return items.sort((a,b)=>b.created-a.created);} 
function filterItems(items){const q=searchInput.value.trim().toLowerCase();if(!q) return items;return items.filter(it=>[it.title,it.placeLabel,it.notes,it.location?.name,it.startDate,it.endDate].filter(Boolean).join(' ').toLowerCase().includes(q));}
function render(items){timelineEl.innerHTML='';
  // No trips at all in DB
  if(!allItems || allItems.length===0){
    emptyStateEl.style.display='block';
    emptyStateEl.innerHTML = '<strong>No trips yet</strong><div style="color:var(--muted);margin-bottom:14px">Create your first trip and start building your timeline.</div><a class="add-btn" href="trip.html">Create first trip</a>';
    return;
  }

  // There are trips, but no search results
  if(items.length===0){
    emptyStateEl.style.display='block';
    emptyStateEl.innerHTML = `<strong>No results found</strong><div style="color:var(--muted);margin-bottom:14px">We couldn't find any trips that match "${(searchInput.value||'').trim()}".</div><a class="add-btn" href="trip.html">Create a trip</a>`;
    return;
  }

  // Otherwise render found items
  emptyStateEl.style.display='none';
  for(const it of items){
    const mapThumb=it.location?`<div class="map-thumb"><iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.openstreetmap.org/export/embed.html?bbox=${it.location.lng-0.01}%2C${it.location.lat-0.01}%2C${it.location.lng+0.01}%2C${it.location.lat+0.01}&layer=mapnik&marker=${it.location.lat}%2C${it.location.lng}"></iframe></div>`:'';
    const row=document.createElement('div');
    row.className='trip-row';
    row.innerHTML=`<div class="trip-date">${fmtDate(it.created)}</div><div class="trip-track"><div class="dot"></div></div><article class="trip-card"><img class="trip-cover" src="${it.photo||emptySVG()}" alt="${(it.title||it.placeLabel||'Trip').replace(/"/g,'&quot;')}"><div class="trip-body"><h3>${it.title||'Untitled trip'}</h3><div class="trip-meta">${it.placeLabel?`<span class="chip">${it.placeLabel}</span>`:''}${it.location?.name?`<span class="chip">📍 ${it.location.name}</span>`:''}${it.startDate?`<span class="chip">🗓 ${fmtRange(it.startDate,it.endDate)}</span>`:''}${it.durationDays?`<span class="chip">⏳ ${it.durationDays} day${it.durationDays===1?'':'s'}</span>`:''}</div><p>${it.notes&&it.notes.trim()?it.notes:'No description yet.'}</p>${mapThumb}<div class="trip-actions"><a class="btn btn-primary" href="detail.html?id=${it.id}">Open trip</a><a class="btn btn-secondary" href="trip.html?id=${it.id}">Edit</a><button class="btn btn-danger" data-delete="${it.id}">Delete</button></div></div></article>`;
    timelineEl.appendChild(row);
  }
  timelineEl.querySelectorAll('[data-delete]').forEach(btn=>btn.addEventListener('click',async()=>{if(confirm('Delete this trip?')){await deleteEntry(btn.dataset.delete);init();}}));
}
async function init(){allItems=await getAll();let items=filterItems([...allItems]);items=sortItems(items);render(items);} 
searchInput.addEventListener('input',init);sortSelect.addEventListener('change',init);init();
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').catch(()=>{});}