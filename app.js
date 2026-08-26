const BRANDS = {
  sushi: {
    name: 'Adrià Sushi',
    tone: 'Cercano, de barrio, confiable y apetitoso. Hablar como vecino, sin sonar corporativo.',
    CTA: 'Pide directo por la web o WhatsApp.'
  },
  sangucheria: {
    name: 'Sanguchería Adrià',
    tone: 'Fuente de soda chilena, familiar, abundante y simple. Antojo primero, explicación después.',
    CTA: 'Ven por tu sánguche o pide para llevar.'
  },
  pet: {
    name: 'Adrià PET',
    tone: 'Cuidado real, ingredientes naturales y transparencia. Cercano, práctico y sin exageraciones.',
    CTA: 'Conoce los snacks y escríbenos por Instagram.'
  },
  laberinto: {
    name: 'Laberinto Digital',
    tone: 'Claro, útil y orientado a resultados. Mostrar sistemas simples que una pyme sí puede implementar.',
    CTA: 'Escríbenos y revisamos qué automatizar primero.'
  }
};

const DEFAULT_POSTS = [
  {id: crypto.randomUUID(), brand:'sushi', status:'idea', date:todayISO(), time:'13:00', title:'El sushi del barrio', copy:'Mostrar una escena real del local y recordar por qué Adrià sigue siendo el sushi del barrio.', media:''},
  {id: crypto.randomUUID(), brand:'sangucheria', status:'idea', date:addDaysISO(1), time:'19:00', title:'Antojo de fuente de soda', copy:'Foto natural de un churrasco o completo. Texto corto, directo y con precio si hay promoción.', media:''},
  {id: crypto.randomUUID(), brand:'pet', status:'idea', date:addDaysISO(2), time:'12:00', title:'Snack natural de la semana', copy:'Explicar qué es, para qué mascota sirve y cómo entregarlo.', media:''}
];

const DEFAULT_LIBRARY = [
  {id:crypto.randomUUID(), date:'2024-06-01', brand:'sushi', text:'Un clásico de Adrià que vale la pena volver a mostrar.', url:'', likes:0, comments:0},
  {id:crypto.randomUUID(), date:'2025-03-15', brand:'sushi', text:'Detrás de cada roll hay años de barrio, cocina y clientes que vuelven.', url:'', likes:0, comments:0}
];

let state = loadState();
let currentSuggestion = null;

function todayISO(){ return new Date().toLocaleDateString('sv-SE'); }
function addDaysISO(days){ const d=new Date(); d.setDate(d.getDate()+days); return d.toLocaleDateString('sv-SE'); }
function loadState(){
  try {
    const parsed = JSON.parse(localStorage.getItem('laberinto-publicador-v1'));
    if(parsed?.posts && parsed?.library) return parsed;
  } catch(e){}
  return {posts:DEFAULT_POSTS, library:DEFAULT_LIBRARY};
}
function saveState(){ localStorage.setItem('laberinto-publicador-v1',JSON.stringify(state)); render(); }
function esc(s=''){ return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m])); }
function statusLabel(s){ return ({idea:'Idea',ready:'Lista',scheduled:'Programada',published:'Publicada'})[s] || s; }
function formatDate(date){ try{return new Intl.DateTimeFormat('es-CL',{day:'2-digit',month:'short'}).format(new Date(date+'T12:00:00'));}catch{return date;} }

