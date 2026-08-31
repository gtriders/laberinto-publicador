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
  const seededProducts=[
    'Churrasco','Churrasco Italiano','Lomito','Lomito Italiano','Completo','Completo Italiano','Dinámico','AS','Chacarero','Barros Luco','Barros Jarpa','Chemilico','Chacatofu','Papas fritas','Chorrillana','Salchipapas'
  ];
  const scenes=[
    {id:'eating',name:'Persona comiendo',description:'Una persona disfrutando el producto de forma espontánea.'},
    {id:'friends',name:'Amigos compartiendo',description:'Dos o tres personas compartiendo en una mesa real del local.'},
    {id:'hand',name:'Producto en mano',description:'Foto cercana tipo cliente, con el producto real en primer plano.'}
  ];
  const placeTypes=[
    {id:'terrace',name:'Terraza'},
    {id:'interior',name:'Interior'},
    {id:'table',name:'Mesas / mobiliario'},
    {id:'bar',name:'Barra / entorno'}
  ];

  const css=document.createElement('style');
  css.textContent=`
    .ugc-view{display:none}.ugc-view.active{display:block}.ugc-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.ugc-card{border:1px solid #e7dfd2;background:#fff;border-radius:16px;padding:16px;display:grid;gap:12px}.ugc-card h3{margin:0}.ugc-card label{display:grid;gap:6px;font-weight:750}.ugc-card input,.ugc-card select,.ugc-card textarea{width:100%}.ugc-ref-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.ugc-ref-box{border:1px dashed #d8cfc0;border-radius:13px;padding:10px;min-height:120px;background:#faf8f4}.ugc-ref-box strong{display:block;font-size:.82rem;margin-bottom:7px}.ugc-thumbs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.ugc-thumb{position:relative}.ugc-thumb img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:8px;display:block}.ugc-thumb button{position:absolute;right:3px;top:3px;width:22px;height:22px;border:0;border-radius:50%;background:rgba(0,0,0,.72);color:#fff;cursor:pointer}.ugc-mini{font-size:.78rem;color:#756b5d;line-height:1.4}.ugc-product-list{display:grid;gap:8px}.ugc-product-row{display:flex;gap:8px;align-items:center;border-top:1px solid #eee5d9;padding-top:8px}.ugc-product-row span{flex:1}.ugc-product-row small{color:#756b5d}.ugc-scenes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.ugc-scene{border:1px solid #e7dfd2;border-radius:14px;padding:12px;background:#fff;text-align:left;cursor:pointer}.ugc-scene.active{outline:2px solid #111827}.ugc-scene strong{display:block}.ugc-scene small{display:block;color:#756b5d;margin-top:5px;line-height:1.35}.ugc-result{display:none;margin-top:14px}.ugc-result.active{display:block}.ugc-result img{width:100%;max-width:640px;border-radius:16px;display:block}.ugc-actions{display:flex;gap:8px;flex-wrap:wrap}.ugc-status{font-size:.9rem;color:#655c50}.ugc-status.ok{color:#287245}.ugc-status.warn{color:#8a6400}.ugc-status.error{color:#a33232}.ugc-rule{background:#f7f2ea;border-radius:12px;padding:12px;font-size:.84rem;line-height:1.45}.ugc-full{grid-column:1/-1}@media(max-width:760px){.ugc-grid{grid-template-columns:1fr}.ugc-ref-grid,.ugc-scenes{grid-template-columns:1fr}.ugc-full{grid-column:auto}}
  `;
  document.head.appendChild(css);

  const defaultMeta=()=>({
    site:DEFAULT_SITE,
    places:{terrace:[],interior:[],table:[],bar:[]},
    products:Object.fromEntries(seededProducts.map(name=>[slug(name),{id:slug(name),name,ingredients:'',size:'',presentation:'',refs:[]}]))
  });
  function slug(s=''){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')||('p-'+Date.now());}
  function loadMeta(){try{const d=JSON.parse(localStorage.getItem(META_KEY)||'null');if(!d)return defaultMeta();const base=defaultMeta();return {...base,...d,places:{...base.places,...(d.places||{})},products:{...base.products,...(d.products||{})}};}catch{return defaultMeta();}}
  function saveMeta(){localStorage.setItem(META_KEY,JSON.stringify(meta));window.dispatchEvent(new CustomEvent('laberinto:ugc-meta-updated'));}
  let meta=loadMeta();

  const dbp=new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  async function dbPut(rec){const db=await dbp;return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(rec);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});}
  async function dbGet(id){const db=await dbp;return new Promise((res,rej)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error);});}
  async function dbDelete(id){const db=await dbp;return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});}
  function makeId(prefix='ref'){return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;}
  async function addFiles(files,target,productId=''){
    for(const file of files){if(!file.type.startsWith('image/'))continue;const id=makeId(target);await dbPut({id,target,productId,name:file.name,type:file.type,blob:file,createdAt:new Date().toISOString()});if(productId){meta.products[productId].refs=Array.from(new Set([...(meta.products[productId].refs||[]),id]));}else{meta.places[target]=Array.from(new Set([...(meta.places[target]||[]),id]));}}
    saveMeta();
  }
  async function removeRef(id,target,productId=''){await dbDelete(id);if(productId){const p=meta.products[productId];if(p)p.refs=(p.refs||[]).filter(x=>x!==id);}else meta.places[target]=(meta.places[target]||[]).filter(x=>x!==id);saveMeta();}
  async function blobUrl(id){const rec=await dbGet(id);return rec?.blob?URL.createObjectURL(rec.blob):'';}
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));

  async function renderRefs(root,ids,target,productId=''){
    root.innerHTML='';
    for(const id of ids||[]){const url=await blobUrl(id);if(!url)continue;const w=document.createElement('div');w.className='ugc-thumb';w.innerHTML=`<img src="${url}" alt="Referencia"><button type="button" title="Eliminar">×</button>`;w.querySelector('button').onclick=async()=>{URL.revokeObjectURL(url);await removeRef(id,target,productId);if(productId)renderProductEditor();else renderPlaceRefs();};root.appendChild(w);}
  }

  function waitForApp(){const settings=document.querySelector('#settingsView'),tabs=document.querySelector('.app-tabs'),publicador=document.querySelector('main.main-view');if(!settings||!tabs||!publicador)return setTimeout(waitForApp,180);mountSettings(settings);mountStudio(tabs,settings,publicador);}

  function mountSettings(settings){if(document.querySelector('#ugcSettingsCard'))return;const grid=settings.querySelector('.settings-grid');if(!grid)return;
    const card=document.createElement('article');card.id='ugcSettingsCard';card.className='settings-card settings-full';card.innerHTML=`
      <span class="eyebrow">UGC IA · V1</span><h3>Referencias reales de Sanguchería Adrià</h3>
      <p class="helper">Se configura una vez. El generador usa estas referencias para no pedir prompts y para reducir invenciones.</p>
      <div class="ugc-rule"><strong>Regla fija:</strong> si existe evidencia real, usarla. Si falta evidencia, simplificar antes que inventar. El producto, sus ingredientes visibles, el tamaño y el local deben mantenerse fieles a las referencias.</div>
      <div class="settings-row"><input id="ugcSite" type="url" value="${esc(meta.site||DEFAULT_SITE)}"><button id="ugcOpenSite" class="btn secondary" type="button">Abrir web</button><span class="settings-status">Catálogo oficial de referencia</span></div>
      <div class="ugc-ref-grid">${placeTypes.map(x=>`<div class="ugc-ref-box"><strong>${x.name}</strong><div class="ugc-thumbs" id="ugcPlace_${x.id}"></div><label class="btn secondary file-label" style="margin-top:8px">+ Fotos<input data-place="${x.id}" class="ugcPlaceInput" type="file" accept="image/*" multiple hidden></label></div>`).join('')}</div>
      <div class="settings-tools"><span class="eyebrow">PRODUCTOS</span><div class="settings-row"><select id="ugcProductSelect"></select><button id="ugcNewProduct" class="btn secondary" type="button">+ Producto</button></div><div id="ugcProductEditor"></div><div id="ugcProductList" class="ugc-product-list"></div></div>`;
    const admin=document.querySelector('#settingsAdminActions')?.closest('.settings-card');grid.insertBefore(card,admin||null);
    document.querySelector('#ugcSite').addEventListener('change',e=>{meta.site=e.target.value.trim()||DEFAULT_SITE;saveMeta();});
    document.querySelector('#ugcOpenSite').onclick=()=>window.open(meta.site||DEFAULT_SITE,'_blank','noopener,noreferrer');
    card.querySelectorAll('.ugcPlaceInput').forEach(input=>input.onchange=async()=>{await addFiles([...input.files],input.dataset.place);input.value='';renderPlaceRefs();});
    document.querySelector('#ugcNewProduct').onclick=()=>{const name=prompt('Nombre exacto del producto');if(!name)return;const id=slug(name);if(!meta.products[id])meta.products[id]={id,name,ingredients:'',size:'',presentation:'',refs:[]};saveMeta();renderProductSelect(id);renderProductEditor();renderProductList();};
    document.querySelector('#ugcProductSelect').onchange=renderProductEditor;
    renderPlaceRefs();renderProductSelect();renderProductEditor();renderProductList();
  }
  function renderPlaceRefs(){placeTypes.forEach(x=>{const root=document.querySelector(`#ugcPlace_${x.id}`);if(root)renderRefs(root,meta.places[x.id]||[],x.id);});}
  function renderProductSelect(preferred=''){const sel=document.querySelector('#ugcProductSelect');if(!sel)return;const current=preferred||sel.value;sel.innerHTML=Object.values(meta.products).sort((a,b)=>a.name.localeCompare(b.name,'es')).map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');if(current&&meta.products[current])sel.value=current;}
  function renderProductList(){const root=document.querySelector('#ugcProductList');if(!root)return;const items=Object.values(meta.products).filter(p=>(p.refs||[]).length||p.ingredients||p.size||p.presentation).sort((a,b)=>a.name.localeCompare(b.name,'es'));root.innerHTML=items.length?items.map(p=>`<div class="ugc-product-row"><span><strong>${esc(p.name)}</strong><br><small>${(p.refs||[]).length} foto(s) · ${esc(p.ingredients||'sin ingredientes confirmados')}</small></span><button type="button" class="btn secondary" data-edit="${esc(p.id)}">Editar</button></div>`).join(''):'<span class="settings-status">Aún no hay productos configurados. Elige uno y agrega sus fotos reales.</span>';root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{renderProductSelect(b.dataset.edit);renderProductEditor();document.querySelector('#ugcProductEditor')?.scrollIntoView({behavior:'smooth',block:'center'});});}
  function renderProductEditor(){const root=document.querySelector('#ugcProductEditor'),sel=document.querySelector('#ugcProductSelect');if(!root||!sel)return;const p=meta.products[sel.value];if(!p){root.innerHTML='';return;}root.innerHTML=`<div class="ugc-card" style="margin-top:10px"><div class="settings-row"><strong>${esc(p.name)}</strong><span class="settings-status">${(p.refs||[]).length} referencia(s)</span></div><div class="voice-fields"><label>Ingredientes visibles<textarea id="ugcIngredients" rows="2" placeholder="Ej: vienesa, tomate, palta, mayonesa">${esc(p.ingredients||'')}</textarea></label><label>Tamaño / proporción<input id="ugcSize" type="text" value="${esc(p.size||'')}" placeholder="Ej: pan 22 cm, plato 28 cm"></label><label class="wide">Presentación real<textarea id="ugcPresentation" rows="2" placeholder="Ej: soporte verde, plato blanco, papas al costado">${esc(p.presentation||'')}</textarea></label></div><div class="ugc-thumbs" id="ugcProductThumbs"></div><div class="settings-row"><label class="btn secondary file-label">+ Fotos del producto<input id="ugcProductPhotos" type="file" accept="image/*" multiple hidden></label><button id="ugcSaveProduct" class="btn primary" type="button">Guardar producto</button></div></div>`;
    renderRefs(root.querySelector('#ugcProductThumbs'),p.refs||[],'product',p.id);
    root.querySelector('#ugcProductPhotos').onchange=async e=>{await addFiles([...e.target.files],'product',p.id);e.target.value='';renderProductEditor();renderProductList();};
    root.querySelector('#ugcSaveProduct').onclick=()=>{p.ingredients=root.querySelector('#ugcIngredients').value.trim();p.size=root.querySelector('#ugcSize').value.trim();p.presentation=root.querySelector('#ugcPresentation').value.trim();saveMeta();renderProductList();const b=root.querySelector('#ugcSaveProduct');b.textContent='Guardado ✓';setTimeout(()=>b.textContent='Guardar producto',1200);};
  }

  function mountStudio(tabs,settings,publicador){if(document.querySelector('#tabUGC'))return;const settingsBtn=document.querySelector('#tabSettings');const btn=document.createElement('button');btn.id='tabUGC';btn.className='app-tab';btn.type='button';btn.textContent='UGC IA';tabs.insertBefore(btn,settingsBtn||null);
    const view=document.createElement('main');view.id='ugcView';view.className='shell ugc-view';view.innerHTML=`<section class="panel"><div class="panel-heading"><div><span class="eyebrow">UGC IA · V1</span><h2>Comida real. Gente real.</h2></div></div><p class="helper">Sin prompts. Elige el producto y la escena; el Publicador usa las referencias guardadas en Configuración.</p><div class="ugc-grid"><article class="ugc-card"><label>Marca<select disabled><option>${brandName}</option></select></label><label>Producto<select id="ugcGenProduct"></select></label><div><strong>Escena</strong><div id="ugcScenes" class="ugc-scenes" style="margin-top:8px">${scenes.map((s,i)=>`<button type="button" class="ugc-scene ${i===0?'active':''}" data-scene="${s.id}"><strong>${s.name}</strong><small>${s.description}</small></button>`).join('')}</div></div><div id="ugcReady" class="ugc-status"></div><button id="ugcGenerate" class="btn primary" type="button">Generar imagen</button></article><article class="ugc-card"><span class="eyebrow">REGLA AUTOMÁTICA</span><h3>Máxima fidelidad</h3><div class="ugc-rule">El generador no debe crear ingredientes, vajilla, mobiliario o productos que no estén respaldados por las referencias. Debe parecer una foto auténtica de cliente, con imperfecciones normales y sin estética de modelo publicitario.</div><div class="ugc-mini">Formato V1: Instagram 4:5 · estilo UGC natural · invención baja.</div><div id="ugcGenStatus" class="ugc-status">Elige un producto configurado.</div></article><div id="ugcResult" class="ugc-card ugc-full ugc-result"><img id="ugcResultImg" alt="UGC generado"><div class="ugc-actions"><button id="ugcAnother" class="btn secondary" type="button">Otra versión</button><button id="ugcUse" class="btn primary" type="button">Usar en publicación</button></div></div></div></section>`;settings.insertAdjacentElement('beforebegin',view);
    let scene=scenes[0].id,lastResult=null;
    const hide=()=>view.classList.remove('active');document.querySelector('#tabPublicador')?.addEventListener('click',hide);document.querySelector('#tabPlanner')?.addEventListener('click',hide);document.querySelector('#tabStudio')?.addEventListener('click',hide);document.querySelector('#tabSettings')?.addEventListener('click',hide);
    btn.onclick=()=>{publicador.classList.add('settings-hidden');settings.classList.remove('active');document.querySelector('#plannerView')?.classList.remove('active');document.querySelector('#studioView')?.classList.remove('active');view.classList.add('active');document.querySelectorAll('.app-tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');refreshGeneratorProducts();};
    view.querySelectorAll('.ugc-scene').forEach(x=>x.onclick=()=>{view.querySelectorAll('.ugc-scene').forEach(y=>y.classList.remove('active'));x.classList.add('active');scene=x.dataset.scene;});
    view.querySelector('#ugcGenProduct').onchange=updateReady;
    view.querySelector('#ugcGenerate').onclick=()=>generate(scene);
    view.querySelector('#ugcAnother').onclick=()=>generate(scene);
    view.querySelector('#ugcUse').onclick=()=>{if(!lastResult)return;window.dispatchEvent(new CustomEvent('laberinto:studio-media',{detail:{media_url:lastResult.media_url,media_path:lastResult.media_path,brand_id:brandId,frame:'ugc-v1'}}));document.querySelector('#tabPublicador')?.click();};
    window.addEventListener('laberinto:ugc-meta-updated',()=>{if(view.classList.contains('active'))refreshGeneratorProducts();});

    function refreshGeneratorProducts(){meta=loadMeta();const sel=view.querySelector('#ugcGenProduct');const configured=Object.values(meta.products).filter(p=>(p.refs||[]).length);sel.innerHTML=configured.length?configured.sort((a,b)=>a.name.localeCompare(b.name,'es')).map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join(''):'<option value="">Configura primero un producto</option>';updateReady();}
    function updateReady(){const p=meta.products[view.querySelector('#ugcGenProduct').value],ready=view.querySelector('#ugcReady'),gen=view.querySelector('#ugcGenerate');if(!p){ready.textContent='Ve a Configuración → UGC IA y agrega fotos reales de un producto.';ready.className='ugc-status warn';gen.disabled=true;return;}const placeCount=Object.values(meta.places).reduce((n,a)=>n+(a?.length||0),0);ready.textContent=`${p.refs.length} foto(s) del producto · ${placeCount} referencia(s) del local.`;ready.className='ugc-status '+(placeCount?'ok':'warn');gen.disabled=false;}
    async function generate(sceneId){const p=meta.products[view.querySelector('#ugcGenProduct').value];if(!p?.refs?.length)return;const status=view.querySelector('#ugcGenStatus'),button=view.querySelector('#ugcGenerate');button.disabled=true;status.textContent='Generando UGC natural con referencias reales…';status.className='ugc-status';try{const primary=await dbGet(p.refs[0]);if(!primary?.blob)throw new Error('No pude abrir la foto principal del producto.');const fd=new FormData();fd.append('action','generate');fd.append('pin',sessionStorage.getItem(PIN_KEY)||'');fd.append('file',primary.blob,primary.name||'producto.jpg');fd.append('brand_id',brandId);fd.append('frame','creative-context');fd.append('answer',p.ingredients||'Usar únicamente lo visible en las referencias.');fd.append('idea',buildIdea(p,sceneId));fd.append('ugc_v1','true');fd.append('reference_manifest',JSON.stringify({site:meta.site,product:{name:p.name,ingredients:p.ingredients,size:p.size,presentation:p.presentation},scene:sceneId,rule:'No inventar. Si falta evidencia, simplificar.'}));const extraIds=[...(p.refs||[]).slice(1,4),...(meta.places.terrace||[]).slice(0,2),...(meta.places.interior||[]).slice(0,1),...(meta.places.table||[]).slice(0,1)];for(const id of extraIds){const r=await dbGet(id);if(r?.blob)fd.append('reference_files',r.blob,r.name||`${id}.jpg`);}const resp=await fetch(IMAGE_API,{method:'POST',body:fd});const d=await resp.json().catch(()=>({}));if(!resp.ok){const e=new Error(d.error||'Error al generar');e.detail=d.detail||'';throw e;}lastResult=d;view.querySelector('#ugcResultImg').src=d.media_url;view.querySelector('#ugcResult').classList.add('active');status.textContent='Lista. Si no convence, usa “Otra versión”.';status.className='ugc-status ok';view.querySelector('#ugcResult').scrollIntoView({behavior:'smooth',block:'center'});}catch(e){status.textContent=e.message+(e.detail?` — ${e.detail}`:'');status.className='ugc-status error';}finally{button.disabled=false;}}
    function buildIdea(p,sceneId){const sceneText=scenes.find(s=>s.id===sceneId)?.description||'';return `UGC MUY NATURAL para ${brandName}. Producto real: ${p.name}. Escena: ${sceneText} REGLA ESTRICTA: no inventar ingredientes, tamaños, vajilla, mobiliario, carteles ni productos. Conservar el producto lo más parecido posible a la foto real. ${p.ingredients?`Ingredientes visibles confirmados: ${p.ingredients}.`:''} ${p.size?`Tamaño/proporción real: ${p.size}.`:''} ${p.presentation?`Presentación real: ${p.presentation}.`:''} Usar el local real como referencia cuando esté disponible. Apariencia de foto de celular tomada por cliente, personas comunes y expresiones espontáneas, luz ambiente real, pequeñas imperfecciones naturales, nada de modelo publicitario ni fotografía de estudio. Si algo no está respaldado por una referencia, simplificar en vez de inventarlo. Sitio oficial de contexto: ${meta.site||DEFAULT_SITE}. Formato vertical 4:5.`;}
    refreshGeneratorProducts();
  }

  waitForApp();
})();