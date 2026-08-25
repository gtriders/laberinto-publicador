(() => {
  const API = 'https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/laberinto-api';
  const PIN_KEY = 'laberinto_session_pin';
  let media = null;
  let analysis = null;

  const css = document.createElement('style');
  css.textContent = `
    .ai-publisher{margin-bottom:18px;border:1px solid #e5ded2;background:linear-gradient(145deg,#fff,#fffaf1)}
    .ai-grid{display:grid;grid-template-columns:minmax(220px,.8fr) minmax(300px,1.2fr);gap:18px}
    .upload-zone{min-height:260px;border:2px dashed #d6c9b5;border-radius:16px;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;cursor:pointer;overflow:hidden;background:#fbf8f2}
    .upload-zone img{width:100%;height:100%;max-height:360px;object-fit:contain;border-radius:12px}
    .ai-controls{display:grid;gap:12px;align-content:start}.ai-controls label{display:grid;gap:6px;font-weight:650}.ai-controls textarea{width:100%;min-height:145px}
    .ai-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ai-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.ai-status{font-size:.92rem;color:#685e50}
    .ai-badge{padding:5px 9px;border-radius:999px;background:#eee7dc;font-size:.78rem;font-weight:700}.ai-badge.ok{background:#e2f5e8;color:#25613a}.ai-badge.warn{background:#fff0cc;color:#765400}
    .queue-mini{margin-top:16px;display:grid;gap:8px}.queue-item{display:grid;grid-template-columns:58px 1fr auto;gap:10px;align-items:center;border-top:1px solid #eee5d9;padding-top:10px}.queue-item img{width:58px;height:58px;object-fit:cover;border-radius:10px}.queue-item small{display:block;color:#766d61}.queue-state{font-size:.78rem;font-weight:800;text-transform:uppercase}.queue-state.failed{color:#a33232}.queue-state.published{color:#287245}.queue-state.scheduled{color:#855f00}
    .setup-box{padding:12px;border-radius:12px;background:#fff3d7}.pin-gate{position:fixed;inset:0;background:rgba(17,24,39,.78);z-index:9999;display:flex;align-items:center;justify-content:center;padding:18px}.pin-card{width:min(420px,100%);background:white;border-radius:18px;padding:24px;box-shadow:0 30px 80px rgba(0,0,0,.25)}.pin-card input{width:100%;font-size:1.1rem;padding:12px;margin:10px 0}
    @media(max-width:780px){.ai-grid{grid-template-columns:1fr}.ai-row{grid-template-columns:1fr}.upload-zone{min-height:200px}.queue-item{grid-template-columns:50px 1fr}.queue-item>.queue-state{grid-column:2}}
  `;
  document.head.appendChild(css);

  const panel = document.createElement('section');
  panel.className = 'panel ai-publisher';
  panel.innerHTML = `
    <div class="panel-heading"><div><span class="eyebrow">PUBLICADOR IA</span><h2>Foto → copy → programar</h2></div><div><span id="aiReadyBadge" class="ai-badge warn">Comprobando IA</span> <span id="igReadyBadge" class="ai-badge warn">Instagram</span></div></div>
    <div class="ai-grid">
      <label class="upload-zone" id="aiUploadZone"><input id="aiFile" type="file" accept="image/jpeg,image/png,image/webp" hidden><div id="aiUploadContent"><strong>Subir foto</strong><p class="helper">Toca aquí o arrastra una imagen</p></div></label>
      <div class="ai-controls">
        <div class="ai-row"><label>Marca<select id="aiBrand"><option value="adria-sushi">Adrià Sushi</option><option value="adria-sangucheria">Sanguchería Adrià</option><option value="pet">Adrià PET</option><option value="laberinto-digital">Laberinto Digital</option></select></label><label>Idea opcional<input id="aiContext" type="text" placeholder="Ej: promover delivery, evento, producto..."></label></div>
        <div class="ai-actions"><button id="aiAnalyzeBtn" class="btn primary" type="button" disabled>Analizar foto con IA</button><button id="aiConfigBtn" class="btn secondary" type="button">Configurar IA</button><span id="aiStatus" class="ai-status">Primero sube una foto.</span></div>
        <label>Título<input id="aiTitle" type="text" maxlength="120" placeholder="La IA propondrá uno"></label>
        <label>Texto listo para publicar<textarea id="aiCaption" placeholder="Aquí aparecerá el copy. Puedes editarlo antes de programar."></textarea></label>
        <div class="ai-row"><label>Fecha y hora<input id="aiSchedule" type="datetime-local"></label><label>Acción<button id="aiScheduleBtn" class="btn primary" type="button" disabled>Programar publicación</button></label></div>
        <div id="aiWarnings" class="helper"></div>
      </div>
    </div>
    <div class="queue-mini"><div class="panel-heading"><div><span class="eyebrow">PUBLICACIÓN AUTOMÁTICA</span><h3>Cola real</h3></div><button id="aiRefreshQueue" class="btn ghost" type="button">Actualizar</button></div><div id="aiQueue"></div></div>`;
  const shell = document.querySelector('main.shell') || document.querySelector('main');
  shell?.prepend(panel);

  const $ = (s) => document.querySelector(s);
  const status = (text) => { const n=$('#aiStatus'); if(n) n.textContent=text; };
  const getPin = () => sessionStorage.getItem(PIN_KEY) || '';
  const api = async (body) => {
    const res = await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,pin:getPin()})});
    const data = await res.json().catch(()=>({}));
    if(res.status===401){ sessionStorage.removeItem(PIN_KEY); showGate('PIN incorrecto. Inténtalo de nuevo.'); throw new Error('PIN incorrecto'); }
    if(!res.ok){ const e=new Error(data.error || 'Error de conexión'); e.code=data.error; e.detail=data.detail; throw e; }
    return data;
  };

  function defaultSchedule(){ const d=new Date(); d.setDate(d.getDate()+1); d.setHours(13,0,0,0); const local=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16); $('#aiSchedule').value=local; }
  defaultSchedule();

  function showGate(message='Ingresa el acceso interno de Laberinto Publicador.'){
    if(document.querySelector('.pin-gate')) return;
    const gate=document.createElement('div'); gate.className='pin-gate';
    gate.innerHTML=`<form class="pin-card"><span class="eyebrow">ACCESO INTERNO</span><h2>Laberinto Publicador</h2><p>${message}</p><input id="gatePin" type="password" autocomplete="current-password" placeholder="Código de acceso" required><button class="btn primary" type="submit">Entrar</button><p id="gateMsg" class="helper"></p></form>`;
    document.body.appendChild(gate);
    gate.querySelector('form').addEventListener('submit',async(e)=>{e.preventDefault();const pin=gate.querySelector('#gatePin').value.trim();gate.querySelector('#gateMsg').textContent='Comprobando...';try{sessionStorage.setItem(PIN_KEY,pin);await api({action:'status'});gate.remove();await refreshStatus();await refreshQueue();}catch{gate.querySelector('#gateMsg').textContent='No pudimos validar el acceso.';}});
  }

  async function refreshStatus(){
    try{
      const data=await api({action:'status'});
      const ai=$('#aiReadyBadge'), ig=$('#igReadyBadge');
      ai.textContent=data.ai_ready?'IA lista':'Falta API IA'; ai.className='ai-badge '+(data.ai_ready?'ok':'warn');
      const connected=data.instagram?.status==='connected'; ig.textContent=connected?'Instagram conectado':'Instagram pendiente'; ig.className='ai-badge '+(connected?'ok':'warn');
    }catch{}
  }

  async function configureAI(){
    const key=prompt('Pega tu OpenAI API key. Se enviará directamente a Supabase y se guardará en el servidor; no quedará en GitHub ni en este navegador.');
    if(!key) return;
    status('Guardando API key de forma privada...');
    try{await api({action:'set_openai_key',api_key:key});status('IA configurada. Ya puedes analizar fotos.');await refreshStatus();}catch(e){status(e.message);}
  }

  async function uploadFile(file){
    status('Subiendo imagen...'); analysis=null; $('#aiScheduleBtn').disabled=true;
    const form=new FormData(); form.append('action','upload'); form.append('pin',getPin()); form.append('brand_id',$('#aiBrand').value); form.append('file',file);
    const res=await fetch(API,{method:'POST',body:form}); const data=await res.json().catch(()=>({}));
    if(res.status===401){sessionStorage.removeItem(PIN_KEY);showGate();throw new Error('PIN incorrecto');}
    if(!res.ok) throw new Error(data.error||'No se pudo subir');
    media=data; $('#aiUploadContent').innerHTML=`<img src="${data.media_url}" alt="Foto cargada">`; $('#aiAnalyzeBtn').disabled=false; status('Foto cargada. Ahora puedo analizarla.');
  }

  async function analyze(){
    if(!media) return; $('#aiAnalyzeBtn').disabled=true; status('Analizando imagen y preparando copy...'); $('#aiWarnings').textContent='';
    try{
      const data=await api({action:'analyze',brand_id:$('#aiBrand').value,media_url:media.media_url,context:$('#aiContext').value});
      analysis=data.analysis; $('#aiTitle').value=analysis.title||''; const tags=Array.isArray(analysis.hashtags)?'\n\n'+analysis.hashtags.join(' '):''; $('#aiCaption').value=(analysis.caption||'')+tags;
      const warnings=Array.isArray(analysis.warnings)?analysis.warnings.filter(Boolean):[]; $('#aiWarnings').textContent=warnings.length?'Revisar: '+warnings.join(' · '):'Sin advertencias relevantes.';
      $('#aiScheduleBtn').disabled=false; status('Propuesta lista. Revísala y programa cuando quieras.');
    }catch(e){ if(e.code==='AI_NOT_CONFIGURED') status('Falta configurar la API de IA. Pulsa “Configurar IA”.'); else status((e.message||'Error')+(e.detail?' — '+e.detail:'')); }
    finally{$('#aiAnalyzeBtn').disabled=false;}
  }

  async function schedule(){
    if(!media) return; const dt=$('#aiSchedule').value; if(!dt){status('Elige fecha y hora.');return;} const caption=$('#aiCaption').value.trim(); if(!caption){status('Falta el texto de la publicación.');return;}
    if(!confirm(`¿Programar esta publicación para ${new Date(dt).toLocaleString('es-CL')}?`)) return;
    $('#aiScheduleBtn').disabled=true; status('Programando...');
    try{await api({action:'schedule',brand_id:$('#aiBrand').value,title:$('#aiTitle').value,caption,media_url:media.media_url,media_path:media.media_path,ai_analysis:analysis||{},scheduled_at:new Date(dt).toISOString()});status('Publicación programada y aprobada.');media=null;analysis=null;$('#aiTitle').value='';$('#aiCaption').value='';$('#aiUploadContent').innerHTML='<strong>Subir otra foto</strong><p class="helper">Toca aquí o arrastra una imagen</p>';$('#aiAnalyzeBtn').disabled=true;defaultSchedule();await refreshQueue();}
    catch(e){status(e.message||'No se pudo programar');$('#aiScheduleBtn').disabled=false;}
  }

  async function refreshQueue(){
    try{const data=await api({action:'list'});const root=$('#aiQueue');if(!data.items?.length){root.innerHTML='<p class="helper">Todavía no hay publicaciones en la cola real.</p>';return;}root.innerHTML=data.items.slice(0,10).map(x=>`<div class="queue-item"><img src="${x.media_url}" alt=""><div><strong>${escapeHtml(x.title||x.brand_id)}</strong><small>${x.scheduled_at?new Date(x.scheduled_at).toLocaleString('es-CL'):'Sin fecha'}${x.error_message?' · '+escapeHtml(x.error_message):''}</small></div><span class="queue-state ${x.status}">${labelStatus(x.status)}</span></div>`).join('');}catch{}
  }
  const escapeHtml=(s='')=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const labelStatus=(s)=>({scheduled:'Programada',publishing:'Publicando',published:'Publicada',failed:'Falló',draft:'Borrador',ready:'Lista',cancelled:'Cancelada'}[s]||s);

  $('#aiFile').addEventListener('change',e=>{const f=e.target.files?.[0];if(f)uploadFile(f).catch(err=>status(err.message));});
  $('#aiUploadZone').addEventListener('dragover',e=>{e.preventDefault();}); $('#aiUploadZone').addEventListener('drop',e=>{e.preventDefault();const f=e.dataTransfer.files?.[0];if(f)uploadFile(f).catch(err=>status(err.message));});
  $('#aiAnalyzeBtn').addEventListener('click',analyze); $('#aiConfigBtn').addEventListener('click',configureAI); $('#aiScheduleBtn').addEventListener('click',schedule); $('#aiRefreshQueue').addEventListener('click',refreshQueue);
  $('#aiBrand').addEventListener('change',()=>{analysis=null; if(media) status('Marca cambiada. Vuelve a analizar la foto para adaptar el copy.');});

  if(!getPin()) showGate(); else { refreshStatus(); refreshQueue(); }
})();