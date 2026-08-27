(() => {
  const TARGETS=new Set(['studioFile']);
  async function normalize(file){
    const url=URL.createObjectURL(file);
    try{
      const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('No se pudo leer esta foto'));i.src=url;});
      const max=2048,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
      const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
      const c=document.createElement('canvas');c.width=w;c.height=h;
      const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
      const blob=await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('No se pudo convertir la foto')),'image/jpeg',0.94));
      return new File([blob],(file.name||'foto').replace(/\.[^.]+$/,'')+'-compatible.jpg',{type:'image/jpeg',lastModified:Date.now()});
    } finally { URL.revokeObjectURL(url); }
  }
  document.addEventListener('change',async e=>{
    const input=e.target;if(!(input instanceof HTMLInputElement)||!TARGETS.has(input.id)||input.dataset.normalizing==='done')return;
    const file=input.files?.[0];if(!file)return;
    e.preventDefault();e.stopImmediatePropagation();
    input.dataset.normalizing='busy';
    try{
      const fixed=await normalize(file),dt=new DataTransfer();dt.items.add(fixed);input.files=dt.files;input.dataset.normalizing='done';input.dispatchEvent(new Event('change',{bubbles:true}));
    }catch(err){
      input.dataset.normalizing='done';input.dispatchEvent(new Event('change',{bubbles:true}));
      console.warn('Image normalization skipped',err);
    }
    setTimeout(()=>delete input.dataset.normalizing,0);
  },true);
})();