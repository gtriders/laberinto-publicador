(() => {
  const OAUTH='https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/google-business-oauth';
  const API='https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/google-business-api';
  const PIN_KEY='laberinto_session_pin';
  const pin=()=>sessionStorage.getItem(PIN_KEY)||'';

  const qs=new URLSearchParams(location.search);
  if(qs.get('code')&&qs.get('state')){
    const callback=new URL(OAUTH);callback.searchParams.set('mode','callback');callback.searchParams.set('code',qs.get('code'));callback.searchParams.set('state',qs.get('state'));
    location.replace(callback.toString());return;
  }
  const returned=qs.get('google');
  if(returned){history.replaceState({},'',location.pathname+location.hash);}

  async function json(url){const r=await fetch(url,{cache:'no-store'}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'No se pudo conectar con Google');return d;}
  const escapeHtml=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  function boot(){
    const grid=document.querySelector('#settingsView .settings-grid');
    if(!grid)return setTimeout(boot,180);
    if(document.querySelector('#googleBusinessCard'))return;
    const card=document.createElement('article');card.id='googleBusinessCard';card.className='settings-card settings-full';
    card.innerHTML=`<span class="eyebrow">GOOGLE</span><h3>Google Business Profile</h3><p class="helper">Conecta la cuenta que administra tu Perfil de Negocio. Esto solo comprueba la conexión; no publica nada automáticamente.</p><div class="settings-row"><button id="googleConnect" class="btn primary" type="button">Conectar / cambiar cuenta Google</button><button id="googleCheck" class="btn secondary" type="button">Comprobar negocios</button><span id="googleStatus" class="settings-status">Ingresa al Publicador para comprobar.</span></div><div id="googleLocations" class="settings-ig-list"></div>`;
    grid.insertBefore(card,document.querySelector('#wpSettingsCard')||document.querySelector('#settingsHistory')||null);
    const status=card.querySelector('#googleStatus'),list=card.querySelector('#googleLocations'),connect=card.querySelector('#googleConnect'),check=card.querySelector('#googleCheck');
    const set=(text,kind='')=>{status.textContent=text;status.className='settings-status'+(kind?' '+kind:'');};

    async function refresh(){
      if(!pin()){set('Ingresa al Publicador para comprobar.','warn');return;}
      check.disabled=true;set('Comprobando Google…');
      try{
        const u=new URL(API);u.searchParams.set('pin',pin());const d=await json(u);
        const locations=d.locations||[];
        if(locations.length){set(`${locations.length} negocio(s) visible(s) en Google.`,'ok');list.innerHTML=locations.map(x=>`<div class="settings-ig-item"><span>${escapeHtml(x.title||'Perfil de Negocio')}${x.websiteUri?` · ${escapeHtml(x.websiteUri)}`:''}</span><span class="ok">Conectado</span></div>`).join('');}
        else{set('Google está conectado, pero no encontré perfiles de negocio administrables.','warn');list.innerHTML='';}
      }catch(e){set(e.message,'warn');list.innerHTML='';}
      finally{check.disabled=false;}
    }
    connect.onclick=async()=>{
      if(!pin()){set('Ingresa primero al Publicador.','warn');return;}
      connect.disabled=true;set('Preparando autorización de Google…');
      try{const u=new URL(OAUTH);u.searchParams.set('mode','start');u.searchParams.set('pin',pin());const d=await json(u);if(!d.authorization_url)throw new Error('Google no devolvió autorización');location.href=d.authorization_url;}
      catch(e){set(e.message,'error');connect.disabled=false;}
    };
    check.onclick=refresh;
    window.addEventListener('laberinto:authenticated',refresh);
    if(returned==='connected'){set('Google conectado. Comprobando negocios…','ok');setTimeout(refresh,100);}
    else if(returned){set('No se pudo completar la conexión de Google. Intenta conectar nuevamente.','error');}
    else if(pin())refresh();
  }
  boot();
})();