(() => {
  const API = 'https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/laberinto-api';
  const PIN_KEY = 'laberinto_session_pin';
  const getPin = () => sessionStorage.getItem(PIN_KEY) || '';

  const api = async (body) => {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, pin: getPin() })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data.error || 'Error de conexión');
      error.detail = data.detail || '';
      throw error;
    }
    return data;
  };

  function setMessage(text) {
    const status = document.querySelector('#aiStatus');
    if (status) status.textContent = text;
  }

  function installControls() {
    const actions = document.querySelector('.ai-actions');
    const aiConfig = document.querySelector('#aiConfigBtn');
    if (!actions || !aiConfig || document.querySelector('#igConfigBtn')) return false;

    const metaBtn = document.createElement('button');
    metaBtn.id = 'igMetaBtn';
    metaBtn.className = 'btn secondary';
    metaBtn.type = 'button';
    metaBtn.textContent = 'Abrir Meta';
    metaBtn.addEventListener('click', () => {
      window.open('https://developers.facebook.com/apps/2518966771958311/', '_blank', 'noopener,noreferrer');
      setMessage('En Meta: Instagram → API setup with Instagram login → Generate access token para @adria__sushi. Copia el token y vuelve aquí.');
    });

    const tokenBtn = document.createElement('button');
    tokenBtn.id = 'igConfigBtn';
    tokenBtn.className = 'btn secondary';
    tokenBtn.type = 'button';
    tokenBtn.textContent = 'Conectar Instagram';
    tokenBtn.addEventListener('click', async () => {
      const token = prompt('Pega el access token generado por Meta para @adria__sushi. Se validará con Instagram y se guardará solo en Supabase Vault; no quedará en GitHub ni en este navegador.');
      if (!token) return;
      tokenBtn.disabled = true;
      setMessage('Validando token directamente con Instagram...');
      try {
        const data = await api({ action: 'set_instagram_token', access_token: token.trim() });
        tokenBtn.textContent = 'Instagram conectado';
        const badge = document.querySelector('#igReadyBadge');
        if (badge) {
          badge.textContent = data.username ? '@' + data.username + ' conectado' : 'Instagram conectado';
          badge.className = 'ai-badge ok';
        }
        setMessage('Instagram conectado correctamente. Ya puede publicar automáticamente.');
        await retryLastFailed();
      } catch (error) {
        tokenBtn.disabled = false;
        setMessage((error.message || 'Instagram rechazó el token') + (error.detail ? ' — ' + error.detail : ''));
      }
    });

    actions.insertBefore(metaBtn, document.querySelector('#aiStatus'));
    actions.insertBefore(tokenBtn, document.querySelector('#aiStatus'));
    refreshInstagramState();
    return true;
  }

  async function refreshInstagramState() {
    try {
      const data = await api({ action: 'status' });
      const ready = data.instagram?.status === 'connected' && data.instagram_token_ready === true;
      const button = document.querySelector('#igConfigBtn');
      const badge = document.querySelector('#igReadyBadge');
      if (button && ready) {
        button.textContent = 'Instagram conectado';
        button.disabled = true;
      }
      if (badge) {
        badge.textContent = ready ? 'Instagram conectado' : 'Instagram pendiente';
        badge.className = 'ai-badge ' + (ready ? 'ok' : 'warn');
      }
    } catch {}
  }

  async function retryLastFailed() {
    try {
      const queue = await api({ action: 'list' });
      const failed = (queue.items || [])
        .filter(item => item.brand_id === 'adria-sushi' && item.status === 'failed')
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0];
      if (!failed) return;
      if (!confirm('Instagram ya está conectado. ¿Reintentar ahora la publicación que falló?')) return;
      await api({ action: 'retry', id: failed.id });
      setMessage('Publicación fallida enviada nuevamente a la cola. El publicador la tomará en el próximo minuto.');
      document.querySelector('#aiRefreshQueue')?.click();
    } catch (error) {
      setMessage('Instagram quedó conectado, pero no pudimos reintentar automáticamente la publicación anterior.');
    }
  }

  if (!installControls()) {
    const observer = new MutationObserver(() => {
      if (installControls()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
