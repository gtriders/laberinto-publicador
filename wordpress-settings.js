(() => {
  const API='https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/wordpress-api';
  const PIN_KEY='laberinto_session_pin';
  const getPin=()=>sessionStorage.getItem(PIN_KEY)||'';
  const call=async(body)=>{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,pin:getPin()})});const d=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(d.error||'Error de conexión');e.detail=d.detail||'';throw e;}return d;};

  function mount(){
    const grid=document.querySelector('#settingsView .settings-grid');
    if(!grid||document.querySelector('#wpSettingsCard'))return false;
    const card=document.createElement('article');
    card.id='wpSettingsCard';
    card.className='settings-card settings-full';
    card.innerHTML=`
      <span class="eyebrow">WORDPRESS / SEO</span>
      <h3>Conectar adria.cl</h3>
      <p class="helper">Conecta WordPress con una contraseña de aplicación. La credencial se guarda en el servidor y no en GitHub.</p>
      <div class="settings-row">
        <input id="wpUrl" type="url" value="https://adria.cl" placeholder="https://adria.cl" autocomplete="url">
        <input id="wpUser" type="text" value="adriad" placeholder="Usuario WordPress" autocomplete="username">
        <input id="wpPassword" type="password" placeholder="Contraseña de aplicación" autocomplete="new-password">
        <button id="wpConnect" class="btn primary" type="button">Conectar WordPress</button>
      </div>
      <div class="settings-row">
        <span id="wpStatus" class="settings-status">Comprobando conexión…</span>
        <button id="wpScan" class="btn secondary" type="button" disabled>Analizar sitio</button>
      </div>
      <div id="wpScanResult" class="settings-status"></div>`;
    const admin=document.querySelector('#settingsAdminActions')?.closest('.settings-card');
    grid.insertBefore(card,admin||null);
    bind();
    refresh();
    return true;
  }

  function setStatus(text,kind=''){
    const el=document.querySelector('#wpStatus');if(!el)return;
    el.textContent=text;el.className='settings-status'+(kind?` ${kind}`:'');
  }

  async function refresh(){
    try{
      const d=await call({action:'status'});
      const scan=document.querySelector('#wpScan');
      if(d.connected){
        setStatus(`Conectado a ${d.url} como ${d.display_name||d.user}`,'ok');
        if(scan)scan.disabled=false;
      }else{
        setStatus(d.error?`No conectado: ${d.error}`:'WordPress pendiente de conexión','warn');
        if(scan)scan.disabled=true;
      }
    }catch(e){setStatus(e.message,'error');}
  }

  function bind(){
    document.querySelector('#wpConnect')?.addEventListener('click',async()=>{
      const btn=document.querySelector('#wpConnect');
      const url=document.querySelector('#wpUrl')?.value.trim()||'';
      const user=document.querySelector('#wpUser')?.value.trim()||'';
      const app_password=document.querySelector('#wpPassword')?.value.trim()||'';
      if(!url||!user||!app_password){setStatus('Completa URL, usuario y contraseña de aplicación.','warn');return;}
      btn.disabled=true;setStatus('Probando conexión con WordPress…');
      try{
        const d=await call({action:'connect',url,user,app_password});
        const pwd=document.querySelector('#wpPassword');if(pwd)pwd.value='';
        setStatus(`Conectado a ${d.url} como ${d.display_name||d.user}`,'ok');
        document.querySelector('#wpScan').disabled=false;
      }catch(e){setStatus(e.detail?`${e.message}: ${e.detail}`:e.message,'error');}
      finally{btn.disabled=false;}
    });

    document.querySelector('#wpScan')?.addEventListener('click',async()=>{
      const btn=document.querySelector('#wpScan'),out=document.querySelector('#wpScanResult');
      btn.disabled=true;if(out){out.textContent='Analizando páginas, entradas y productos…';out.className='settings-status';}
      try{
        const d=await call({action:'scan'}),c=d.counts||{};
        if(out){out.textContent=`Inventario inicial: ${c.page||0} páginas · ${c.post||0} entradas · ${c.product||0} productos.`;out.className='settings-status ok';}
      }catch(e){if(out){out.textContent=e.message;out.className='settings-status error';}}
      finally{btn.disabled=false;}
    });
  }

  if(!mount()){
    const obs=new MutationObserver(()=>{if(mount())obs.disconnect();});
    obs.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>obs.disconnect(),10000);
  }
})();
