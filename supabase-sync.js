(() => {
  const SUPABASE_URL = 'https://ufsxdlmnjuaymdszyjue.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_eHnq_wktiWAmzlm0yzRnow_KKLrR2pN';
  const GOOGLE_OAUTH_FUNCTION = SUPABASE_URL + '/functions/v1/google-business-oauth';


  const panel = document.createElement('section');
  panel.className = 'panel integration-panel';
  panel.innerHTML = '<div class="panel-heading"><div><span class="eyebrow">DATOS CENTRALES</span><h2>Conexiones</h2></div><span id="supabaseBadge" class="badge ready">Conectando...</span></div><p id="supabaseMessage" class="helper">Estamos comprobando la biblioteca compartida.</p><div id="supabaseBrands" class="connection-list"></div><div class="connection-actions"><button id="googleConnectButton" class="button secondary" type="button">Conectar Google</button><span id="googleConnectionMessage" class="helper">Google Business Profile listo para autorizar.</span></div>';
  document.querySelector('main')?.prepend(panel);

  const googleButton = document.querySelector('#googleConnectButton');
  const googleMessage = document.querySelector('#googleConnectionMessage');
  const googleResult = new URLSearchParams(window.location.search).get('google');
  if (googleResult === 'connected') googleMessage.textContent = 'Google conectado correctamente.';
  if (googleResult && googleResult !== 'connected') googleMessage.textContent = 'No se pudo completar la conexión con Google.';
  if (googleResult) window.history.replaceState({}, document.title, window.location.pathname);
  googleButton?.addEventListener('click', async () => {
    googleButton.disabled = true;
    googleMessage.textContent = 'Abriendo autorización de Google...';
    try {
      const response = await fetch(GOOGLE_OAUTH_FUNCTION + '?mode=start');
      if (!response.ok) throw new Error('No se pudo iniciar Google');
      const data = await response.json();
      window.location.href = data.authorization_url;
    } catch (error) {
      googleButton.disabled = false;
      googleMessage.textContent = 'Google todavía no está disponible.';
    }
  });


  const headers = { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: 'Bearer ' + SUPABASE_PUBLISHABLE_KEY };
  Promise.all([
    fetch(SUPABASE_URL + '/rest/v1/brands?select=id,name,status&order=name', { headers }),
    fetch(SUPABASE_URL + '/rest/v1/rescue_windows?select=title,enabled&limit=1', { headers }),
  ]).then(async ([brandsResponse, rescueResponse]) => {
    if (!brandsResponse.ok || !rescueResponse.ok) throw new Error('Supabase no disponible');
    const [brands, rescue] = await Promise.all([brandsResponse.json(), rescueResponse.json()]);
    document.querySelector('#supabaseBadge').textContent = 'Conectado';
    document.querySelector('#supabaseMessage').textContent = 'Supabase activo: ' + brands.length + ' marcas listas y Rescate ' + (rescue[0]?.title || '13:00') + ' preparado.';
    document.querySelector('#supabaseBrands').innerHTML = brands.map((brand) => '<div class="connection-row"><strong>' + brand.name + '</strong><span>' + (brand.status === 'active' ? 'Activa' : 'Pausada') + '</span></div>').join('');
  }).catch(() => {
    document.querySelector('#supabaseBadge').textContent = 'Modo local';
    document.querySelector('#supabaseMessage').textContent = 'La web sigue funcionando con los datos del navegador.';
  });
})();

