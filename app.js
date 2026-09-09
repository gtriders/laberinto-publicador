(() => {
  const BRANDS={sushi:'Adrià Sushi',sangucheria:'Sanguchería Adrià',pet:'Adrià PET','chef-rafael':'Chef Rafael',laberinto:'Laberinto Digital'};
  const KEY='laberinto-publicador-v1';
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const formatDate=date=>{try{return new Intl.DateTimeFormat('es-CL',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(date+'T12:00:00'));}catch{return date;}};

  function loadLibrary(){try{const value=JSON.parse(localStorage.getItem(KEY)||'null');return Array.isArray(value?.library)?value.library:[];}catch{return [];}}
  let library=loadLibrary();
  function saveLibrary(){localStorage.setItem(KEY,JSON.stringify({library}));renderLibrary();}
  function parseCSV(text){
    const lines=text.replace(/\r/g,'').split('\n').filter(Boolean);if(lines.length<2)return[];
    const parseLine=line=>{const out=[];let cur='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){cur+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){out.push(cur);cur='';}else cur+=c;}out.push(cur);return out;};
    const headers=parseLine(lines[0]).map(h=>h.trim().toLowerCase());
    return lines.slice(1).map(line=>{const cols=parseLine(line),row={};headers.forEach((h,i)=>row[h]=cols[i]??'');return row;});
  }
  function normalizeBrand(value=''){const x=value.toLowerCase();if(x.includes('sang'))return'sangucheria';if(x.includes('pet'))return'pet';if(x.includes('chef')||x.includes('rafael'))return'chef-rafael';if(x.includes('laber'))return'laberinto';return'sushi';}
  function renderLibrary(){
    const root=document.querySelector('#libraryList'),count=document.querySelector('#libraryCount');if(count)count.textContent=library.length;if(!root)return;
    const items=[...library].sort((a,b)=>((b.likes||0)+(b.comments||0))-((a.likes||0)+(a.comments||0))).slice(0,12);
    root.innerHTML=items.length?items.map(item=>`<article class="library-card"><div class="library-meta"><span>${esc(BRANDS[item.brand]||item.brand)}</span><span>${formatDate(item.date)}</span></div><div class="post-copy">${esc(item.text||'Publicación histórica')}</div></article>`).join(''):'<div class="empty">Importa un CSV de publicaciones históricas para consultarlas aquí.</div>';
  }
  document.querySelector('#historyImport')?.addEventListener('change',async event=>{
    const file=event.target.files?.[0];if(!file)return;
    const rows=parseCSV(await file.text());
    const imported=rows.map(row=>({id:crypto.randomUUID(),date:row.fecha||row.date||'',brand:normalizeBrand(row.marca||row.brand||''),text:row.texto||row.caption||row.text||'',url:row.url||row.link||'',likes:Number(row.likes||row.me_gusta||0)||0,comments:Number(row.comentarios||row.comments||0)||0}));
    library=[...imported,...library];saveLibrary();event.target.value='';
  });
  renderLibrary();
})();
