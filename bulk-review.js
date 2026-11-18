/* Prueba aislada: ningún elemento de este módulo programa ni publica por sí mismo. */
(() => {
  const API = 'https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/laberinto-api';
  const KEY = 'laberinto_session_pin';
  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const css = document.createElement('style');
  css.textContent = '.bulk-panel{margin:14px 0}.bulk-controls{display:flex;flex-wrap:wrap;align-items:center;gap:10px}.bulk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(195px,1fr));gap:12px;margin-top:14px}.bulk-card{border:1px solid #ddd;border-radius:12px;padding:10px;display:grid;gap:7px}.bulk-card img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:8px}.bulk-card textarea{min-height:85px;width:100%;box-sizing:border-box}.bulk-card input{width:100%;box-sizing:border-box}.bulk-card .bulk-actions{display:flex;gap:6px;flex-wrap:wrap}.bulk-card .bulk-actions button{font-size:12px}.bulk-note{font-size:12px;color:#666}';
  document.head.append(css);
  const section = document.createElement('section');
  section.className = 'panel bulk-panel';
  section.innerHTML = '<div class="panel-heading"><div><span class="eyebrow">PRUEBA · CREACIÓN MASIVA</span><h2>Fotos → borradores → aprobación</h2></div></div><p class="helper">Selecciona varias fotos de una misma marca. La IA prepara una propuesta por foto. Nada se publica ni se programa desde aquí.</p><div class="bulk-controls"><label>Marca <select id="bulkBrand"><option value="adria-sushi">Adrià Sushi</option><option value="adria-sangucheria">Sanguchería Adrià</option><option value="pet">Adrià PET</option><option value="chef-rafael">Chef Rafael</option><option value="laberinto-digital">Laberinto Digital</option><option value="pausa-de-origen">Pausa de Origen</option></select></label><label class="btn secondary">Elegir fotos<input id="bulkFiles" type="file" multiple accept="image/jpeg,image/png,image/webp" hidden></label><button id="bulkGenerate" type="button" class="btn primary" disabled>Generar borradores</button><span id="bulkStatus" class="bulk-note">Sin fotos seleccionadas.</span></div><div id="bulkCards" class="bulk-grid"></div>';
  const host = document.querySelector('.ai-publisher');
  (host?.parentNode || document.querySelector('main'))?.insertBefore(section, host?.nextSibling || null);
  const $ = s => section.querySelector(s);
  let items = [], busy = false, brand = 'adria-sushi';
  const status = s => { $('#bulkStatus').textContent = s; };
  function render() {
    $('#bulkGenerate').disabled = busy || !items.some(x => x.status === 'pending' || x.status === 'error');
    $('#bulkFiles').disabled = busy;
    $('#bulkBrand').disabled = busy;
    $('#bulkCards').innerHTML = items.map((x,i) => '<article class="bulk-card" data-index="'+i+'"><img alt="Foto '+(i+1)+'" src="'+esc(x.preview)+'"><small>'+esc(x.file.name)+' · '+esc(x.status)+'</small><input aria-label="Título" data-title="'+i+'" value="'+esc(x.title)+'"><textarea aria-label="Texto de publicación" data-caption="'+i+'">'+esc(x.caption)+'</textarea><div class="bulk-actions"><button type="button" data-approve="'+i+'" class="btn primary" '+(x.status !== 'ready' || busy ? 'disabled' : '')+'>Usar en publicador</button><button type="button" data-reject="'+i+'" class="btn secondary" '+(busy ? 'disabled' : '')+'>Descartar</button></div></article>').join('');
  }
  $('#bulkBrand').addEventListener('change', e => { brand = e.target.value; items.forEach(x => { if(x.status === 'ready') x.status = 'pending'; }); render(); });
  $('#bulkFiles').addEventListener('change', e => {
    const files = [...e.target.files].filter(f=>['image/jpeg','image/png','image/webp'].includes(f.type));
    if(files.length>50){ status('Máximo 50 fotos por lote.'); e.target.value=''; return; }
    items.forEach(x=>URL.revokeObjectURL(x.preview));
    items = files.map(file=>({file,preview:URL.createObjectURL(file),title:'',caption:'',status:'pending'}));
    status(items.length + ' fotos cargadas; listas para analizar.');
    render(); e.target.value='';
  });
  async function upload(file){
    const form = new FormData();
    form.append('action','upload');form.append('pin',sessionStorage.getItem(KEY)||'');form.append('brand_id',brand);form.append('file',file);
    const response = await fetch(API,{method:'POST',body:form}), data = await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.error||'Error al subir foto');
    return data;
  }
  async function analyze(url){
    const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'analyze',pin:sessionStorage.getItem(KEY)||'',brand_id:brand,media_urls:[url],context:'Propuesta individual de contenido para revisión previa. No inventar productos, precios ni promociones.'})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'Error de análisis');
    return data.analysis||{};
  }
  $('#bulkGenerate').addEventListener('click',async()=>{
    if(busy||!sessionStorage.getItem(KEY)){status('Accede primero con el PIN del Publicador.');return;}
    busy=true;render();
    const pending=items.filter(x=>x.status==='pending'||x.status==='error');
    for(let i=0;i<pending.length;i++){
      const x=pending[i];x.status='processing';status('Preparando '+(i+1)+' de '+pending.length+'…');render();
      try {const media=await upload(x.file); const result=await analyze(media.media_url); x.title=result.title||''; x.caption=(result.caption||'')+(Array.isArray(result.hashtags)&&result.hashtags.length?'\n\n'+result.hashtags.join(' '):''); x.status='ready';}
      catch(err){x.status='error';x.caption=err.message||'Error. Reintentar.';}
      render();
    }
    busy=false;status('Revisa las propuestas. Ninguna fue programada ni publicada.');render();
  });
  $('#bulkCards').addEventListener('input',e=>{
    const k=e.target.dataset;
    if(k.title!==undefined&&items[Number(k.title)])items[Number(k.title)].title=e.target.value;
    if(k.caption!==undefined&&items[Number(k.caption)])items[Number(k.caption)].caption=e.target.value;
  });
  $('#bulkCards').addEventListener('click',e=>{
    const index=e.target.dataset.approve ?? e.target.dataset.reject;
    if(index===undefined)return;
    const x=items[Number(index)];if(!x||busy)return;
    if(e.target.dataset.reject!==undefined){URL.revokeObjectURL(x.preview);items.splice(Number(index),1);render();return;}
    if(x.status!=='ready')return;
    const mainBrand=document.querySelector('#aiBrand'), mainType=document.querySelector('#aiContentType'), input=document.querySelector('#aiFile');
    if(!input||!mainBrand){status('No se encontró el Publicador principal.');return;}
    // El flujo normal pide confirmación antes de programar/publicar.
    if(mainType && mainType.value!=='FEED'){mainType.value='FEED';mainType.dispatchEvent(new Event('change',{bubbles:true}));}
    mainBrand.value=brand;mainBrand.dispatchEvent(new Event('change',{bubbles:true}));
    window.dispatchEvent(new CustomEvent('laberinto:studio-draft',{detail:{brand_id:brand,title:x.title,caption:x.caption,context:'Borrador preparado en lote, pendiente de programación manual.'}}));
    const dt = new DataTransfer();dt.items.add(x.file);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
    x.status='transferred';render();status('Propuesta enviada al editor. Revisa la foto y pulsa Programar solo cuando quieras.');
    document.querySelector('.ai-publisher')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
  render();
})();