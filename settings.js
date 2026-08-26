(() => {
  const API='https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/laberinto-api';
  const VOICE_API='https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/brand-settings-api';
  const PIN_KEY='laberinto_session_pin';
  const brands={
    'adria-sushi':'Adrià Sushi',
    'adria-sangucheria':'Sanguchería Adrià',
    'pet':'Adrià PET',
    'chef-rafael':'Chef Rafael',
    'laberinto-digital':'Laberinto Digital'
  };
  const expected={
    'adria-sushi':'adria__sushi',
    'adria-sangucheria':'adriasangucheria',
    'pet':'adria.pet',
    'chef-rafael':'chefrafael.adria',
    'laberinto-digital':'laberinto_digital'
  };
  const getPin=()=>sessionStorage.getItem(PIN_KEY)||'';
  const call=async(body,url=API)=>{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,pin:getPin()})});const d=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(d.error||'Error de conexión');e.detail=d.detail||'';throw e;}return d;};
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  const css=document.createElement('style');
  css.textContent=`
    .app-tabs{display:flex;gap:8px;max-width:1180px;margin:0 auto 18px;padding:0 20px}.app-tab{border:1px solid #ddd3c5;background:#fff;color:#4f473d;border-radius:999px;padding:10px 16px;font-weight:750;cursor:pointer}.app-tab.active{background:#111827;color:#fff;border-color:#111827}
    .settings-view{display:none}.settings-view.active{display:block}.main-view.settings-hidden{display:none}.settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.settings-card{border:1px solid #e7dfd2;border-radius:16px;background:#fff;padding:16px;display:grid;gap:12px}.settings-card h3{margin:0}.settings-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.settings-row select,.settings-row input{min-width:220px;flex:1 1 240px}.settings-status{font-size:.9rem;color:#655c50}.settings-status.ok{color:#287245}.settings-status.warn{color:#8a6400}.settings-status.error{color:#a33232}.settings-full{grid-column:1/-1}.settings-ig-list{display:grid;gap:8px}.settings-ig-item{display:flex;justify-content:space-between;gap:12px;align-items:center;border-top:1px solid #eee5d9;padding-top:8px}.settings-ig-item span:last-child{font-weight:700}.settings-ig-item .ok{color:#287245}.settings-ig-item .warn{color:#8a6400}
    .voice-editor{display:grid;gap:14px}.voice-editor-head{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}.voice-editor-head select{min-width:240px}.voice-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.voice-fields label{display:grid;gap:6px;font-weight:700}.voice-fields textarea{width:100%;min-height:120px;resize:vertical}.voice-fields .wide{grid-column:1/-1}.voice-help{font-size:.82rem;color:#756b5d;font-weight:400;line-height:1.4}.voice-summary{border-top:1px solid #eee5d9;padding-top:12px;color:#5f574d;line-height:1.45}
    @media(max-width:760px){.settings-grid,.voice-fields{grid-template-columns:1fr}.settings-full,.voice-fields .wide{grid-column:auto}.app-tabs{padding:0 14px}}
  `;
  document.head.appendChild(css);

  const shell=document.querySelector('main.shell')||document.querySelector('main');
  if(!shell)return;
  shell.classList.add('main-view');
  const tabs=document.createElement('nav');tabs.className='app-tabs';tabs.setAttribute('aria-label','Secciones del publicador');tabs.innerHTML=`<button id="tabPublicador" class="app-tab active" type="button">Publicador</button><button id="tabSettings" class="app-tab" type="button">Configuración</button>`;shell.parentNode?.insertBefore(tabs,shell);

  const settings=document.createElement('main');settings.className='shell settings-view';settings.id='settingsView';settings.innerHTML=`
    <section class="panel"><div class="panel-heading"><div><span class="eyebrow">CONFIGURACIÓN</span><h2>Ajustes del Publicador</h2></div></div><p class="helper">Aquí quedan las conexiones y la identidad de cada cuenta. La pestaña Publicador queda solo para crear, rescatar y programar.</p></section>
    <section class="settings-grid">
      <article class="settings-card"><span class="eyebrow">INTELIGENCIA ARTIFICIAL</span><h3>Configurar IA</h3><p class="helper">La clave queda guardada en el servidor, no en GitHub ni en este navegador.</p><div class="settings-row"><button id="settingsAI" class="btn secondary" type="button">Configurar IA</button><span id="settingsAIStatus" class="settings-status">Comprobando…</span></div></article>
      <article class="settings-card"><span class="eyebrow">META</span><h3>Meta Developers</h3><p class="helper">Acceso directo a la aplicación usada por Laberinto para las conexiones de Instagram.</p><div class="settings-row"><button id="settingsMeta" class="btn secondary" type="button">Abrir Meta</button></div></article>
      <article class="settings-card settings-full"><span class="eyebrow">INSTAGRAM</span><h3>Tokens y cuentas</h3><div class="settings-row"><select id="settingsBrand">${Object.entries(brands).map(([id,n])=>`<option value="${id}">${n}</option>`).join('')}</select><input id="settingsToken" type="password" autocomplete="off" placeholder="Pega el token de Instagram"><button id="settingsSaveToken" class="btn secondary" type="button">Guardar token</button></div><div id="settingsTokenMsg" class="settings-status"></div><div id="settingsInstagramList" class="settings-ig-list"></div></article>
      <article class="settings-card settings-full"><span class="eyebrow">VOZ DE MARCA</span><div class="voice-editor"><div class="voice-editor-head"><div><h3>Cómo debe pensar y hablar cada cuenta</h3><p class="helper">Estos ajustes se usan directamente cuando la IA analiza una imagen y escribe un copy.</p></div><select id="voiceBrand">${Object.entries(brands).map(([id,n])=>`<option value="${id}">${n}</option>`).join('')}</select></div>
      <div class="voice-fields">
        <label>Audiencia<textarea id="voiceAudience"></textarea><span class="voice-help">Quién es la persona a la que hablamos, qué busca y qué valora.</span></label>
        <label>Objetivo<textarea id="voiceObjective"></textarea><span class="voice-help">Qué debe lograr el contenido: antojo, confianza, venta, conversación, educación, etc.</span></label>
        <label class="wide">Voz, personalidad y estilo<textarea id="voiceVoice"></textarea><span class="voice-help">Cómo suena la cuenta: ritmo, cercanía, vocabulario, nivel de humor, primera o tercera persona y qué sensación debe dejar.</span></label>
        <label>CTA habitual<textarea id="voiceCTA"></textarea><span class="voice-help">Cómo queremos cerrar: pedir, visitar, conversar, guardar, escribir, conocer más.</span></label>
        <label>Límites y cosas que debe evitar<textarea id="voiceGuardrails"></textarea><span class="voice-help">Promesas, palabras, tonos, datos o comportamientos que la IA no debe usar.</span></label>
      </div>
      <div class="voice-editor-head"><div id="voiceStatus" class="settings-status">Cargando voz de marca…</div><button id="voiceSave" class="btn primary" type="button">Guardar voz de marca</button></div>
      <div id="voiceSummary" class="voice-summary"></div></div></article>
      <div id="settingsHistory" class="settings-full"></div>
    </section>`;
  shell.insertAdjacentElement('afterend',settings);

  function show(which){const isSettings=which==='settings';shell.classList.toggle('settings-hidden',isSettings);settings.classList.toggle('active',isSettings);document.querySelector('#tabPublicador')?.classList.toggle('active',!isSettings);document.querySelector('#tabSettings')?.classList.toggle('active',isSettings);if(isSettings){refreshStatus();loadVoices();}}
  document.querySelector('#tabPublicador')?.addEventListener('click',()=>show('publicador'));
  document.querySelector('#tabSettings')?.addEventListener('click',()=>show('settings'));

  function movePanels(){
    document.querySelector('.brand-panel')?.remove();
    const hist=[...document.querySelectorAll('section.panel')].find(p=>p.querySelector('.eyebrow')?.textContent?.trim()==='BIBLIOTECA HISTÓRICA');
    if(hist&&!document.querySelector('#settingsHistory section.panel'))document.querySelector('#settingsHistory')?.appendChild(hist);
    ['#aiConfigBtn','#igMetaBtn','#igTokenInput','#igConfigBtn'].forEach(sel=>document.querySelector(sel)?.remove());
  }
  movePanels();
  const observer=new MutationObserver(movePanels);observer.observe(document.body,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),5000);

  let voices={};
  function fillVoice(){const id=document.querySelector('#voiceBrand')?.value||'adria-sushi',v=voices[id]||{};document.querySelector('#voiceAudience').value=v.audience||'';document.querySelector('#voiceVoice').value=v.voice||'';document.querySelector('#voiceObjective').value=v.objective||'';document.querySelector('#voiceCTA').value=v.cta||'';document.querySelector('#voiceGuardrails').value=v.guardrails||'';renderVoiceSummary();}
  function renderVoiceSummary(){const id=document.querySelector('#voiceBrand')?.value||'adria-sushi',name=brands[id];const a=document.querySelector('#voiceAudience')?.value.trim(),v=document.querySelector('#voiceVoice')?.value.trim(),o=document.querySelector('#voiceObjective')?.value.trim();document.querySelector('#voiceSummary').innerHTML=`<strong>${esc(name)}</strong><br>${esc(v||'Sin voz definida')}${a?`<br><br><strong>Habla a:</strong> ${esc(a)}`:''}${o?`<br><strong>Busca:</strong> ${esc(o)}`:''}`;}
  async function loadVoices(){try{const d=await call({action:'list'},VOICE_API);voices=Object.fromEntries((d.items||[]).map(x=>[x.brand_id,x]));fillVoice();const s=document.querySelector('#voiceStatus');if(s){s.textContent='Voz cargada desde el servidor.';s.className='settings-status ok';}}catch(e){const s=document.querySelector('#voiceStatus');if(s){s.textContent=e.message;s.className='settings-status error';}}}
  async function saveVoice(){const id=document.querySelector('#voiceBrand')?.value||'adria-sushi',btn=document.querySelector('#voiceSave'),s=document.querySelector('#voiceStatus');btn.disabled=true;if(s){s.textContent='Guardando…';s.className='settings-status';}try{const d=await call({action:'save',brand_id:id,audience:document.querySelector('#voiceAudience').value,voice:document.querySelector('#voiceVoice').value,objective:document.querySelector('#voiceObjective').value,cta:document.querySelector('#voiceCTA').value,guardrails:document.querySelector('#voiceGuardrails').value},VOICE_API);voices[id]=d.item;fillVoice();if(s){s.textContent='Guardado. La IA usará esta voz desde la próxima publicación.';s.className='settings-status ok';}}catch(e){if(s){s.textContent=e.message;s.className='settings-status error';}}finally{btn.disabled=false;}}

  async function refreshStatus(){try{const d=await call({action:'status'});const ai=document.querySelector('#settingsAIStatus');if(ai){ai.textContent=d.ai_ready?'IA lista':'Falta configurar IA';ai.className='settings-status '+(d.ai_ready?'ok':'warn');}const root=document.querySelector('#settingsInstagramList');if(root){root.innerHTML=Object.entries(brands).map(([id,name])=>{const s=d.instagram_by_brand?.[id],ready=s?.status==='connected'&&s?.token_ready===true,handle=s?.instagram_handle?'@'+s.instagram_handle:'@'+expected[id];return `<div class="settings-ig-item"><span>${name} · ${handle}</span><span class="${ready?'ok':'warn'}">${ready?'Conectado':'Pendiente'}</span></div>`}).join('');}}catch(e){const ai=document.querySelector('#settingsAIStatus');if(ai){ai.textContent=e.message;ai.className='settings-status error';}}}

  document.querySelector('#settingsAI')?.addEventListener('click',async()=>{const key=prompt('Pega tu OpenAI API key. Se guardará de forma privada en Supabase.');if(!key)return;const s=document.querySelector('#settingsAIStatus');if(s)s.textContent='Guardando…';try{await call({action:'set_openai_key',api_key:key});await refreshStatus();}catch(e){if(s){s.textContent=e.message;s.className='settings-status error';}}});
  document.querySelector('#settingsMeta')?.addEventListener('click',()=>window.open('https://developers.facebook.com/apps/2518966771958311/','_blank','noopener,noreferrer'));
  document.querySelector('#settingsSaveToken')?.addEventListener('click',async()=>{const brand=document.querySelector('#settingsBrand')?.value||'adria-sushi',input=document.querySelector('#settingsToken'),token=input?.value?.trim()||'',msg=document.querySelector('#settingsTokenMsg'),btn=document.querySelector('#settingsSaveToken');if(!token){if(msg)msg.textContent='Pega primero el token de '+brands[brand]+'.';return;}btn.disabled=true;if(msg)msg.textContent='Validando cuenta…';try{const d=await call({action:'set_instagram_token',brand_id:brand,access_token:token});if(input)input.value='';if(msg){msg.textContent=`${brands[brand]} conectado como @${d.username}.`;msg.className='settings-status ok';}await refreshStatus();}catch(e){if(msg){msg.textContent=e.message+(e.detail?' · '+e.detail:'');msg.className='settings-status error';}}finally{btn.disabled=false;}});
  document.querySelector('#voiceBrand')?.addEventListener('change',fillVoice);
  ['#voiceAudience','#voiceVoice','#voiceObjective','#voiceCTA','#voiceGuardrails'].forEach(id=>document.querySelector(id)?.addEventListener('input',renderVoiceSummary));
  document.querySelector('#voiceSave')?.addEventListener('click',saveVoice);

  refreshStatus();loadVoices();
})();