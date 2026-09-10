(() => {
  const TARGET_IDS=new Set(['studioFile','ugcDirectFile','ugcProductPhotos']);
  const isTarget=input=>TARGET_IDS.has(input.id)||input.classList.contains('ugcPlaceInput');

  async function normalize(file){
    const url=URL.createObjectURL(file);
    try{
      const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('No se pudo leer esta foto'));i.src=url;});
      const max=2048,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
      const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
      const c=document.createElement('canvas');c.width=w;c.height=h;
      const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
      const blob=await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('No se pudo convertir la foto')),'image/jpeg',0.94));
      const base=(file.name||'foto').replace(/\.[^.]+$/,'');
      return new File([blob],`${base}-compatible.jpg`,{type:'image/jpeg',lastModified:Date.now()});
    } finally { URL.revokeObjectURL(url); }
  }

  document.addEventListener('change',async e=>{
    const input=e.target;
    if(!(input instanceof HTMLInputElement)||!isTarget(input)||input.dataset.normalizing==='done')return;
    const files=[...(input.files||[])];if(!files.length)return;
    e.preventDefault();e.stopImmediatePropagation();
    input.dataset.normalizing='busy';
    try{
      const dt=new DataTransfer();
      for(const file of files){
        try{dt.items.add(await normalize(file));}
        catch(err){console.warn('Image normalization skipped',file.name,err);dt.items.add(file);}
      }
      input.files=dt.files;
      input.dataset.normalizing='done';
      input.dispatchEvent(new Event('change',{bubbles:true}));
    }catch(err){
      console.warn('Image normalization failed',err);
      input.dataset.normalizing='done';
      input.dispatchEvent(new Event('change',{bubbles:true}));
    }
    setTimeout(()=>delete input.dataset.normalizing,0);
  },true);
})();