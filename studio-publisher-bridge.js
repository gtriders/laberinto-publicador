(() => {
  window.addEventListener('laberinto:studio-media', async (event) => {
    const d=event.detail||{},input=document.querySelector('#aiFile'),brand=document.querySelector('#aiBrand'),context=document.querySelector('#aiContext');
    if(!d.media_url||!input)return;
    try{
      document.querySelector('#tabPublicador')?.click();
      if(brand&&d.brand_id){brand.value=d.brand_id;brand.dispatchEvent(new Event('change',{bubbles:true}));}
      if(context)context.value=`Creada en Estudio IA /${d.frame||'frame'}`;
      const r=await fetch(d.media_url);if(!r.ok)throw new Error('No se pudo recuperar la imagen generada');
      const blob=await r.blob(),file=new File([blob],`estudio-${d.frame||'ia'}.png`,{type:blob.type||'image/png'}),dt=new DataTransfer();dt.items.add(file);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
      setTimeout(()=>document.querySelector('.ai-publisher')?.scrollIntoView({behavior:'smooth',block:'start'}),250);
    }catch(e){alert(e.message||'No se pudo enviar la imagen al Publicador.');}
  });
})();