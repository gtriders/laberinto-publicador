(() => {
  const PIN_KEY='laberinto_session_pin';
  const IMAGE_API='https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/image-studio';
  const META_KEY='laberinto_ugc_v1_meta';
  const DB_NAME='laberinto_ugc_v1';
  const DB_VERSION=1;
  const STORE='references';
  const brandId='adria-sangucheria';
  const brandName='Sanguchería Adrià';
  const DEFAULT_SITE='https://adriasangucheria.cl';
  const seededProducts=['Churrasco','Churrasco Italiano','Lomito','Lomito Italiano','Completo','Completo Italiano','Dinámico','AS','Chacarero','Barros Luco','Barros Jarpa','Chemilico','Chacatofu','Papas fritas','Chorrillana','Salchipapas'];
  const scenes=[
    {id:'eating',name:'Comiendo',description:'Una persona disfrutando el producto de forma espontánea.'},
    {id:'friends',name:'Compartiendo',description:'Personas compartiendo de manera natural.'},
    {id:'hand',name:'En la mano',description:'Producto real en primer plano, estilo foto de cliente.'}
  ];
  const placeTypes=[
    {id:'terrace',name:'Terraza'},
    {id:'interior',name:'Interior'},
    {id:'table',name:'Mesas'},
    {id:'bar',name:'Barra'}
  ];

  const css=document.createElement('style');
  css.textContent=`
    .ugc-view{display:none}.ugc-view.active{display:block}.ugc-main{max-width:860px;margin:0 auto}.ugc-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.ugc-flow{display:grid;gap:16px}.ugc-control{display:grid;gap:6px}.ugc-scenes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.ugc-scene{border:1px solid #e7dfd2;border-radius:12px;padding:11px;background:#fff;text-align:left;cursor:pointer}.ugc-scene.active{outline:2px solid #111827;border-color:#111827}.ugc-scene strong{display:block;font-size:.9rem}.ugc-scene small{display:block;color:#756b5d;margin-top:3px;line-height:1.3}.ugc-status{font-size:.88rem;color:#655c50}.ugc-status.ok{color:#287245}.ugc-status.warn{color:#8a6400}.ugc-status.error{color:#a33232}.ugc-generate{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.ugc-result{display:none;margin-top:18px;border-top:1px solid #eee5d9;padding-top:18px}.ugc-result.active{display:grid;gap:12px}.ugc-result img{width:min(100%,620px);border-radius:14px;display:block}.ugc-actions{display:flex;gap:8px;flex-wrap:wrap}.ugc-settings-summary{font-size:.88rem;color:#655c50}.ugc-settings-group{border:1px solid #e7dfd2;border-radius:12px;background:#fff;overflow:hidden}.ugc-settings-group>summary{cursor:pointer;padding:12px 14px;font-weight:800;list-style:none}.ugc-settings-group>summary::-webkit-details-marker{display:none}.ugc-settings-group>summary:after{content:'+';float:right}.ugc-settings-group[open]>summary:after{content:'−'}.ugc-settings-body{border-top:1px solid #eee5d9;padding:14px;display:grid;gap:12px}.ugc-ref-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.ugc-ref-box{border:1px dashed #d8cfc0;border-radius:11px;padding:9px;background:#faf8f4}.ugc-ref-box strong{display:block;font-size:.8rem;margin-bottom:6px}.ugc-thumbs{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.ugc-thumb{position:relative}.ugc-thumb img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:7px;display:block}.ugc-thumb button{position:absolute;right:2px;top:2px;width:21px;height:21px;border:0;border-radius:50%;background:rgba(0,0,0,.72);color:#fff;cursor:pointer}.ugc-product-editor{display:grid;gap:10px;padding-top:4px}.ugc-product-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ugc-product-fields .wide{grid-column:1/-1}.ugc-product-fields label{display:grid;gap:5px;font-size:.82rem;font-weight:750}.ugc-product-fields input,.ugc-product-fields textarea{width:100%}.ugc-rule{background:#f7f2ea;border-radius:10px;padding:10px 12px;font-size:.8rem;line-height:1.4;color:#62594d}@media(max-width:760px){.ugc-scenes{grid-template-columns:1fr}.ugc-ref-grid{grid-template-columns:1fr 1fr}.ugc-product-fields{grid-template-columns:1fr}.ugc-product-fields .wide{grid-column:auto}.ugc-top{align-items:center}}
  `;
  document.head.appendChild(css);

  function slug(s=''){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')||('p-'+Date.now());}
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const defaultMeta=()=>({
    site:DEFAULT_SITE,
    places:{terrace:[],interior:[],table:[],bar:[]},
    products:Object.fromEntries(seededProducts.map(name=>[slug(name),{id:slug(name),name,ingredients:'',size:'',presentation:'',refs:[]}]))
  });
  function loadMeta(){try{const d=JSON.parse(localStorage.getItem(META_KEY)||'null');if(!d)return defaultMeta();const base=defaultMeta();return {...base,...d,places:{...base.places,...(d.places||{})},products:{...base.products,...(d.products||{})}};}catch{return defaultMeta();}}
  let meta=loadMeta();
  function saveMeta(){localStorage.setItem(META_KEY,JSON.stringify(meta));window.dispatchEvent(new CustomEvent('laberinto:ugc-meta-updated'));refreshSettingsSummary();}

  const dbp=new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  async function dbPut(rec){const db=await dbp;return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(rec);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});}
  async function dbGet(id){const db=await dbp;return new Promise((res,rej)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error);});}
  async function dbAll(){const db=await dbp;return new Promise((res,rej)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error);});}
  async function dbDelete(id){const db=await dbp;return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});}
  function makeId(prefix='ref'){return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;}
  async function addFiles(files,target,productId=''){
    for(const file of files){
      if(!file.type.startsWith('image/'))continue;
      const id=makeId(target);
      await dbPut({id,target,productId,name:file.name,type:file.type,blob:file,createdAt:new Date().toISOString()});
      if(productId){const p=meta.products[productId];if(p)p.refs=Array.from(new Set([...(p.refs||[]),id]));}
      else meta.places[target]=Array.from(new Set([...(meta.places[target]||[]),id]));
    }
    saveMeta();
  }
  async function removeRef(id,target,productId=''){
    await dbDelete(id);
    if(productId){const p=meta.products[productId];if(p)p.refs=(p.refs||[]).filter(x=>x!==id);}
    else meta.places[target]=(meta.places[target]||[]).filter(x=>x!==id);
    saveMeta();
  }
  async function blobUrl(id){const rec=await dbGet(id);return rec?.blob?URL.createObjectURL(rec.blob):'';}
  const blobToDataUrl=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob);});

  async function exportBackup(){
    const records=await dbAll(),refs=[];
    for(const rec of records)refs.push({...rec,blob:await blobToDataUrl(rec.blob)});
    const payload={version:1,exported_at:new Date().toISOString(),meta,refs};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload)],{type:'application/json'})),a=document.createElement('a');
    a.href=url;a.download=`laberinto-ugc-respaldo-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
  }
  async function importBackup(file){
    const payload=JSON.parse(await file.text());
    if(payload?.version!==1||!payload.meta||!Array.isArray(payload.refs))throw new Error('El archivo no es un respaldo UGC válido.');
    for(const rec of payload.refs){if(typeof rec.blob!=='string'||!rec.blob.startsWith('data:'))continue;const blob=await fetch(rec.blob).then(r=>r.blob());await dbPut({...rec,blob});}
    const current=loadMeta(),incoming=payload.meta,places={};
    for(const place of placeTypes.map(x=>x.id))places[place]=Array.from(new Set([...(current.places?.[place]||[]),...(incoming.places?.[place]||[])]));
    const products={...current.products};
    for(const [id,product] of Object.entries(incoming.products||{})){const existing=products[id]||{};products[id]={...existing,...product,refs:Array.from(new Set([...(existing.refs||[]),...(product.refs||[])]))};}
    meta={...current,...incoming,places,products};saveMeta();
  }

  async function renderRefs(root,ids,target,productId=''){
    if(!root)return;
    root.querySelectorAll('img[src^="blob:"]').forEach(image=>URL.revokeObjectURL(image.src));root.innerHTML='';
    for(const id of ids||[]){
      const url=await blobUrl(id);if(!url)continue;
      const w=document.createElement('div');w.className='ugc-thumb';w.innerHTML=`<img src="${url}" alt="Referencia"><button type="button" title="Eliminar">×</button>`;
      w.querySelector('button').onclick=async()=>{URL.revokeObjectURL(url);await removeRef(id,target,productId);if(productId)renderProductEditor();else renderPlaceRefs();};
      root.appendChild(w);
    }
  }

  function refreshSettingsSummary(){
    const el=document.querySelector('#ugcSettingsSummary');if(!el)return;
    const products=Object.values(meta.products).filter(p=>(p.refs||[]).length).length;
    const places=Object.values(meta.places).reduce((n,a)=>n+(a?.length||0),0);
    el.textContent=`${products} producto(s) con fotos · ${places} referencia(s) del local`;
  }

  function mountSettings(settings){
    if(document.querySelector('#ugcSettingsCard'))return;
    const grid=settings.querySelector('.settings-grid');if(!grid)return;
    const card=document.createElement('article');card.id='ugcSettingsCard';card.className='settings-card settings-full';card.innerHTML=`
      <span class="eyebrow">UGC IA</span><h3>Referencias reales</h3>
      <p id="ugcSettingsSummary" class="ugc-settings-summary"></p>
      <p class="helper">Estas referencias ayudan a mantener producto y local fieles a la realidad. Configúralas solo cuando haga falta.</p>
      <details id="ugcProductsDetails" class="ugc-settings-group"><summary>Productos y fotos</summary><div class="ugc-settings-body"><div class="settings-row"><select id="ugcProductSelect"></select><button id="ugcNewProduct" class="btn secondary" type="button">+ Producto</button></div><div id="ugcProductEditor"></div></div></details>
      <details class="ugc-settings-group"><summary>Fotos del local</summary><div class="ugc-settings-body"><div class="ugc-ref-grid">${placeTypes.map(x=>`<div class="ugc-ref-box"><strong>${x.name}</strong><div class="ugc-thumbs" id="ugcPlace_${x.id}"></div><label class="btn secondary file-label" style="margin-top:7px">+ Fotos<input data-place="${x.id}" class="ugcPlaceInput" type="file" accept="image/*" multiple hidden></label></div>`).join('')}</div><div class="settings-row"><input id="ugcSite" type="url" value="${esc(meta.site||DEFAULT_SITE)}"><button id="ugcOpenSite" class="btn secondary" type="button">Abrir web</button></div></div></details>
      <details class="ugc-settings-group"><summary>Respaldo</summary><div class="ugc-settings-body"><div class="ugc-rule">Las fotos de referencia viven en este navegador. Exporta un respaldo cuando agregues referencias importantes.</div><div class="settings-row"><button id="ugcExport" class="btn secondary" type="button">Exportar respaldo</button><label class="btn secondary file-label">Importar respaldo<input id="ugcImport" type="file" accept="application/json,.json" hidden></label><span id="ugcBackupStatus" class="settings-status"></span></div></div></details>`;
    grid.insertBefore(card,document.querySelector('#settingsHistory')||null);
    card.querySelector('#ugcSite').addEventListener('change',e=>{meta.site=e.target.value.trim()||DEFAULT_SITE;saveMeta();});
    card.querySelector('#ugcOpenSite').onclick=()=>window.open(meta.site||DEFAULT_SITE,'_blank','noopener,noreferrer');
    card.querySelector('#ugcExport').onclick=async()=>{const s=card.querySelector('#ugcBackupStatus');s.textContent='Preparando…';try{await exportBackup();s.textContent='Respaldo listo.';s.className='settings-status ok';}catch(e){s.textContent=e.message;s.className='settings-status error';}};
    card.querySelector('#ugcImport').onchange=async e=>{const file=e.target.files?.[0],s=card.querySelector('#ugcBackupStatus');if(!file)return;if(!confirm('¿Importar este respaldo y combinarlo con las referencias actuales?')){e.target.value='';return;}s.textContent='Importando…';try{await importBackup(file);renderPlaceRefs();renderProductSelect();renderProductEditor();s.textContent='Respaldo importado.';s.className='settings-status ok';}catch(err){s.textContent=err.message;s.className='settings-status error';}finally{e.target.value='';}};
    card.querySelectorAll('.ugcPlaceInput').forEach(input=>input.onchange=async()=>{await addFiles([...input.files],input.dataset.place);input.value='';renderPlaceRefs();});
    card.querySelector('#ugcNewProduct').onclick=()=>{const name=prompt('Nombre exacto del producto');if(!name)return;const id=slug(name);if(!meta.products[id])meta.products[id]={id,name,ingredients:'',size:'',presentation:'',refs:[]};saveMeta();renderProductSelect(id);renderProductEditor();};
    card.querySelector('#ugcProductSelect').onchange=renderProductEditor;
    refreshSettingsSummary();renderPlaceRefs();renderProductSelect();renderProductEditor();
  }

  function renderPlaceRefs(){placeTypes.forEach(x=>renderRefs(document.querySelector(`#ugcPlace_${x.id}`),meta.places[x.id]||[],x.id));}
  function renderProductSelect(preferred=''){
    const sel=document.querySelector('#ugcProductSelect');if(!sel)return;
    const current=preferred||sel.value;
    sel.innerHTML=Object.values(meta.products).sort((a,b)=>a.name.localeCompare(b.name,'es')).map(p=>`<option value="${esc(p.id)}">${esc(p.name)}${(p.refs||[]).length?` · ${(p.refs||[]).length} foto(s)`:''}</option>`).join('');
    if(current&&meta.products[current])sel.value=current;
  }
  function renderProductEditor(){
    const root=document.querySelector('#ugcProductEditor'),sel=document.querySelector('#ugcProductSelect');if(!root||!sel)return;
    const p=meta.products[sel.value];if(!p){root.innerHTML='';return;}
    root.className='ugc-product-editor';root.innerHTML=`<div class="settings-row"><strong>${esc(p.name)}</strong><span class="settings-status">${(p.refs||[]).length} foto(s)</span></div><div class="ugc-product-fields"><label>Ingredientes visibles<textarea id="ugcIngredients" rows="2" placeholder="Solo lo confirmado">${esc(p.ingredients||'')}</textarea></label><label>Tamaño / proporción<input id="ugcSize" type="text" value="${esc(p.size||'')}" placeholder="Opcional"></label><label class="wide">Presentación real<textarea id="ugcPresentation" rows="2" placeholder="Plato, soporte o forma de servir">${esc(p.presentation||'')}</textarea></label></div><div class="ugc-thumbs" id="ugcProductThumbs"></div><div class="settings-row"><label class="btn secondary file-label">+ Fotos reales<input id="ugcProductPhotos" type="file" accept="image/*" multiple hidden></label><button id="ugcSaveProduct" class="btn primary" type="button">Guardar</button></div>`;
    renderRefs(root.querySelector('#ugcProductThumbs'),p.refs||[],'product',p.id);
    root.querySelector('#ugcProductPhotos').onchange=async e=>{await addFiles([...e.target.files],'product',p.id);e.target.value='';renderProductSelect(p.id);renderProductEditor();};
    root.querySelector('#ugcSaveProduct').onclick=()=>{p.ingredients=root.querySelector('#ugcIngredients').value.trim();p.size=root.querySelector('#ugcSize').value.trim();p.presentation=root.querySelector('#ugcPresentation').value.trim();saveMeta();const b=root.querySelector('#ugcSaveProduct');b.textContent='Guardado ✓';setTimeout(()=>b.textContent='Guardar',1000);};
  }

  function waitForApp(){
    const settings=document.querySelector('#settingsView'),tabs=document.querySelector('.app-tabs'),publicador=document.querySelector('main.main-view');
    if(!settings||!tabs||!publicador)return setTimeout(waitForApp,180);
    mountSettings(settings);mountStudio(tabs,settings,publicador);
  }

  function mountStudio(tabs,settings,publicador){
    if(document.querySelector('#tabUGC'))return;
    const settingsBtn=document.querySelector('#tabSettings'),btn=document.createElement('button');btn.id='tabUGC';btn.className='app-tab';btn.type='button';btn.textContent='UGC IA';tabs.insertBefore(btn,settingsBtn||null);
    const view=document.createElement('main');view.id='ugcView';view.className='shell ugc-view';view.innerHTML=`<section class="panel ugc-main"><div class="ugc-top"><div><span class="eyebrow">UGC IA</span><h2 style="margin:4px 0">Comida real. Gente real.</h2><p class="helper" style="margin:4px 0 0">Elige producto y escena. Sin prompts.</p></div><button id="ugcConfig" class="btn ghost" type="button">Referencias</button></div><div class="ugc-flow"><label class="ugc-control">Producto<select id="ugcGenProduct"></select></label><div class="ugc-control"><strong>Escena</strong><div id="ugcScenes" class="ugc-scenes">${scenes.map((s,i)=>`<button type="button" class="ugc-scene ${i===0?'active':''}" data-scene="${s.id}"><strong>${s.name}</strong><small>${s.description}</small></button>`).join('')}</div></div><div class="ugc-generate"><button id="ugcGenerate" class="btn primary" type="button">Generar imagen</button><span id="ugcReady" class="ugc-status"></span></div><div id="ugcGenStatus" class="ugc-status">Elige un producto.</div></div><div id="ugcResult" class="ugc-result"><img id="ugcResultImg" alt="UGC generado"><div class="ugc-actions"><button id="ugcAnother" class="btn secondary" type="button">Otra versión</button><button id="ugcUse" class="btn primary" type="button">Usar en Publicador</button></div></div></section>`;
    settings.insertAdjacentElement('beforebegin',view);
    let scene=scenes[0].id,lastResult=null;
    const hide=()=>view.classList.remove('active');
    document.querySelector('#tabPublicador')?.addEventListener('click',hide);document.querySelector('#tabPlanner')?.addEventListener('click',hide);document.querySelector('#tabStudio')?.addEventListener('click',hide);document.querySelector('#tabSettings')?.addEventListener('click',hide);
    btn.onclick=()=>{publicador.classList.add('settings-hidden');settings.classList.remove('active');document.querySelector('#plannerView')?.classList.remove('active');document.querySelector('#studioView')?.classList.remove('active');view.classList.add('active');document.querySelectorAll('.app-tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');refreshGeneratorProducts();};
    view.querySelector('#ugcConfig').onclick=()=>{document.querySelector('#tabSettings')?.click();setTimeout(()=>{document.querySelector('#ugcProductsDetails')?.setAttribute('open','');document.querySelector('#ugcSettingsCard')?.scrollIntoView({behavior:'smooth',block:'start'});},80);};
    view.querySelectorAll('.ugc-scene').forEach(x=>x.onclick=()=>{view.querySelectorAll('.ugc-scene').forEach(y=>y.classList.remove('active'));x.classList.add('active');scene=x.dataset.scene;});
    view.querySelector('#ugcGenProduct').onchange=updateReady;
    view.querySelector('#ugcGenerate').onclick=()=>generate(scene);
    view.querySelector('#ugcAnother').onclick=()=>generate(scene);
    view.querySelector('#ugcUse').onclick=()=>{if(!lastResult)return;const p=meta.products[view.querySelector('#ugcGenProduct').value];window.dispatchEvent(new CustomEvent('laberinto:studio-media',{detail:{media_url:lastResult.media_url,media_path:lastResult.media_path,brand_id:brandId,frame:'ugc-v1',context:`UGC natural de ${p?.name||'Sanguchería Adrià'}. Mantener producto real y tono de cliente.`}}));document.querySelector('#tabPublicador')?.click();};
    window.addEventListener('laberinto:ugc-meta-updated',()=>{if(view.classList.contains('active'))refreshGeneratorProducts();});

    function refreshGeneratorProducts(){
      meta=loadMeta();const sel=view.querySelector('#ugcGenProduct'),current=sel.value;
      const configured=Object.values(meta.products).filter(p=>(p.refs||[]).length).sort((a,b)=>a.name.localeCompare(b.name,'es'));
      sel.innerHTML=configured.length?configured.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join(''):'<option value="">Sin productos con fotos</option>';
      if(current&&configured.some(p=>p.id===current))sel.value=current;
      updateReady();
    }
    function updateReady(){
      const p=meta.products[view.querySelector('#ugcGenProduct').value],ready=view.querySelector('#ugcReady'),gen=view.querySelector('#ugcGenerate');
      if(!p){ready.textContent='Agrega una foto real en Referencias.';ready.className='ugc-status warn';gen.disabled=true;return;}
      const placeCount=Object.values(meta.places).reduce((n,a)=>n+(a?.length||0),0);
      ready.textContent=placeCount?`${p.refs.length} foto(s) reales · local referenciado`:`${p.refs.length} foto(s) reales · sin fotos del local`;
      ready.className='ugc-status '+(placeCount?'ok':'warn');gen.disabled=false;
    }
    function scenePlaceIds(sceneId){
      const pick=(...groups)=>groups.flatMap(g=>meta.places[g]||[]);
      if(sceneId==='hand')return pick('table','bar','interior','terrace');
      return pick('interior','terrace','table','bar');
    }
    async function generate(sceneId){
      const p=meta.products[view.querySelector('#ugcGenProduct').value];if(!p?.refs?.length)return;
      const status=view.querySelector('#ugcGenStatus'),button=view.querySelector('#ugcGenerate'),another=view.querySelector('#ugcAnother');
      button.disabled=true;another.disabled=true;status.textContent='Generando una foto natural…';status.className='ugc-status';
      try{
        const primary=await dbGet(p.refs[0]);if(!primary?.blob)throw new Error('No pude abrir la foto principal del producto.');
        const fd=new FormData();fd.append('action','generate');fd.append('pin',sessionStorage.getItem(PIN_KEY)||'');fd.append('file',primary.blob,primary.name||'producto.jpg');fd.append('brand_id',brandId);fd.append('frame','creative-context');fd.append('answer',p.ingredients||'Usar únicamente lo visible en las referencias.');fd.append('idea',buildIdea(p,sceneId));fd.append('ugc_v1','true');fd.append('reference_manifest',JSON.stringify({site:meta.site,product:{name:p.name,ingredients:p.ingredients,size:p.size,presentation:p.presentation},scene:sceneId,rule:'No inventar; simplificar si falta evidencia.'}));
        const extraIds=Array.from(new Set([...(p.refs||[]).slice(1,3),...scenePlaceIds(sceneId).slice(0,2)])).slice(0,4);
        for(const id of extraIds){const r=await dbGet(id);if(r?.blob)fd.append('reference_files',r.blob,r.name||`${id}.jpg`);}
        const resp=await fetch(IMAGE_API,{method:'POST',body:fd}),d=await resp.json().catch(()=>({}));
        if(!resp.ok){const e=new Error(d.error||'Error al generar');e.detail=d.detail||'';throw e;}
        lastResult=d;view.querySelector('#ugcResultImg').src=d.media_url;view.querySelector('#ugcResult').classList.add('active');status.textContent=`Lista${d.reference_count?` · ${d.reference_count+1} referencias usadas`:''}.`;status.className='ugc-status ok';view.querySelector('#ugcResult').scrollIntoView({behavior:'smooth',block:'center'});
      }catch(e){status.textContent=e.message+(e.detail?` — ${e.detail}`:'');status.className='ugc-status error';}
      finally{button.disabled=false;another.disabled=false;}
    }
    function buildIdea(p,sceneId){
      const sceneText=scenes.find(s=>s.id===sceneId)?.description||'';
      return `UGC MUY NATURAL para ${brandName}. Producto real: ${p.name}. Escena: ${sceneText} Mantener el producto reconocible y fiel a las referencias. No inventar ingredientes, tamaños, vajilla, mobiliario, carteles ni otros productos. ${p.ingredients?`Ingredientes confirmados: ${p.ingredients}.`:''} ${p.size?`Tamaño/proporción real: ${p.size}.`:''} ${p.presentation?`Presentación real: ${p.presentation}.`:''} Usar las fotos del local solo como referencia real. Si falta evidencia, usar una composición más simple y neutra en vez de inventar. Debe parecer una foto de celular tomada por un cliente: personas comunes, expresiones espontáneas, luz ambiente, pequeñas imperfecciones naturales, nada de modelo publicitario ni fotografía de estudio. Formato vertical 4:5.`;
    }
    refreshGeneratorProducts();
  }

  waitForApp();
})();
