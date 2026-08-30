(()=>{
  let pending=null;
  const wait=(sel,tries=40)=>new Promise((resolve,reject)=>{const tick=()=>{const el=document.querySelector(sel);if(el)return resolve(el);if(--tries<=0)return reject(new Error('Estudio IA no está disponible'));setTimeout(tick,100)};tick()});
  async function loadRescue(d){
    pending=d;
    try{
      const tab=await wait('#tabStudio');tab.click();
      const brand=await wait('#studioBrand'),input=await wait('#studioFile'),idea=await wait('#studioIdea');
      brand.value=d.brand_id||'adria-sushi';brand.dispatchEvent(new Event('change',{bubbles:true}));
      idea.value='Recrear esta publicación histórica con un enfoque actual. Mantener fielmente el producto real y no inventar ingredientes. '+(d.original_timestamp?'Publicación original: '+new Date(d.original_timestamp).toLocaleDateString('es-CL')+'. ':'')+(d.original_caption?'Contexto original: '+String(d.original_caption).slice(0,500):'');
      const r=await fetch(d.media_url,{cache:'no-store'});if(!r.ok)throw new Error('No pude cargar la imagen rescatada');
      const blob=await r.blob(),type=blob.type||'image/jpeg',ext=type.includes('png')?'png':type.includes('webp')?'webp':'jpg';
      const file=new File([blob],`rescate-instagram.${ext}`,{type});
      const dt=new DataTransfer();dt.items.add(file);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
      const status=document.querySelector('#studioStatus');if(status)status.textContent='Rescate cargado desde Instagram. Elige un estilo y pulsa “Analizar antes de crear”.';
      document.querySelector('#studioView')?.scrollIntoView({behavior:'smooth',block:'start'});
      pending=null;
    }catch(e){const status=document.querySelector('#igRescueStatus');if(status)status.textContent='No se pudo abrir el rescate en Estudio IA: '+e.message;}
  }
  window.addEventListener('laberinto:rescue-to-studio',e=>loadRescue(e.detail||{}));
})();