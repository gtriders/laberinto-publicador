(() => {
  const MAIN_API='https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/laberinto-api';
  const TAGS_API='https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/instagram-tags-api';
  const PIN_KEY='laberinto_session_pin';
  const nativeFetch=window.fetch.bind(window);
  let composerTags=[];
  let editorTags=[];
  let editorSlideCount=1;
  const positions={
    'bottom-left':{label:'Abajo izquierda',x:.18,y:.82},
    'bottom-right':{label:'Abajo derecha',x:.82,y:.82},
    'top-left':{label:'Arriba izquierda',x:.18,y:.18},
    'top-right':{label:'Arriba derecha',x:.82,y:.18},
    'center':{label:'Centro',x:.5,y:.5}
  };
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const pin=()=>sessionStorage.getItem(PIN_KEY)||'';
  const tagsCall=async body=>{const r=await nativeFetch(TAGS_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,pin:pin()})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'No se pudieron guardar las etiquetas');return d;};
  const mainCall=async body=>{const r=await nativeFetch(MAIN_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,pin:pin()})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Error de conexión');return d;};
  const positionKey=(x,y)=>Object.entries(positions).find(([,p])=>Math.abs(p.x-Number(x))<.03&&Math.abs(p.y-Number(y))<.03)?.[0]||'bottom-left';
  const sanitizeUsername=v=>String(v||'').trim().replace(/^@+/,'').replace(/\s+/g,'');
  const slideLabel=(slide,count)=>count>1?(slide===0?'Portada':`Foto ${slide+1}`):'Foto';
  const buildOptions=count=>Array.from({length:Math.max(1,count)},(_,i)=>`<option value="${i}">${slideLabel(i,count)}</option>`).join('');
  const style=document.createElement('style');style.textContent=`
    .ig-tags-box{border:1px solid #ebe9e4;border-radius:12px;padding:11px;background:#fbfbf9;display:grid;gap:8px}.ig-tags-title{display:flex;justify-content:space-between;gap:10px;align-items:center}.ig-tags-title strong{font-size:13px}.ig-tags-title span{font-size:11px;color:#777}.ig-tags-row{display:grid;grid-template-columns:minmax(120px,1fr) auto auto auto;gap:6px}.ig-tags-row input,.ig-tags-row select{min-width:0;border:1px solid #e2e0da;border-radius:9px;padding:8px;background:#fff}.ig-tags-list{display:flex;flex-wrap:wrap;gap:6px}.ig-tag-chip{display:inline-flex;gap:6px;align-items:center;background:#f0eee9;border-radius:999px;padding:5px 8px;font-size:11px}.ig-tag-chip button{border:0;background:transparent;cursor:pointer;font-weight:900}.ig-tags-empty{font-size:11px;color:#888}@media(max-width:720px){.ig-tags-row{grid-template-columns:1fr 1fr}.ig-tags-row .ig-tag-add{grid-column:1/-1}}
  `;document.head.appendChild(style);

  function renderBox(box,tags,count,mode){
    const list=box.querySelector('.ig-tags-list');
    list.innerHTML=tags.length?tags.map((t,i)=>`<span class="ig-tag-chip">@${esc(t.username)} · ${slideLabel(Number(t.slide||0),count)} · ${esc(positions[positionKey(t.x,t.y)].label)} <button type="button" data-remove-tag="${i}">×</button></span>`).join(''):'<span class="ig-tags-empty">Sin etiquetas.</span>';
    const slide=box.querySelector('.ig-tag-slide');if(slide){const current=Number(slide.value||0);slide.innerHTML=buildOptions(count);slide.value=String(Math.min(current,Math.max(0,count-1)));}
    list.querySelectorAll('[data-remove-tag]').forEach(b=>b.addEventListener('click',()=>{(mode==='composer'?composerTags:editorTags).splice(Number(b.dataset.removeTag),1);renderBox(box,mode==='composer'?composerTags:editorTags,count,mode);}));
  }
  function wireBox(box,mode,getCount){
    const input=box.querySelector('.ig-tag-user'),slide=box.querySelector('.ig-tag-slide'),pos=box.querySelector('.ig-tag-pos'),add=box.querySelector('.ig-tag-add');
    add.addEventListener('click',()=>{const username=sanitizeUsername(input.value);if(!/^[A-Za-z0-9._]{1,30}$/.test(username)){input.focus();return;}const p=positions[pos.value]||positions['bottom-left'];const tags=mode==='composer'?composerTags:editorTags;tags.push({username,x:p.x,y:p.y,slide:Number(slide.value||0)});input.value='';renderBox(box,tags,getCount(),mode);});
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();add.click();}});
  }
  function makeBox(id){const el=document.createElement('div');el.className='ig-tags-box';el.id=id;el.innerHTML=`<div class="ig-tags-title"><strong>Etiquetas de Instagram</strong><span>Predeterminado: abajo izquierda</span></div><div class="ig-tags-row"><input class="ig-tag-user" type="text" placeholder="@usuario"><select class="ig-tag-slide"><option value="0">Foto</option></select><select class="ig-tag-pos">${Object.entries(positions).map(([k,p])=>`<option value="${k}"${k==='bottom-left'?' selected':''}>${p.label}</option>`).join('')}</select><button type="button" class="btn secondary ig-tag-add">+ Agregar</button></div><div class="ig-tags-list"><span class="ig-tags-empty">Sin etiquetas.</span></div>`;return el;}
  function mountComposer(){if(document.querySelector('#composerInstagramTags'))return true;const schedule=document.querySelector('#aiSchedule');if(!schedule)return false;const row=schedule.closest('.ai-row');if(!row)return false;const box=makeBox('composerInstagramTags');row.parentElement.insertBefore(box,row);const count=()=>Math.max(1,document.querySelectorAll('#mediaGrid .media-card').length);wireBox(box,'composer',count);renderBox(box,composerTags,count(),'composer');new MutationObserver(()=>renderBox(box,composerTags,count(),'composer')).observe(document.querySelector('#mediaGrid'),{childList:true});return true;}
  function mountEditor(){if(document.querySelector('#editorInstagramTags'))return true;const schedule=document.querySelector('#queueEditSchedule');if(!schedule)return false;const label=schedule.closest('label');if(!label)return false;const box=makeBox('editorInstagramTags');label.parentElement.insertBefore(box,label);wireBox(box,'editor',()=>editorSlideCount);renderBox(box,editorTags,editorSlideCount,'editor');const dialog=document.querySelector('.queue-edit-dialog');new MutationObserver(async()=>{if(!dialog.open)return;const id=document.querySelector('#queueEditId')?.value;if(!id)return;try{const [tagData,listData]=await Promise.all([tagsCall({action:'get',id}),mainCall({action:'list'})]);editorTags=Array.isArray(tagData.user_tags)?tagData.user_tags:[];const item=(listData.items||[]).find(x=>x.id===id);editorSlideCount=Array.isArray(item?.media_items)&&item.media_items.length?item.media_items.length:1;renderBox(box,editorTags,editorSlideCount,'editor');}catch{editorTags=[];editorSlideCount=1;renderBox(box,editorTags,editorSlideCount,'editor');}}).observe(dialog,{attributes:true,attributeFilter:['open']});return true;}

  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:input?.url||'';
    let body=null;
    if(url===MAIN_API&&init?.method==='POST'&&typeof init.body==='string'){try{body=JSON.parse(init.body);}catch{}}
    const response=await nativeFetch(input,init);
    if(response.ok&&body?.action==='schedule'&&composerTags.length){try{const data=await response.clone().json();const id=data?.item?.id;if(id){await tagsCall({action:'set',id,user_tags:composerTags});composerTags=[];const box=document.querySelector('#composerInstagramTags');if(box)renderBox(box,composerTags,Math.max(1,document.querySelectorAll('#mediaGrid .media-card').length),'composer');}}catch(e){console.error('instagram tags schedule',e);}}
    if(response.ok&&body?.action==='update_scheduled'&&editorTags.length>=0){try{await tagsCall({action:'set',id:body.id,user_tags:editorTags});}catch(e){console.error('instagram tags update',e);}}
    return response;
  };

  let tries=0;const timer=setInterval(()=>{tries++;const a=mountComposer(),b=mountEditor();if((a&&b)||tries>80)clearInterval(timer);},150);mountComposer();mountEditor();
})();