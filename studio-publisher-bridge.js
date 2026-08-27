(() => {
  async function toFourFive(blob){
    try{
      const bmp=await createImageBitmap(blob),targetRatio=4/5,sourceRatio=bmp.width/bmp.height;
      let sx=0,sy=0,sw=bmp.width,sh=bmp.height;
      if(sourceRatio>targetRatio){sw=Math.round(bmp.height*targetRatio);sx=Math.round((bmp.width-sw)/2);}else if(sourceRatio<targetRatio){sh=Math.round(bmp.width/targetRatio);sy=Math.round((bmp.height-sh)/2);}
      const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;canvas.getContext('2d').drawImage(bmp,sx,sy,sw,sh,0,0,1080,1350);bmp.close?.();
      return await new Promise(resolve=>canvas.toBlob(resolve,'image/png',0.96))||blob;
    }catch{return blob;}
  }
  window.addEventListener('laberinto:studio-media', async (event) => {
    const d=event.detail||{},input=document.querySelector('#aiFile'),brand=document.querySelector('#aiBrand'),context=document.querySelector('#aiContext');
    if(!d.media_url||!input)return;
    try{
      document.querySelector('#tabPublicador')?.click();
      if(brand&&d.brand_id){brand.value=d.brand_id;brand.dispatchEvent(new Event('change',{bubbles:true}));}
      if(context)context.value=`Creada en Estudio IA /${d.frame||'frame'}`;
      const r=await fetch(d.media_url);if(!r.ok)throw new Error('No se pudo recuperar la imagen generada');
      const source=await r.blob(),blob=await toFourFive(source),file=new File([blob],`estudio-${d.frame||'ia'}-4x5.png`,{type:'image/png'}),dt=new DataTransfer();dt.items.add(file);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
      setTimeout(()=>document.querySelector('.ai-publisher')?.scrollIntoView({behavior:'smooth',block:'start'}),250);
    }catch(e){alert(e.message||'No se pudo enviar la imagen al Publicador.');}
  });
})();