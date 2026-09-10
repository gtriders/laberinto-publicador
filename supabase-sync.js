(() => {
  const SUPABASE_URL='https://ufsxdlmnjuaymdszyjue.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY='sb_publishable_eHnq_wktiWAmzlm0yzRnow_KKLrR2pN';
  const GOOGLE_OAUTH_FUNCTION=SUPABASE_URL+'/functions/v1/google-business-oauth';
  const GOOGLE_API_FUNCTION=SUPABASE_URL+'/functions/v1/google-business-api';
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  const grid=document.querySelector('#settingsView .settings-grid');
  if(!grid)return;
  const panel=document.createElement('article');
  panel.id='settingsCentralData';
  panel.className='settings-card settings-full integration-panel';
  panel.innerHTML='<div class="panel-heading"><div><span class="eyebrow">DATOS CENTRALES</span><h3>Sistema y conexiones</h3></div><span id="supabaseBadge" class="badge ready">Conectando...</span></div><p id="supabaseMessage" class="helper">Comprobando la biblioteca compartida.</p><div id="supabaseBrands" class="connection-list"></div><div class="connection-actions"><button id="googleConnectButton" class="btn secondary" type="button">Conectar Google</button><button id="googleLocationsButton" class="btn secondary" type="button">Comprobar perfiles Google</button><span id="googleLocationsMessage" class="helper"></span><span id="googleConnectionMessage" class="helper">Google Business Profile pendiente de comprobación.</span></div>';
  grid.insertBefore(panel,document.querySelector('#settingsHistory')||null);

  const googleButton=document.querySelector('#googleConnectButton');
  const locationsButton=document.querySelector('#googleLocationsButton');
  const locationsMessage=document.querySelector('#googleLocationsMessage');
  const googleMessage=document.querySelector('#googleConnectionMessage');

  async function readGoogleProfiles(){
    const response=await fetch(GOOGLE_API_FUNCTION);
    const data=await response.json().catch(()=>({}));
    if(!response.ok){const error=new Error(data.error||'No se pudieron leer los perfiles');error.detail=data.detail||'';throw error;}
    return Array.isArray(data.locations)?data.locations:[];
  }

  async function refreshGoogleStatus(){
    locationsButton.disabled=true;
    googleMessage.textContent='Comprobando Google Business Profile…';
    try{
      const locations=await readGoogleProfiles();
      if(locations.length){
        googleMessage.textContent=`Google conectado: ${locations.length} perfil(es) disponible(s). La publicación directa aún requiere validar el servidor.`;
        googleMessage.className='helper ok';
        locationsMessage.textContent=locations.map(location=>location.title||location.name).filter(Boolean).join(' · ');
      }else{
        googleMessage.textContent='Google autorizado, pero no devolvió perfiles disponibles.';
        googleMessage.className='helper warn';
        locationsMessage.textContent='';
      }
    }catch(error){
      googleMessage.textContent=`Google pendiente: ${error.detail||error.message}`;
      googleMessage.className='helper warn';
      locationsMessage.textContent='';
    }finally{locationsButton.disabled=false;}
  }
  locationsButton?.addEventListener('click',refreshGoogleStatus);

  const googleParams=new URLSearchParams(window.location.search),googleCode=googleParams.get('code'),googleState=googleParams.get('state'),googleResult=googleParams.get('google');
  if(googleCode&&googleState){
    googleMessage.textContent='Finalizando conexión con Google…';
    fetch(`${GOOGLE_OAUTH_FUNCTION}?mode=callback&code=${encodeURIComponent(googleCode)}&state=${encodeURIComponent(googleState)}`)
      .then(response=>{if(!response.ok)throw new Error('No se pudo completar la autorización');return response.json();})
      .then(()=>refreshGoogleStatus())
      .catch(error=>{googleMessage.textContent=error.message;googleMessage.className='helper warn';})
      .finally(()=>window.history.replaceState({},document.title,window.location.pathname));
  }else{
    if(googleResult&&googleResult!=='connected'){googleMessage.textContent='No se pudo completar la conexión con Google.';googleMessage.className='helper warn';}
    if(googleResult)window.history.replaceState({},document.title,window.location.pathname);
    refreshGoogleStatus();
  }

  googleButton?.addEventListener('click',async()=>{
    googleButton.disabled=true;googleMessage.textContent='Abriendo autorización de Google…';
    try{const response=await fetch(GOOGLE_OAUTH_FUNCTION+'?mode=start'),data=await response.json().catch(()=>({}));if(!response.ok||!data.authorization_url)throw new Error(data.error||'No se pudo iniciar Google');window.location.href=data.authorization_url;}
    catch(error){googleButton.disabled=false;googleMessage.textContent=error.message;googleMessage.className='helper warn';}
  });

  const headers={apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:'Bearer '+SUPABASE_PUBLISHABLE_KEY};
  Promise.all([
    fetch(SUPABASE_URL+'/rest/v1/brands?select=id,name,status&order=name',{headers}),
    fetch(SUPABASE_URL+'/rest/v1/rescue_windows?select=title,enabled&limit=1',{headers})
  ]).then(async([brandsResponse,rescueResponse])=>{
    if(!brandsResponse.ok||!rescueResponse.ok)throw new Error('Supabase no disponible');
    const [brands,rescue]=await Promise.all([brandsResponse.json(),rescueResponse.json()]);
    document.querySelector('#supabaseBadge').textContent='Conectado';
    document.querySelector('#supabaseMessage').textContent=`Supabase activo: ${brands.length} marcas listas y Rescate ${rescue[0]?.title||'13:00'} preparado.`;
    document.querySelector('#supabaseBrands').innerHTML=brands.map(brand=>`<div class="connection-row"><strong>${esc(brand.name)}</strong><span>${brand.status==='active'?'Activa':'Pausada'}</span></div>`).join('');
  }).catch(()=>{
    document.querySelector('#supabaseBadge').textContent='Sin conexión';
    document.querySelector('#supabaseMessage').textContent='No se pudo comprobar Supabase. La cola y la programación necesitan conexión al servidor.';
  });
})();
