(() => {
  const SUPABASE_URL = 'https://ufsxdlmnjuaymdszyjue.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_eHnq_wktiWAmzlm0yzRnow_KKLrR2pN';

  const panel = document.createElement('section');
  panel.className = 'panel integration-panel';
  panel.innerHTML = '<div class="panel-heading"><div><span class="eyebrow">DATOS CENTRALES</span><h2>Conexiones</h2></div><span id="supabaseBadge" class="badge ready">Conectando...</span></div><p id="supabaseMessage" class="helper">Estamos comprobando la biblioteca compartida.</p><div id="supabaseBrands" class="connection-list"></div><p class="helper">Instagram, Google Business Profile y TikTok se conectaran despues mediante autorizacion segura.</p>';
  document.querySelector('main')?.prepend(panel);

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
