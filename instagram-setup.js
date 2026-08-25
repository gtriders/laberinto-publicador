(() => {
  const API = 'https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/laberinto-api';
  const PIN_KEY = 'laberinto_session_pin';
  const getPin = () => sessionStorage.getItem(PIN_KEY) || '';
  const getBrand = () => document.querySelector('#aiBrand')?.value || 'adria-sushi';
  const labels = {
    'adria-sushi':'Adrià Sushi',
    'adria-sangucheria':'Sanguchería Adrià',
    'pet':'Adrià PET',
    'chef-rafael':'Chef Rafael'
  };
  const brandLabel = (id) => labels[id] || id;
  const enabled = Object.keys(labels);

  const api = async (body) => {
    const res = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...body,pin:getPin()}) });
    const data = await res.json().catch(()=>({}));
    if(!res.ok){ const e=new Error(data.error||'Error de conexión'); e.detail=data.detail||''; throw e; }
    return data;
  };
  function setMessage(text){ const n=document.querySelector('#aiStatus'); if(n)n.textContent=text; }

  function installControls(){
    const actions=document.querySelector('.ai-actions'), aiConfig=document.querySelector('#aiConfigBtn');
    if(!actions||!aiConfig||document.querySelector('#igConfigBtn')) return false;
    const metaBtn=document.createElement('button'); metaBtn.id='igMetaBtn'; metaBtn.className='btn secondary'; metaBtn.type='button'; metaBtn.textContent='Abrir Meta';
    metaBtn.addEventListener('click',()=>{ window.open('https://developers.facebook.com/apps/2518966771958311/','_blank','noopener,noreferrer'); setMessage('En Meta genera el access token de la cuenta correspondiente a '+brandLabel(getBrand())+'.'); });
    const tokenBtn=document.createElement('button'); tokenBtn.id='igConfigBtn'; tokenBtn.className='btn secondary'; tokenBtn.type='button'; tokenBtn.textContent='Conectar Instagram';
    tokenBtn.addEventListener('click',async()=>{
      const brand=getBrand();
      if(!enabled.includes(brand)){ setMessage('La publicación automática todavía no está habilitada para esta marca.'); return; }
      const token=prompt('Pega el access token de Instagram para '+brandLabel(brand)+'. Se validará y guardará solo en Supabase Vault.'); if(!token)return;
      tokenBtn.disabled=true; setMessage('Validando Instagram para '+brandLabel(brand)+'...');
      try{ const data=await api({action:'set_instagram_token',brand_id:brand,access_token:token.trim()}); tokenBtn.textContent='Instagram conectado'; const badge=document.querySelector('#igReadyBadge'); if(badge){badge.textContent=(data.username?'@'+data.username:'Instagram')+' conectado';badge.className='ai-badge ok';} setMessage(brandLabel(brand)+' quedó conectado.'); await retryLastFailed(brand); }
      catch(error){ tokenBtn.disabled=false; setMessage((error.message||'Instagram rechazó el token')+(error.detail?' — '+error.detail:'')); }
    });
    actions.insertBefore(metaBtn,document.querySelector('#aiStatus')); actions.insertBefore(tokenBtn,document.querySelector('#aiStatus'));
    document.querySelector('#aiBrand')?.addEventListener('change',refreshInstagramState); refreshInstagramState(); return true;
  }

  async function refreshInstagramState(){
    try{ const brand=getBrand(),data=await api({action:'status'}),state=data.instagram_by_brand?.[brand],ready=state?.status==='connected'&&state?.token_ready===true; const btn=document.querySelector('#igConfigBtn'),badge=document.querySelector('#igReadyBadge');
      if(btn){ btn.textContent=ready?'Instagram conectado':'Conectar Instagram'; btn.disabled=!!ready||!enabled.includes(brand); }
      if(badge){ badge.textContent=ready?((state.instagram_handle?'@'+state.instagram_handle:'Instagram')+' conectado'):(enabled.includes(brand)?'Instagram '+brandLabel(brand)+' pendiente':'Instagram no habilitado'); badge.className='ai-badge '+(ready?'ok':'warn'); }
    }catch{}
  }

  async function retryLastFailed(brand){
    try{ const queue=await api({action:'list'}); const failed=(queue.items||[]).filter(x=>x.brand_id===brand&&x.status==='failed').sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0))[0]; if(!failed)return; if(!confirm('Instagram ya está conectado. ¿Reintentar ahora la publicación que falló?'))return; await api({action:'retry',id:failed.id}); setMessage('Publicación enviada nuevamente a la cola. El publicador la tomará en el próximo minuto.'); document.querySelector('#aiRefreshQueue')?.click(); }catch{ setMessage('Instagram quedó conectado, pero no pudimos reintentar automáticamente la publicación anterior.'); }
  }

  if(!installControls()){ const observer=new MutationObserver(()=>{if(installControls())observer.disconnect();}); observer.observe(document.documentElement,{childList:true,subtree:true}); }
})();
