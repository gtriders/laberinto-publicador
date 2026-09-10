(() => {
  const API='https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/laberinto-api';
  const PIN_KEY='laberinto_session_pin';
  const editableStatuses=new Set(['scheduled','draft','ready','failed']);
  const brandNames={'adria-sushi':'ADRIÀ SUSHI','adria-sangucheria':'SANGUCHERÍA ADRIÀ','pet':'ADRIÀ PET','chef-rafael':'CHEF RAFAEL','laberinto-digital':'LABERINTO DIGITAL'};
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const labelStatus=s=>({scheduled:'Programada',publishing:'Publicando',failed:'Error',draft:'Borrador',ready:'Lista'}[s]||s);
  const brandLabel=id=>brandNames[id]||String(id||'CUENTA').replace(/-/g,' ').toUpperCase();
  const getPin=()=>sessionStorage.getItem(PIN_KEY)||'';
  const api=async body=>{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,pin:getPin()})});const d=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(d.error||'Error de conexión');e.detail=d.detail||'';throw e;}return d;};
  const toLocalInput=iso=>{if(!iso)return'';const d=new Date(iso);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};

  const css=document.createElement('style');
  css.textContent=`
    .queue-edit-actions{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:wrap}.queue-edit-btn{padding:7px 10px;border-radius:9px;border:1px solid #e5e5e0;background:#fff;font-weight:700;cursor:pointer}.queue-edit-btn:hover{background:#f7f7f4}.queue-item.queue-editable{grid-template-columns:52px 1fr auto}.queue-right{display:grid;gap:6px;justify-items:end}.queue-brand{display:inline-flex;align-items:center;width:max-content;max-width:100%;margin:0 0 4px;padding:3px 7px;border-radius:999px;background:#f2eee7;color:#5d5141;font-size:10px;line-height:1.2;font-weight:850;letter-spacing:.055em}.queue-edit-dialog{border:0;border-radius:16px;padding:0;width:min(680px,calc(100vw - 28px));box-shadow:0 28px 80px rgba(0,0,0,.22)}.queue-edit-dialog::backdrop{background:rgba(17,24,39,.5)}.queue-edit-form{padding:22px;display:grid;gap:12px}.queue-edit-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.queue-edit-form label{display:grid;gap:6px;font-weight:700;font-size:13px}.queue-edit-form input,.queue-edit-form textarea{width:100%;border:1px solid #e5e5e0;border-radius:10px;padding:10px;background:#fff}.queue-edit-form textarea{min-height:180px;resize:vertical}.queue-edit-footer{display:flex;gap:8px;justify-content:flex-end;align-items:center;flex-wrap:wrap}.queue-edit-msg{margin-right:auto;font-size:13px;color:#777}.queue-edit-msg.error{color:#a33232}.queue-edit-thumb{display:flex;gap:8px;align-items:center}.queue-edit-thumb img{width:54px;height:54px;object-fit:cover;border-radius:9px}.queue-edit-meta{font-size:12px;color:#777}@media(max-width:780px){.queue-item.queue-editable{grid-template-columns:46px 1fr}.queue-right{grid-column:2;justify-items:start}.queue-edit-footer{justify-content:stretch}.queue-edit-footer .btn{flex:1}.queue-edit-msg{flex-basis:100%}.queue-brand{font-size:9px;padding:3px 6px;margin-bottom:3px}}
  `;
  document.head.appendChild(css);

  const dialog=document.createElement('dialog');
  dialog.className='queue-edit-dialog';
  dialog.innerHTML=`<form class="queue-edit-form" method="dialog"><input id="queueEditId" type="hidden"><div class="queue-edit-head"><div><span class="eyebrow">PUBLICACIÓN PENDIENTE</span><h2 style="margin:4px 0 0">Editar publicación</h2></div><button id="queueEditClose" type="button" class="icon-btn">×</button></div><div id="queueEditPreview" class="queue-edit-thumb"></div><label>Título<input id="queueEditTitle" type="text" maxlength="120"></label><label>Copy<textarea id="queueEditCaption"></textarea></label><label>Fecha y hora<input id="queueEditSchedule" type="datetime-local" required></label><div class="queue-edit-footer"><span id="queueEditMsg" class="queue-edit-msg"></span><button id="queueEditCancel" type="button" class="btn secondary">Cancelar</button><button id="queueEditAI" type="button" class="btn secondary">Actualizar con IA</button><button id="queueEditSave" type="button" class="btn primary">Guardar cambios</button></div></form>`;
  document.body.appendChild(dialog);

  let cache=new Map();
  function openEditor(id){
    const item=cache.get(id);if(!item)return;
    if(!editableStatuses.has(item.status)){alert('Esta publicación ya está en proceso y no se puede editar.');return;}
    document.querySelector('#queueEditId').value=item.id;
    document.querySelector('#queueEditTitle').value=item.title||'';
    document.querySelector('#queueEditCaption').value=item.caption||'';
    document.querySelector('#queueEditSchedule').value=toLocalInput(item.scheduled_at);
    const count=Array.isArray(item.media_items)&&item.media_items.length?item.media_items.length:1;
    document.querySelector('#queueEditPreview').innerHTML=`<img src="${esc(item.media_url||'')}" alt=""><div><span class="queue-brand">${esc(brandLabel(item.brand_id))}</span><div class="queue-edit-meta">${count>1?`Carrusel · ${count} fotos`:'1 foto'}</div><div class="queue-edit-meta">Las fotos no cambian desde este editor.</div></div>`;
    const msg=document.querySelector('#queueEditMsg');msg.textContent='';msg.className='queue-edit-msg';
    dialog.showModal();
  }

  async function save(){
    const id=document.querySelector('#queueEditId').value,caption=document.querySelector('#queueEditCaption').value.trim(),title=document.querySelector('#queueEditTitle').value.trim(),dt=document.querySelector('#queueEditSchedule').value,msg=document.querySelector('#queueEditMsg'),btn=document.querySelector('#queueEditSave');
    if(!caption){msg.textContent='El copy no puede quedar vacío.';msg.className='queue-edit-msg error';return;}
    if(!dt||Number.isNaN(new Date(dt).getTime())){msg.textContent='Elige una fecha y hora válidas.';msg.className='queue-edit-msg error';return;}
    if(new Date(dt).getTime()<=Date.now()){msg.textContent='La fecha debe estar en el futuro.';msg.className='queue-edit-msg error';return;}
    btn.disabled=true;msg.textContent='Guardando...';msg.className='queue-edit-msg';
    try{await api({action:'update_scheduled',id,title,caption,scheduled_at:new Date(dt).toISOString()});msg.textContent='Cambios guardados.';setTimeout(()=>dialog.close(),450);await refreshQueue();}
    catch(e){msg.textContent=e.message+(e.detail?' · '+e.detail:'');msg.className='queue-edit-msg error';}
    finally{btn.disabled=false;}
  }

  async function refreshWithAI(){
    const id=document.querySelector('#queueEditId').value,item=cache.get(id),caption=document.querySelector('#queueEditCaption').value.trim(),msg=document.querySelector('#queueEditMsg'),btn=document.querySelector('#queueEditAI');
    if(!item){msg.textContent='No pude identificar la publicación.';msg.className='queue-edit-msg error';return;}
    if(!editableStatuses.has(item.status)){msg.textContent='Esta publicación ya está en proceso.';msg.className='queue-edit-msg error';return;}
    btn.disabled=true;msg.textContent='Actualizando con la voz de marca actual...';msg.className='queue-edit-msg';
    try{
      const urls=(Array.isArray(item.media_items)&&item.media_items.length?item.media_items.map(x=>x.media_url):[item.media_url]).filter(Boolean);
      const context=`Reescribe el texto de esta publicación usando el manual y la voz de marca ACTUALES. Conserva los hechos reales que ya aparecen en el texto y en las imágenes. No inventes precios, promociones, ingredientes, fechas, beneficios, disponibilidad ni datos nuevos. Mantén la intención de la publicación, pero mejora el tono para que represente la voz actual de la marca. Texto actual: ${caption}`;
      const result=await api({action:'analyze',brand_id:item.brand_id,media_urls:urls,context}),a=result.analysis||{};
      if(a.title)document.querySelector('#queueEditTitle').value=a.title;
      const tags=Array.isArray(a.hashtags)&&a.hashtags.length?'\n\n'+a.hashtags.join(' '):'';
      if(a.caption)document.querySelector('#queueEditCaption').value=a.caption+tags;
      const warnings=Array.isArray(a.warnings)?a.warnings.filter(Boolean):[];
      msg.textContent=warnings.length?'Texto actualizado. Revisa: '+warnings.join(' · '):'Texto actualizado. Revisa y guarda los cambios.';
    }catch(e){msg.textContent=e.message+(e.detail?' · '+e.detail:'');msg.className='queue-edit-msg error';}
    finally{btn.disabled=false;}
  }

  function renderQueue(items){
    const root=document.querySelector('#aiQueue');if(!root)return;
    cache=new Map(items.map(x=>[x.id,x]));
    if(!items.length){root.innerHTML='<p class="helper">No hay publicaciones pendientes ni errores.</p>';return;}
    root.innerHTML=items.slice(0,20).map(x=>{const count=Array.isArray(x.media_items)&&x.media_items.length?x.media_items.length:(x.media_type==='CAROUSEL_ALBUM'?2:1),editable=editableStatuses.has(x.status);return `<div class="queue-item queue-editable"><div class="queue-thumb"><img src="${esc(x.media_url||'')}" alt="">${count>1?`<span class="queue-count">${count}</span>`:''}</div><div><span class="queue-brand">${esc(brandLabel(x.brand_id))}</span><strong style="display:block">${esc(x.title||x.brand_id)}</strong><small>${x.scheduled_at?new Date(x.scheduled_at).toLocaleString('es-CL'):'Sin fecha'}${count>1?' · Carrusel':''}</small>${x.error_message?`<small class="queue-error">${esc(x.error_message)}</small>`:''}</div><div class="queue-right"><span class="queue-state ${esc(x.status)}">${labelStatus(x.status)}</span>${editable?`<div class="queue-edit-actions"><button type="button" class="queue-edit-btn" data-edit-queue="${esc(x.id)}">Editar</button></div>`:''}</div></div>`}).join('');
    root.querySelectorAll('[data-edit-queue]').forEach(b=>b.addEventListener('click',()=>openEditor(b.dataset.editQueue)));
  }

  async function refreshQueue(){
    const root=document.querySelector('#aiQueue');if(!root)return;
    if(!getPin()){root.innerHTML='<p class="helper">Ingresa el PIN para cargar la cola.</p>';return;}
    try{const d=await api({action:'list'}),items=(d.items||[]).filter(x=>['scheduled','publishing','ready','draft','failed'].includes(x.status)||Boolean(x.error_message));renderQueue(items);}
    catch(e){root.innerHTML=`<p class="queue-error">No se pudo cargar la cola: ${esc(e.message)}</p>`;}
  }

  document.querySelector('#queueEditClose').addEventListener('click',()=>dialog.close());
  document.querySelector('#queueEditCancel').addEventListener('click',()=>dialog.close());
  document.querySelector('#queueEditAI').addEventListener('click',refreshWithAI);
  document.querySelector('#queueEditSave').addEventListener('click',save);
  window.addEventListener('laberinto:queue-updated',event=>{const items=event.detail?.items;if(Array.isArray(items))renderQueue(items);});

  window.laberintoQueueEditorReady=true;
  window.laberintoRefreshQueue=refreshQueue;
  setTimeout(()=>{if(!cache.size)refreshQueue();},800);
  setInterval(refreshQueue,30000);
})();
