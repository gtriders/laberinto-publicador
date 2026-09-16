(() => {
  const KEY='laberinto-publicador-draft-v1';
  const PIN_KEY='laberinto_session_pin';
  let ready=false,restoring=false,saveTimer=null;

  const $=s=>document.querySelector(s);
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch{return null;}};
  const write=state=>{try{localStorage.setItem(KEY,JSON.stringify({...state,saved_at:new Date().toISOString()}));}catch{}};
  const clear=()=>{try{localStorage.removeItem(KEY);}catch{}};
  const mediaUrls=()=>[...document.querySelectorAll('#mediaGrid img')].map(img=>img.src).filter(Boolean);
  const snapshot=()=>({
    brand_id:$('#aiBrand')?.value||'adria-sushi',
    context:$('#aiContext')?.value||'',
    title:$('#aiTitle')?.value||'',
    caption:$('#aiCaption')?.value||'',
    scheduled_at:$('#aiSchedule')?.value||'',
    media_urls:mediaUrls()
  });
  const hasContent=s=>!!(s&&(s.media_urls?.length||s.context||s.title||s.caption));
  const save=()=>{
    if(!ready||restoring)return;
    const s=snapshot();
    if(hasContent(s))write(s);else clear();
  };
  const queueSave=()=>{clearTimeout(saveTimer);saveTimer=setTimeout(save,180);};

  async function urlToFile(url,index){
    const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('No se pudo recuperar una imagen del borrador');
    const blob=await r.blob(),type=blob.type||'image/png',ext=type.includes('jpeg')?'jpg':type.includes('webp')?'webp':'png';
    return new File([blob],`borrador-${index+1}.${ext}`,{type});
  }

  async function restore(){
    const saved=read();
    ready=true;
    if(!hasContent(saved))return;
    restoring=true;
    try{
      if($('#aiBrand')&&saved.brand_id){$('#aiBrand').value=saved.brand_id;$('#aiBrand').dispatchEvent(new Event('change',{bubbles:true}));}
      if($('#aiContext'))$('#aiContext').value=saved.context||'';
      if($('#aiTitle'))$('#aiTitle').value=saved.title||'';
      if($('#aiCaption'))$('#aiCaption').value=saved.caption||'';
      if($('#aiSchedule')&&saved.scheduled_at)$('#aiSchedule').value=saved.scheduled_at;
      const urls=Array.isArray(saved.media_urls)?saved.media_urls.filter(Boolean):[];
      if(urls.length&&$('#aiFile')&&document.querySelectorAll('#mediaGrid img').length===0){
        const status=$('#aiStatus');if(status)status.textContent='Recuperando tu borrador guardado…';
        const files=await Promise.all(urls.slice(0,10).map(urlToFile));
        const dt=new DataTransfer();files.forEach(f=>dt.items.add(f));
        $('#aiFile').files=dt.files;$('#aiFile').dispatchEvent(new Event('change',{bubbles:true}));
      }else if($('#aiStatus')){
        $('#aiStatus').textContent='Borrador recuperado. Continúa donde lo dejaste.';
      }
    }catch(e){
      const status=$('#aiStatus');if(status)status.textContent='Tu borrador está guardado, pero no pude recuperar una imagen ahora. Intenta recargar.';
    }finally{
      setTimeout(()=>{restoring=false;queueSave();},1200);
    }
  }

  function bind(){
    const root=$('.ai-publisher');if(!root)return setTimeout(bind,150);
    ['#aiBrand','#aiContext','#aiTitle','#aiCaption','#aiSchedule'].forEach(sel=>{
      const el=$(sel);if(!el)return;el.addEventListener('input',queueSave);el.addEventListener('change',queueSave);
    });
    const grid=$('#mediaGrid');if(grid)new MutationObserver(queueSave).observe(grid,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
    window.addEventListener('laberinto:composer-reset',()=>clear());
    window.addEventListener('laberinto:studio-media',e=>{
      const d=e.detail||{};if(!d.media_url)return;
      const current=read()||snapshot();current.brand_id=d.brand_id||current.brand_id;current.media_urls=[d.media_url];write(current);
    });
    const start=()=>restore();
    if(sessionStorage.getItem(PIN_KEY))start();else window.addEventListener('laberinto:authenticated',start,{once:true});
  }
  bind();
})();
