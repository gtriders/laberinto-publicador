(() => {
  const API='https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/google-weekly-api';
  const PIN='laberinto_session_pin';
  const brands={'adria-sushi':'Adrià Sushi','adria-sangucheria':'Sanguchería Adrià','pet':'Adrià PET','chef-rafael':'Chef Rafael','laberinto-digital':'Laberinto Digital'};
  const links={
    'adria-sushi':{order:'https://adriasushi.cl',info:'https://adria.cl'},
    'adria-sangucheria':{order:'https://adriasangucheria.cl',info:'https://adria.cl'},
    'pet':{order:'',info:'https://adria.cl'},
    'chef-rafael':{order:'',info:'https://adria.cl'},
    'laberinto-digital':{order:'',info:''}
  };
  const pin=()=>sessionStorage.getItem(PIN)||'';
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));
  const call=async body=>{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,pin:pin()})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Error de conexión');return d;};
  const css=document.createElement('style');css.textContent=`.google-weekly-view{display:none}.google-weekly-view.active{display:block}.gw-head{display:flex;justify-content:space-between;gap:12px;align-items:end;flex-wrap:wrap}.gw-filter{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.gw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:14px}.gw-card{border:1px solid #e7dfd2;border-radius:15px;background:#fff;padding:12px;display:grid;grid-template-columns:150px 1fr;gap:12px}.gw-card img{width:150px;height:150px;object-fit:cover;border-radius:11px;background:#f4f1eb}.gw-card h3{margin:0 0 4px;font-size:1rem}.gw-meta{font-size:.76rem;color:#786f64}.gw-copy{width:100%;min-height:118px;resize:vertical;margin-top:8px}.gw-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.gw-actions .btn{padding:8px 10px;font-size:.8rem}.gw-status{font-size:.78rem;font-weight:800}.gw-status.ready{color:#8a6400}.gw-status.published{color:#287245}.gw-empty{padding:24px;text-align:center;color:#777}.gw-history{margin-top:18px;border-top:1px solid #eee6dc;padding-top:14px}.gw-cta{margin-top:9px;border:1px solid #e8e0d4;border-radius:11px;background:#faf8f4;padding:9px 10px;display:grid;gap:4px}.gw-cta strong{font-size:.82rem}.gw-cta small{font-size:.74rem;color:#6c6359;overflow-wrap:anywhere}.gw-cta-row{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.gw-cta-row .btn{padding:5px 8px;font-size:.72rem}@media(max-width:800px){.gw-grid{grid-template-columns:1fr}.gw-card{grid-template-columns:110px 1fr}.gw-card img{width:110px;height:110px}}`;
  document.head.appendChild(css);

  function recommend(item){
    const text=`${item.title||''} ${item.caption||''} ${item.google_copy||''}`.toLowerCase();
    const brandLinks=links[item.brand_id]||{order:'',info:''};
    const noCta=/(cerrad|cierre|no atend|descans|feriado|fiestas patrias|vacacion)/.test(text);
    if(noCta)return{label:'Ninguno',url:'',reason:'Aviso informativo: no conviene agregar un llamado a compra.'};
    const infoPost=/(historia|nuestro local|el local|terraza|ambiente|equipo|vecinos|aniversario|cómo empezó|como empezó)/.test(text);
    if(!infoPost&&brandLinks.order)return{label:'Pedir en línea',url:brandLinks.order,reason:'Contenido de producto o comida: lleva directo al pedido.'};
    if(brandLinks.info)return{label:'Más información',url:brandLinks.info,reason:'Contenido de marca o experiencia: conviene llevar al sitio.'};
    return{label:'Ninguno',url:'',reason:'No hay una URL de destino configurada para esta marca.'};
  }

  function boot(){
    const tabs=document.querySelector('.app-tabs'),settings=document.querySelector('#settingsView'),main=document.querySelector('main.main-view');
    if(!tabs||!settings||!main)return setTimeout(boot,160);
    if(document.querySelector('#tabGoogleWeekly'))return;
    const tab=document.createElement('button');tab.id='tabGoogleWeekly';tab.className='app-tab';tab.type='button';tab.textContent='Google semanal';tabs.insertBefore(tab,document.querySelector('#tabSettings'));
    const view=document.createElement('main');view.id='googleWeeklyView';view.className='shell google-weekly-view';view.innerHTML=`<section class="panel"><div class="gw-head"><div><span class="eyebrow">GOOGLE MI NEGOCIO</span><h2>Google semanal</h2><p class="helper" style="margin:0">Reutiliza lo mejor del feed. Prepara el copy, baja la imagen y publica una vez por semana.</p></div><div class="gw-filter"><select id="gwBrand"><option value="all">Todas las marcas</option>${Object.entries(brands).map(([id,n])=>`<option value="${id}">${n}</option>`).join('')}</select><button id="gwRefresh" class="btn secondary" type="button">Actualizar</button></div></div><div id="gwStatus" class="settings-status" style="margin-top:10px"></div><div id="gwPending" class="gw-grid"></div><div class="gw-history"><div class="panel-heading"><div><span class="eyebrow">HISTORIAL</span><h3>Ya usado en Google</h3></div></div><div id="gwHistory" class="gw-grid"></div></div></section>`;
    settings.insertAdjacentElement('beforebegin',view);

    const hide=()=>view.classList.remove('active');
    ['#tabPublicador','#tabPlanner','#tabStudio','#tabSettings','#tabUGC'].forEach(s=>document.querySelector(s)?.addEventListener('click',hide));
    tab.onclick=()=>{main.classList.add('settings-hidden');settings.classList.remove('active');document.querySelector('#plannerView')?.classList.remove('active');document.querySelector('#studioView')?.classList.remove('active');document.querySelector('#ugcView')?.classList.remove('active');view.classList.add('active');document.querySelectorAll('.app-tab').forEach(x=>x.classList.remove('active'));tab.classList.add('active');load();};

    const status=t=>view.querySelector('#gwStatus').textContent=t;
    const mediaOf=item=>item.media_url||item.media_items?.[0]?.media_url||'';
    const formatDate=v=>{try{return new Intl.DateTimeFormat('es-CL',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(v));}catch{return'';}};
    async function copyText(text){try{await navigator.clipboard.writeText(text);return true;}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();return true;}}
    async function download(url,name){const r=await fetch(url);if(!r.ok)throw new Error('No se pudo bajar la imagen');const blob=await r.blob(),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name||'google-adria.jpg';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);}
    let items=[];
    function card(item){
      const url=mediaOf(item),state=item.google_status||'unused',copy=item.google_copy||'',published=state==='published',cta=recommend(item);
      const ctaBlock=`<div class="gw-cta"><strong>Botón recomendado: ${esc(cta.label)}</strong><small>${esc(cta.reason)}</small>${cta.url?`<div class="gw-cta-row"><small>${esc(cta.url)}</small><button class="btn secondary" data-copy-url type="button">Copiar URL</button></div>`:''}</div>`;
      return `<article class="gw-card" data-id="${item.id}"><div>${url?`<img src="${esc(url)}" alt="${esc(item.title||'Publicación')}">`:''}</div><div><div class="gw-meta">${esc(brands[item.brand_id]||item.brand_id)} · ${formatDate(item.published_at||item.scheduled_at||item.created_at)}</div><h3>${esc(item.title||'Publicación')}</h3><span class="gw-status ${published?'published':'ready'}">${published?'Publicado en Google':copy?'Listo para Google':'Sin preparar'}</span><textarea class="gw-copy" placeholder="Prepara el copy para Google…">${esc(copy)}</textarea>${ctaBlock}<div class="gw-actions">${published?`<button class="btn secondary" data-reset type="button">Volver a pendientes</button>`:`<button class="btn secondary" data-prepare type="button">Preparar copy</button><button class="btn secondary" data-copy type="button">Copiar copy</button><button class="btn secondary" data-download type="button">Bajar imagen</button><button class="btn secondary" data-open type="button">Abrir Google</button><button class="btn primary" data-mark type="button">Marcar publicado</button>`}</div></div></article>`;
    }
    function bind(root){
      root.querySelectorAll('.gw-card').forEach(card=>{
        const id=card.dataset.id,item=items.find(x=>x.id===id),ta=card.querySelector('.gw-copy'),cta=recommend(item);
        ta?.addEventListener('change',async()=>{if(!ta.value.trim())return;try{await call({action:'save_copy',id,copy:ta.value});status('Copy de Google guardado.');}catch(e){status(e.message);}});
        card.querySelector('[data-prepare]')?.addEventListener('click',async e=>{e.currentTarget.disabled=true;status('Preparando copy para Google…');try{const d=await call({action:'prepare',id});ta.value=d.copy||'';status('Copy de Google listo.');await load(false);}catch(err){status(err.message);}finally{e.currentTarget.disabled=false;}});
        card.querySelector('[data-copy]')?.addEventListener('click',async()=>{if(!ta.value.trim()){status('Primero prepara el copy.');return;}await copyText(ta.value);status('Copy copiado.');});
        card.querySelector('[data-copy-url]')?.addEventListener('click',async()=>{if(!cta.url)return;await copyText(cta.url);status(`URL para “${cta.label}” copiada.`);});
        card.querySelector('[data-download]')?.addEventListener('click',async()=>{try{await download(mediaOf(item),`google-${item.brand_id}-${id.slice(0,8)}.jpg`);status('Imagen lista para subir a Google.');}catch(e){status(e.message);}});
        card.querySelector('[data-open]')?.addEventListener('click',()=>window.open('https://business.google.com/','_blank','noopener,noreferrer'));
        card.querySelector('[data-mark]')?.addEventListener('click',async()=>{if(!ta.value.trim()){status('Primero prepara el copy.');return;}await call({action:'save_copy',id,copy:ta.value});await call({action:'mark_published',id});status('Marcado como publicado en Google.');load(false);});
        card.querySelector('[data-reset]')?.addEventListener('click',async()=>{await call({action:'reset',id});status('Volvió a pendientes.');load(false);});
      });
    }
    async function load(showLoading=true){
      if(!pin()){status('Ingresa al Publicador para ver Google semanal.');return;}
      if(showLoading)status('Cargando contenido…');
      try{const d=await call({action:'list'});items=d.items||[];const brand=view.querySelector('#gwBrand').value,filtered=brand==='all'?items:items.filter(x=>x.brand_id===brand),pending=filtered.filter(x=>x.google_status!=='published').slice(0,16),done=filtered.filter(x=>x.google_status==='published').slice(0,8);view.querySelector('#gwPending').innerHTML=pending.length?pending.map(card).join(''):'<div class="gw-empty">No hay contenido pendiente para Google.</div>';view.querySelector('#gwHistory').innerHTML=done.length?done.map(card).join(''):'<div class="gw-empty">Todavía no hay publicaciones marcadas como usadas en Google.</div>';bind(view);status(`${pending.length} contenido(s) disponibles para reutilizar en Google.`);}catch(e){status(e.message);}
    }
    view.querySelector('#gwRefresh').onclick=()=>load();
    view.querySelector('#gwBrand').onchange=()=>load(false);
    window.addEventListener('laberinto:authenticated',()=>load(false));
  }
  boot();
})();