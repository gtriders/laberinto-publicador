(() => {
  const API='https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/image-studio';
  const PIN_KEY='laberinto_session_pin';
  const STORAGE_BASE='https://ufsxdlmnjuaymdszyjue.supabase.co/storage/v1/object/public/laberinto-media/';
  const META_KEY='laberinto_ugc_v1_meta';
  const DB_NAME='laberinto_ugc_v1';
  const STORE='references';
  const BRANDS={
    'adria-sushi':'Adrià Sushi',
    'adria-sangucheria':'Sanguchería Adrià',
    'pet':'Adrià PET',
    'chef-rafael':'Chef Rafael',
    'laberinto-digital':'Laberinto Digital'
  };
  const SCENES={eating:'Una persona disfrutando el producto de forma espontánea.',friends:'Personas compartiendo de manera natural.',hand:'Producto real en primer plano, estilo foto de cliente.'};
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const pub=path=>STORAGE_BASE+String(path||'').split('/').map(encodeURIComponent).join('/');
  const meta=()=>{try{return JSON.parse(localStorage.getItem(META_KEY)||'{}')||{};}catch{return{};}};
  const dbp=new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  async function dbGet(id){const db=await dbp;return new Promise((res,rej)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error);});}
  function findProduct(name){const m=meta(),key=String(name||'').trim().toLocaleLowerCase('es');return Object.values(m.products||{}).find(p=>String(p?.name||'').trim().toLocaleLowerCase('es')===key)||null;}
  function placeIds(scene){const p=meta().places||{},pick=(...groups)=>groups.flatMap(g=>p[g]||[]);return scene==='hand'?pick('table','bar','interior','terrace'):pick('interior','terrace','table','bar');}

  function boot(){
    const view=document.querySelector('#ugcView');
    if(!view)return setTimeout(boot,150);
    if(view.dataset.runtimeV2==='1')return;
    view.dataset.runtimeV2='1';

    const productStart=view.querySelector('.ugc-product-start');
    if(!productStart)return setTimeout(()=>{delete view.dataset.runtimeV2;boot();},150);

    const brandWrap=document.createElement('label');
    brandWrap.className='ugc-control';
    brandWrap.style.maxWidth='360px';
    brandWrap.innerHTML=`<strong>Cuenta / Marca</strong><select id="ugcBrand">${Object.entries(BRANDS).map(([id,name])=>`<option value="${id}" ${id==='adria-sangucheria'?'selected':''}>${name}</option>`).join('')}</select>`;
    productStart.parentNode.insertBefore(brandWrap,productStart);

    const brand=view.querySelector('#ugcBrand'),name=view.querySelector('#ugcProductName'),file=view.querySelector('#ugcDirectFile'),ready=view.querySelector('#ugcReady'),status=view.querySelector('#ugcGenStatus'),result=view.querySelector('#ugcResult'),img=view.querySelector('#ugcResultImg'),datalist=view.querySelector('#ugcSavedProducts');
    let lastResult=null,lastRequest=null;

    const replaceButton=(selector,handler)=>{const old=view.querySelector(selector);if(!old)return null;const b=old.cloneNode(true);old.replaceWith(b);b.onclick=handler;return b;};
    const generateBtn=replaceButton('#ugcGenerate',()=>generate());
    const anotherBtn=replaceButton('#ugcAnother',()=>generate());
    const useBtn=replaceButton('#ugcUse',()=>useResult());

    const actions=result.querySelector('.ugc-actions');
    const recoverBtn=document.createElement('button');recoverBtn.id='ugcRecover';recoverBtn.className='btn secondary';recoverBtn.type='button';recoverBtn.textContent='Recuperar resultado';recoverBtn.hidden=true;recoverBtn.onclick=()=>lastRequest&&recover(lastRequest,true);
    const openLink=document.createElement('a');openLink.id='ugcOpenResult';openLink.className='btn secondary';openLink.target='_blank';openLink.rel='noopener noreferrer';openLink.textContent='Abrir imagen';openLink.hidden=true;
    actions?.insertBefore(recoverBtn,useBtn||null);actions?.insertBefore(openLink,useBtn||null);

    brand.onchange=()=>{lastResult=null;lastRequest=null;result.classList.remove('active');status.textContent='';refreshSuggestions();updateReady();};
    name?.addEventListener('input',updateReady);
    file?.addEventListener('change',()=>setTimeout(updateReady,0));
    refreshSuggestions();updateReady();

    function isSang(){return brand.value==='adria-sangucheria';}
    function refreshSuggestions(){if(!datalist)return;if(!isSang()){datalist.innerHTML='';return;}const m=meta();datalist.innerHTML=Object.values(m.products||{}).filter(p=>(p.refs||[]).length).map(p=>`<option value="${String(p.name||'').replace(/"/g,'&quot;')}"></option>`).join('');}
    function updateReady(){const n=name?.value.trim()||'',f=file?.files?.[0]||null,p=isSang()?findProduct(n):null;if(!n){ready.textContent='Escribe el nombre del producto.';ready.className='ugc-status warn';generateBtn.disabled=true;return;}if(f){ready.textContent=p?.refs?.length?'Foto lista · usaré también referencias guardadas.':'Foto lista.';ready.className='ugc-status ok';generateBtn.disabled=false;return;}if(p?.refs?.length){ready.textContent='Usaré las fotos guardadas de este producto.';ready.className='ugc-status ok';generateBtn.disabled=false;return;}ready.textContent='Sube una foto del producto.';ready.className='ugc-status warn';generateBtn.disabled=true;}
    function selectedScene(){return view.querySelector('.ugc-scene.active')?.dataset.scene||'eating';}
    function requestDate(){return new Date().toISOString().slice(0,10);}
    function request(){return{requestId:crypto.randomUUID(),date:requestDate(),brandId:brand.value};}
    function idea(p,sceneId){return `UGC MUY NATURAL para ${BRANDS[brand.value]}. Producto real: ${name.value.trim()}. Escena: ${SCENES[sceneId]||SCENES.eating} Mantener el producto reconocible y fiel a la foto principal. No inventar ingredientes, tamaños, vajilla, mobiliario, carteles ni otros productos. ${p?.ingredients?`Ingredientes confirmados: ${p.ingredients}.`:''} ${p?.size?`Tamaño/proporción real: ${p.size}.`:''} ${p?.presentation?`Presentación real: ${p.presentation}.`:''} Debe parecer una foto de celular tomada por un cliente: personas comunes, expresiones espontáneas, luz ambiente y pequeñas imperfecciones naturales. Formato vertical 4:5.`;}

    async function recover(req,manual=false){
      recoverBtn.hidden=true;
      status.textContent=manual?'Buscando la imagen ya generada…':'Conexión interrumpida. Recuperando la imagen sin volver a generarla…';status.className='ugc-status warn';
      for(let i=0;i<18;i++){
        try{
          const fd=new FormData();fd.append('action','recover');fd.append('pin',sessionStorage.getItem(PIN_KEY)||'');fd.append('brand_id',req.brandId);fd.append('request_id',req.requestId);fd.append('request_date',req.date);
          const r=await fetch(API,{method:'POST',body:fd}),d=await r.json().catch(()=>({}));
          if(r.ok&&d.media_path){show(d);return d;}
        }catch{}
        if(i<17)await sleep(5000);
      }
      status.textContent='La conexión se cortó y todavía no pude recuperar el resultado. Espera un minuto y toca “Recuperar resultado”.';status.className='ugc-status error';recoverBtn.hidden=false;return null;
    }

    function show(d){
      lastResult=d;result.classList.add('active');recoverBtn.hidden=true;openLink.hidden=true;
      status.textContent='Imagen generada. Cargando vista previa…';status.className='ugc-status';
      const stable=d.media_path?pub(d.media_path):d.media_url;let tries=0;
      const load=()=>{tries++;img.onload=()=>{status.textContent='Vista previa lista.';status.className='ugc-status ok';};img.onerror=()=>{if(tries<4){setTimeout(load,1000*tries);return;}status.textContent='La imagen fue generada, pero el iPhone no pudo mostrar la vista previa. Puedes abrirla o enviarla al Publicador.';status.className='ugc-status warn';openLink.href=stable;openLink.hidden=false;};img.src=stable+(stable.includes('?')?'&':'?')+'t='+Date.now();};
      load();result.scrollIntoView({behavior:'smooth',block:'center'});
    }

    async function generate(){
      const productName=name.value.trim();if(!productName)return;
      const saved=isSang()?findProduct(productName):null;
      let primary=file.files?.[0]||null,primaryStored='';
      if(!primary&&saved?.refs?.length){const r=await dbGet(saved.refs[0]);primary=r?.blob||null;primaryStored=saved.refs[0];}
      if(!primary){updateReady();return;}
      const scene=selectedScene(),req=request();lastRequest=req;generateBtn.disabled=true;if(anotherBtn)anotherBtn.disabled=true;recoverBtn.hidden=true;status.textContent='Generando una foto natural…';status.className='ugc-status';
      try{
        const fd=new FormData();fd.append('action','generate');fd.append('pin',sessionStorage.getItem(PIN_KEY)||'');fd.append('file',primary,primary.name||'producto.jpg');fd.append('brand_id',brand.value);fd.append('frame','creative-context');fd.append('answer',saved?.ingredients||'Usar únicamente lo visible en la foto y referencias. No inventar ingredientes.');fd.append('idea',idea(saved,scene));fd.append('ugc_v1','true');fd.append('request_id',req.requestId);fd.append('reference_manifest',JSON.stringify({product:{name:productName,ingredients:saved?.ingredients||'',size:saved?.size||'',presentation:saved?.presentation||''},scene,rule:'No inventar; simplificar si falta evidencia.'}));
        if(isSang()){
          const extra=Array.from(new Set([...(saved?.refs||[]).filter(id=>id!==primaryStored).slice(0,2),...placeIds(scene).slice(0,2)])).slice(0,4);
          for(const id of extra){const r=await dbGet(id);if(r?.blob)fd.append('reference_files',r.blob,r.name||`${id}.jpg`);}
        }
        const r=await fetch(API,{method:'POST',body:fd}),d=await r.json().catch(()=>({}));
        if(!r.ok){const e=new Error(d.error||'Error al generar');e.detail=d.detail||'';throw e;}
        show(d);
      }catch(e){const recovered=await recover(req,false);if(!recovered&&e?.message&&e.message!=='Load failed')status.textContent+=` (${e.message})`;}
      finally{generateBtn.disabled=false;if(anotherBtn)anotherBtn.disabled=false;}
    }

    function useResult(){
      if(!lastResult)return;
      const product=name.value.trim()||'Producto';
      window.dispatchEvent(new CustomEvent('laberinto:studio-media',{detail:{media_url:lastResult.media_url,media_path:lastResult.media_path,brand_id:brand.value,frame:'ugc-v1',context:`UGC natural de ${product} para ${BRANDS[brand.value]}. Mantener producto real y tono de cliente.`}}));
      document.querySelector('#tabPublicador')?.click();
    }
  }
  boot();
})();