function render(){ renderFilters(); renderStats(); renderPosts(); renderLibrary(); renderBrands(); renderRescue(); }
function renderFilters(){
  const options = `<option value="all">Todas las marcas</option>` + Object.entries(BRANDS).map(([k,b])=>`<option value="${k}">${b.name}</option>`).join('');
  const bf=document.querySelector('#brandFilter'); const pb=document.querySelector('#postBrand');
  if(bf&&!bf.dataset.ready){ bf.innerHTML=options; bf.dataset.ready='1'; }
  if(pb&&!pb.dataset.ready){ pb.innerHTML=Object.entries(BRANDS).map(([k,b])=>`<option value="${k}">${b.name}</option>`).join(''); pb.dataset.ready='1'; }
}
function renderStats(){
  const today=todayISO();
  document.querySelector('#todayCount').textContent=state.posts.filter(p=>p.date===today).length;
  document.querySelector('#scheduledCount').textContent=state.posts.filter(p=>p.status==='scheduled').length;
  document.querySelector('#libraryCount').textContent=state.library.length;
}
function renderPosts(){
  const brand=document.querySelector('#brandFilter').value || 'all';
  const status=document.querySelector('#statusFilter').value || 'all';
  const list=state.posts.filter(p=>(brand==='all'||p.brand===brand)&&(status==='all'||p.status===status)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  const el=document.querySelector('#postList');
  el.innerHTML=list.length?list.map(p=>`<article class="post-card" data-id="${p.id}"><div><div class="post-meta"><span>${esc(BRANDS[p.brand]?.name||p.brand)}</span><span>•</span><span>${formatDate(p.date)} · ${esc(p.time)}</span></div><div class="post-title">${esc(p.title)}</div><div class="post-copy">${esc(p.copy||'Sin texto todavía')}</div></div><span class="badge ${p.status}">${statusLabel(p.status)}</span></article>`).join(''):`<div class="empty">No hay publicaciones en este filtro.</div>`;
  el.querySelectorAll('.post-card').forEach(card=>card.addEventListener('click',()=>openEditor(card.dataset.id)));
}
function renderLibrary(){
  const el=document.querySelector('#libraryList');
  const list=[...state.library].sort((a,b)=>((b.likes+b.comments)-(a.likes+a.comments))).slice(0,8);
  el.innerHTML=list.length?list.map(i=>`<article class="library-card"><div class="library-meta"><span>${esc(BRANDS[i.brand]?.name||i.brand)}</span><span>•</span><span>${formatDate(i.date)}</span><span>•</span><span>${Number(i.likes||0)} me gusta · ${Number(i.comments||0)} comentarios</span></div><div class="post-copy">${esc(i.text||'Publicación histórica')}</div><div style="margin-top:10px"><button class="btn ghost reuse-btn" data-id="${i.id}">Reutilizar</button>${i.url?` <a class="btn secondary" href="${esc(i.url)}" target="_blank" rel="noopener">Ver original</a>`:''}</div></article>`).join(''):`<div class="empty">Importa el histórico para empezar a reutilizar publicaciones.</div>`;
  el.querySelectorAll('.reuse-btn').forEach(btn=>btn.addEventListener('click',()=>reuseItem(btn.dataset.id)));
}
function renderBrands(){
  const root=document.querySelector('#brandCards'); if(!root)return;
  root.innerHTML=Object.entries(BRANDS).map(([k,b])=>`<article class="brand-card"><h3>${b.name}</h3><p>${b.tone}</p><p style="margin-top:7px"><strong>CTA:</strong> ${b.CTA}</p></article>`).join('');
}
function shouldRescue(){
  const now=new Date(); const today=todayISO();
  const after1300=now.getHours()>13 || (now.getHours()===13 && now.getMinutes()>=0);
  const alreadyPublished=state.posts.some(p=>p.date===today && p.status==='published');
  return after1300 && !alreadyPublished && state.library.length>0;
}
function getSuggestion(){
  const candidates=state.library.filter(i=>{ const age=(Date.now()-new Date(i.date+'T12:00:00').getTime())/86400000; return age>60; });
  if(!candidates.length) return state.library[0] || null;
  const ranked=[...candidates].sort((a,b)=>((b.likes||0)+(b.comments||0)*3)-((a.likes||0)+(a.comments||0)*3));
  const top=ranked.slice(0,Math.min(10,ranked.length));
  return top[Math.floor(Math.random()*top.length)];
}
function renderRescue(){
  const panel=document.querySelector('#rescuePanel'); if(!panel)return;
  if(!shouldRescue()){
    panel.classList.add('hidden');
    document.querySelector('#rescueStatus').textContent='En orden';
    document.querySelector('#rescueText').textContent='Se activa después de las 13:00 si hoy no hay publicación marcada como publicada.';
    return;
  }
  panel.classList.remove('hidden');
  document.querySelector('#rescueStatus').textContent='Acción recomendada';
  document.querySelector('#rescueText').textContent='Hoy conviene reutilizar contenido antes que quedarse sin publicar.';
  if(!currentSuggestion) currentSuggestion=getSuggestion();
  const i=currentSuggestion;
  document.querySelector('#rescueSuggestion').innerHTML=i?`<div class="rescue-item"><div><div class="post-meta"><span>${esc(BRANDS[i.brand]?.name||i.brand)}</span><span>•</span><span>Original: ${formatDate(i.date)}</span></div><div class="post-title">${esc(i.text||'Contenido histórico')}</div><div class="post-copy">Recomendación: actualiza el gancho, cambia la primera frase y vuelve a publicarlo con una imagen o video vigente.</div></div><button id="reuseSuggestionBtn" class="btn primary">Preparar para hoy</button></div>`:'';
  document.querySelector('#reuseSuggestionBtn')?.addEventListener('click',()=>reuseItem(i.id));
}
function reuseItem(id){
  const item=state.library.find(i=>i.id===id); if(!item)return;
  const post={id:crypto.randomUUID(),brand:item.brand,status:'ready',date:todayISO(),time:'19:00',title:'Reutilizar publicación histórica',copy:`${item.text||''}\n\n[Actualizar gancho y CTA antes de publicar]`,media:item.url||''};
  state.posts.push(post); saveState(); openEditor(post.id);
}
function openEditor(id){
  const dialog=document.querySelector('#postDialog'); const p=state.posts.find(x=>x.id===id);
  document.querySelector('#dialogTitle').textContent=p?'Editar publicación':'Nueva publicación';
  document.querySelector('#postId').value=p?.id||'';
  document.querySelector('#postBrand').value=p?.brand||'sushi';
  document.querySelector('#postStatus').value=p?.status||'idea';
  document.querySelector('#postDate').value=p?.date||todayISO();
  document.querySelector('#postTime').value=p?.time||'13:00';
  document.querySelector('#postTitle').value=p?.title||'';
  document.querySelector('#postCopy').value=p?.copy||'';
  document.querySelector('#postMedia').value=p?.media||'';
  document.querySelector('#deletePostBtn').classList.toggle('hidden',!p);
  dialog.showModal();
}
function closeEditor(){ document.querySelector('#postDialog').close(); }
function parseCSV(text){
  const lines=text.replace(/\r/g,'').split('\n').filter(Boolean); if(lines.length<2)return [];
  const parseLine=line=>{const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q;}else if(c===','&&!q){out.push(cur);cur='';}else cur+=c;}out.push(cur);return out;};
  const headers=parseLine(lines[0]).map(h=>h.trim().toLowerCase());
  return lines.slice(1).map(line=>{const cols=parseLine(line);const o={};headers.forEach((h,i)=>o[h]=cols[i]??'');return o;});
}
function normalizeBrand(v=''){ const x=v.toLowerCase(); if(x.includes('sang'))return 'sangucheria'; if(x.includes('pet'))return 'pet'; if(x.includes('laber'))return 'laberinto'; return 'sushi'; }
function bind(){
  document.querySelector('#newPostBtn').addEventListener('click',()=>openEditor());
  document.querySelector('#closeDialog').addEventListener('click',closeEditor);
  document.querySelector('#cancelBtn').addEventListener('click',closeEditor);
  document.querySelector('#brandFilter').addEventListener('change',renderPosts);
  document.querySelector('#statusFilter').addEventListener('change',renderPosts);
  document.querySelector('#refreshSuggestionBtn').addEventListener('click',()=>{currentSuggestion=getSuggestion();renderRescue();});
  document.querySelector('#postForm').addEventListener('submit',e=>{e.preventDefault();const id=document.querySelector('#postId').value;const data={id:id||crypto.randomUUID(),brand:document.querySelector('#postBrand').value,status:document.querySelector('#postStatus').value,date:document.querySelector('#postDate').value,time:document.querySelector('#postTime').value,title:document.querySelector('#postTitle').value.trim(),copy:document.querySelector('#postCopy').value.trim(),media:document.querySelector('#postMedia').value.trim()};const idx=state.posts.findIndex(p=>p.id===id);if(idx>=0)state.posts[idx]=data;else state.posts.push(data);saveState();closeEditor();});
  document.querySelector('#deletePostBtn').addEventListener('click',()=>{const id=document.querySelector('#postId').value;if(!id)return;state.posts=state.posts.filter(p=>p.id!==id);saveState();closeEditor();});
  document.querySelector('#historyImport').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;const rows=parseCSV(await file.text());const imported=rows.map(r=>({id:crypto.randomUUID(),date:r.fecha||r.date||todayISO(),brand:normalizeBrand(r.marca||r.brand||''),text:r.texto||r.caption||r.text||'',url:r.url||r.link||'',likes:Number(r.likes||r.me_gusta||0)||0,comments:Number(r.comentarios||r.comments||0)||0}));state.library=[...imported,...state.library];saveState();e.target.value='';});
  document.querySelector('#exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`laberinto-publicador-${todayISO()}.json`;a.click();URL.revokeObjectURL(a.href);});
  document.querySelector('#importBackup').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const x=JSON.parse(await file.text());if(Array.isArray(x.posts)&&Array.isArray(x.library)){state=x;saveState();}}catch{alert('El respaldo no es válido.');}e.target.value='';});
}
render();bind();setInterval(renderRescue,60000);
