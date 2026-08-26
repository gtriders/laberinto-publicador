(() => {
  const API='https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/laberinto-api';
  const PIN_KEY='laberinto_session_pin';
  const getPin=()=>sessionStorage.getItem(PIN_KEY)||'';
  const api=async body=>{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,pin:getPin()})});const d=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(d.error||'Error de conexión');e.detail=d.detail||'';throw e;}return d;};

  function mount(){
    if(document.querySelector('#queueEditAI')) return true;
    const save=document.querySelector('#queueEditSave');
    const msg=document.querySelector('#queueEditMsg');
    if(!save||!msg) return false;
    const btn=document.createElement('button');
    btn.id='queueEditAI';
    btn.type='button';
    btn.className='btn secondary';
    btn.textContent='Actualizar con IA';
    save.insertAdjacentElement('beforebegin',btn);

    btn.addEventListener('click',async()=>{
      const id=document.querySelector('#queueEditId')?.value||'';
      const caption=document.querySelector('#queueEditCaption')?.value.trim()||'';
      if(!id){msg.textContent='No pude identificar la publicación.';msg.className='queue-edit-msg error';return;}
      btn.disabled=true;
      msg.textContent='Actualizando con la voz de marca actual...';
      msg.className='queue-edit-msg';
      try{
        const listed=await api({action:'list'});
        const item=(listed.items||[]).find(x=>x.id===id);
        if(!item) throw new Error('Publicación no encontrada');
        if(!['scheduled','draft','ready','failed'].includes(item.status)) throw new Error('Esta publicación ya está en proceso y no se puede actualizar');
        const urls=(Array.isArray(item.media_items)&&item.media_items.length?item.media_items.map(x=>x.media_url):[item.media_url]).filter(Boolean);
        const context=`Reescribe el texto de esta publicación usando el manual y la voz de marca ACTUALES. Conserva los hechos reales que ya aparecen en el texto y en las imágenes. No inventes precios, promociones, ingredientes, fechas, beneficios, disponibilidad ni datos nuevos. Mantén la intención de la publicación, pero mejora el tono para que represente la voz actual de la marca. Texto actual: ${caption}`;
        const result=await api({action:'analyze',brand_id:item.brand_id,media_urls:urls,context});
        const a=result.analysis||{};
        if(a.title) document.querySelector('#queueEditTitle').value=a.title;
        const tags=Array.isArray(a.hashtags)&&a.hashtags.length?'\n\n'+a.hashtags.join(' '):'';
        if(a.caption) document.querySelector('#queueEditCaption').value=a.caption+tags;
        const warnings=Array.isArray(a.warnings)?a.warnings.filter(Boolean):[];
        msg.textContent=warnings.length?'Texto actualizado. Revisa antes de guardar: '+warnings.join(' · '):'Texto actualizado con la voz de marca actual. Revisa y guarda los cambios.';
      }catch(e){
        msg.textContent=e.message+(e.detail?' · '+e.detail:'');
        msg.className='queue-edit-msg error';
      }finally{btn.disabled=false;}
    });
    return true;
  }

  if(!mount()){
    let tries=0;
    const timer=setInterval(()=>{tries++;if(mount()||tries>80)clearInterval(timer);},200);
  }
})();