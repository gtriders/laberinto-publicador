(() => {
  const API='https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/laberinto-api';
  const PIN_KEY='laberinto_session_pin';
  const brands={
    'adria-sushi':'Adrià Sushi',
    'adria-sangucheria':'Sanguchería Adrià',
    'pet':'Adrià PET',
    'chef-rafael':'Chef Rafael',
    'laberinto-digital':'Laberinto Digital'
  };
  const getPin=()=>sessionStorage.getItem(PIN_KEY)||'';
  const call=async body=>{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,pin:getPin()})});const d=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(d.error||'Error de conexión');e.detail=d.detail||'';throw e;}return d;};
  const uploadBlob=async(blob,brandId)=>{const fd=new FormData();fd.append('action','upload');fd.append('pin',getPin());fd.append('brand_id',brandId);fd.append('file',new File([blob],'story-rescue.jpg',{type:'image/jpeg'}));const r=await fetch(API,{method:'POST',body:fd}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'No se pudo guardar la historia');return d;};
  const localValue=(d)=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
  const defaultTime=()=>{const d=new Date();d.setDate(d.getDate()+1);d.setHours(13,0,0,0);return localValue(d)};
  const css=document.createElement('style');css.textContent=`
    .ig-rescue-card-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.ig-rescue-card-actions .btn{width:100%}
    #igStoryEditor{width:min(760px,94vw);border:0;border-radius:18px;padding:0;box-shadow:0 30px 90px rgba(0,0,0,.3)}#igStoryEditor::backdrop{background:rgba(17,24,39,.72)}
    .ig-story-editor{padding:20px;display:grid;gap:14px}.ig-story-grid{display:grid;grid-template-columns:minmax(210px,.78fr) minmax(300px,1.22fr);gap:16px}.ig-story-preview-wrap{background:#111827;border-radius:16px;padding:10px;display:grid;place-items:center}.ig-story-preview-wrap img{width:100%;max-height:520px;object-fit:contain;border-radius:12px}.ig-story-fields{display:grid;gap:10px}.ig-story-fields label{display:grid;gap:5px;font-weight:650}.ig-story-fields textarea{min-height:120px;width:100%}.ig-story-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.ig-story-status{font-size:.9rem;color:#655c50}.ig-story-hint{font-size:.82rem;color:#756b5d}
    @media(max-width:620px){.ig-story-grid{grid-template-columns:1fr}.ig-story-editor{padding:14px}}
  `;document.head.appendChild(css);

  const dialog=document.createElement('dialog');dialog.id='igStoryEditor';dialog.innerHTML=`<div class="ig-story-editor"><div class="panel-heading"><div><span class="eyebrow">RESCATE → HISTORIA</span><h2 id="igStoryHeading">Preparar historia</h2></div><button id="igStoryClose" class="icon-btn" type="button">×</button></div><div class="ig-story-grid"><div class="ig-story-preview-wrap"><img id="igStoryPreview" alt="Vista previa del rescate"></div><div class="ig-story-fields"><p class="ig-story-hint">Laberinto adapta la foto a 9:16 y escribe el texto dentro de la imagen, porque las historias no usan un copy visible como el feed.</p><label>Texto sobre la historia<textarea id="igStoryText" maxlength="180" placeholder="Ej: Un clásico que sigue acá."></textarea></label><button id="igStoryAnalyze" class="btn secondary" type="button">Actualizar texto con IA</button><label>Fecha y hora<input id="igStorySchedule" type="datetime-local"></label><div id="igStoryStatus" class="ig-story-status"></div></div></div><div class="ig-story-actions"><button id="igStoryCancel" class="btn secondary" type="button">Cancelar</button><button id="igStoryNow" class="btn secondary" type="button">Publicar ahora</button><button id="igStoryScheduleBtn" class="btn primary" type="button">Programar historia</button></div></div>`;document.body.appendChild(dialog);

  const $=s=>document.querySelector(s);
  let current={brandId:'',mediaId:'',sourceUrl:'',imported:null,originalCaption:'',analysis:null};
  const status=t=>{$('#igStoryStatus').textContent=t};

  async function renderStoryBlob(imageUrl,text,brandName){
    const r=await fetch(imageUrl);if(!r.ok)throw new Error('No se pudo cargar la imagen para preparar la historia');
    const srcBlob=await r.blob(),obj=URL.createObjectURL(srcBlob),img=new Image();
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('No se pudo procesar la imagen'));img.src=obj;});
    const c=document.createElement('canvas');c.width=1080;c.height=1920;const ctx=c.getContext('2d');
    ctx.fillStyle='#111827';ctx.fillRect(0,0,c.width,c.height);
    const cover=Math.max(c.width/img.width,c.height/img.height),cw=img.width*cover,ch=img.height*cover;
    ctx.save();ctx.filter='blur(30px)';ctx.globalAlpha=.72;ctx.drawImage(img,(c.width-cw)/2,(c.height-ch)/2,cw,ch);ctx.restore();
    ctx.fillStyle='rgba(0,0,0,.42)';ctx.fillRect(0,0,c.width,c.height);
    const maxW=940,maxH=1120,scale=Math.min(maxW/img.width,maxH/img.height),w=img.width*scale,h=img.height*scale,x=(c.width-w)/2,y=300+(1120-h)/2;
    ctx.save();ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=28;ctx.drawImage(img,x,y,w,h);ctx.restore();
    ctx.fillStyle='rgba(255,255,255,.92)';ctx.font='600 30px system-ui,-apple-system,sans-serif';ctx.fillText(brandName,76,142);
    const clean=String(text||'').replace(/#[\wÁÉÍÓÚÜÑáéíóúüñ]+/g,'').replace(/\s+/g,' ').trim();
    if(clean){ctx.font='700 62px system-ui,-apple-system,sans-serif';ctx.textBaseline='top';ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=14;const words=clean.split(' '),lines=[];let line='';for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>900&&line){lines.push(line);line=word;}else line=test;}if(line)lines.push(line);const shown=lines.slice(0,4),lineH=76,startY=1510-Math.max(0,(shown.length-1))*12;shown.forEach((ln,i)=>ctx.fillText(ln,76,startY+i*lineH));}
    URL.revokeObjectURL(obj);
    return await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('No se pudo crear el formato de historia')),'image/jpeg',.92));
  }

  async function openStory(card,button){
    const brandId=$('#igRescueBrand')?.value||'adria-sushi',mediaId=button.dataset.id||'',img=card.querySelector('img'),p=card.querySelector('.ig-rescue-body p');
    current={brandId,mediaId,sourceUrl:img?.src||'',imported:null,originalCaption:p?.textContent||'',analysis:null};
    $('#igStoryHeading').textContent=`Historia para ${brands[brandId]||brandId}`;$('#igStoryPreview').src=current.sourceUrl;$('#igStoryText').value='';$('#igStorySchedule').value=defaultTime();dialog.showModal();status('Preparando el rescate para Historia…');
    try{current.imported=await call({action:'instagram_rescue_import',brand_id:brandId,media_id:mediaId,media_url:current.sourceUrl});$('#igStoryPreview').src=current.imported.media_url;await analyzeStory();}catch(e){status((e.message||'No se pudo preparar la historia')+(e.detail?' · '+e.detail:''));}
  }

  async function analyzeStory(){if(!current.imported)return;$('#igStoryAnalyze').disabled=true;status('La IA está preparando una frase corta para la historia…');try{const context=`Esta imagen será reutilizada como HISTORIA de Instagram, no como publicación del feed. Escribe una frase MUY BREVE para aparecer sobre la imagen: máximo 10 palabras, sin hashtags, sin precio ni promoción inventada, fiel a la voz actual de la marca. Puede generar antojo, memoria o conversación. Texto histórico de referencia: ${current.originalCaption.slice(0,700)}`;const d=await call({action:'analyze',brand_id:current.brandId,media_url:current.imported.media_url,context});current.analysis=d.analysis||{};let text=String(current.analysis.caption||current.analysis.title||'').replace(/#[\wÁÉÍÓÚÜÑáéíóúüñ]+/g,'').split('\n')[0].trim();if(text.length>130)text=text.slice(0,127).replace(/\s+\S*$/,'')+'…';$('#igStoryText').value=text;status('Texto sugerido listo. Puedes cambiarlo antes de publicar.');}catch(e){status((e.message||'No se pudo generar el texto')+(e.detail?' · '+e.detail:''));}finally{$('#igStoryAnalyze').disabled=false;}}

  async function scheduleStory(now=false){if(!current.imported)return;let dt=$('#igStorySchedule').value;if(now){const d=new Date(Date.now()-30000);dt=localValue(d);$('#igStorySchedule').value=dt;}if(!dt){status('Elige fecha y hora.');return;}const text=$('#igStoryText').value.trim(),buttons=[$('#igStoryNow'),$('#igStoryScheduleBtn')];buttons.forEach(b=>b.disabled=true);status('Creando formato 9:16…');try{const blob=await renderStoryBlob(current.imported.media_url,text,brands[current.brandId]||current.brandId);status('Guardando la historia…');const uploaded=await uploadBlob(blob,current.brandId);status(now?'Enviando a la cola para publicar ahora…':'Programando la historia…');await call({action:'schedule',brand_id:current.brandId,title:`Historia · Rescate`,caption:text||'Historia',media_url:uploaded.media_url,media_path:uploaded.media_path,media_type:'STORIES',ai_analysis:{...(current.analysis||{}),rescue_source:'instagram',content_type:'story',original_media_id:current.mediaId,story_overlay:text},scheduled_at:new Date(dt).toISOString()});document.querySelector('#aiRefreshQueue')?.click();status(now?'Historia enviada. El publicador automático la tomará en el próximo ciclo.':'Historia programada.');setTimeout(()=>dialog.close(),900);}catch(e){status((e.message||'No se pudo programar la historia')+(e.detail?' · '+e.detail:''));}finally{buttons.forEach(b=>b.disabled=false);}}

  function enhanceCards(){document.querySelectorAll('#igRescueGrid .ig-rescue-card').forEach(card=>{if(card.dataset.storyReady)return;const feed=card.querySelector('.ig-rescue-use');if(!feed)return;card.dataset.storyReady='1';const wrap=document.createElement('div');wrap.className='ig-rescue-card-actions';feed.parentNode.insertBefore(wrap,feed);wrap.appendChild(feed);feed.textContent='Feed';const story=document.createElement('button');story.className='btn primary ig-rescue-story';story.type='button';story.dataset.id=feed.dataset.id||'';story.textContent='Historia';wrap.appendChild(story);story.addEventListener('click',()=>openStory(card,story));});}
  const grid=$('#igRescueGrid');if(grid){new MutationObserver(enhanceCards).observe(grid,{childList:true,subtree:true});enhanceCards();}else{let tries=0;const t=setInterval(()=>{tries++;const g=$('#igRescueGrid');if(g){clearInterval(t);new MutationObserver(enhanceCards).observe(g,{childList:true,subtree:true});enhanceCards();}else if(tries>60)clearInterval(t);},200);}
  $('#igStoryAnalyze').addEventListener('click',analyzeStory);$('#igStoryScheduleBtn').addEventListener('click',()=>scheduleStory(false));$('#igStoryNow').addEventListener('click',()=>scheduleStory(true));$('#igStoryClose').addEventListener('click',()=>dialog.close());$('#igStoryCancel').addEventListener('click',()=>dialog.close());
})();