(() => {
  const originalFetch=window.fetch.bind(window);
  const shuffle=(arr)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  window.fetch=async function(input,init){
    const response=await originalFetch(input,init);
    try{
      const url=typeof input==='string'?input:(input?.url||'');
      if(!url.includes('/functions/v1/laberinto-api')||String(init?.method||'GET').toUpperCase()!=='POST'||typeof init?.body!=='string')return response;
      const requestBody=JSON.parse(init.body);
      if(requestBody?.action!=='instagram_history')return response;
      const data=await response.clone().json();
      if(!response.ok||!Array.isArray(data?.items))return response;

      const now=Date.now(),day=86400000;
      const compatible=data.items.filter(x=>['IMAGE','CAROUSEL_ALBUM'].includes(x.media_type)&&x.timestamp);
      const recent=compatible.filter(x=>{const age=(now-new Date(x.timestamp).getTime())/day;return age>=60&&age<365;});
      const older=compatible.filter(x=>{const age=(now-new Date(x.timestamp).getTime())/day;return age>=365;});

      const featured=[];
      featured.push(...shuffle(recent).slice(0,2));
      featured.push(...shuffle(older).slice(0,Math.max(0,4-featured.length)));
      if(featured.length<4){
        const used=new Set(featured.map(x=>String(x.id)));
        featured.push(...shuffle(compatible.filter(x=>!used.has(String(x.id)))).slice(0,4-featured.length));
      }
      const featuredIds=new Set(featured.map(x=>String(x.id)));

      data.items=data.items.map(x=>{
        const ageDays=x.timestamp?Math.max(0,(now-new Date(x.timestamp).getTime())/day):99999;
        const smallRecentBonus=ageDays<365?300:ageDays<1095?120:0;
        return {...x,original_rescue_score:x.rescue_score,rescue_score:featuredIds.has(String(x.id))?100000+Math.random()*1000:Math.random()*1000+smallRecentBonus};
      });
      return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:response.headers});
    }catch{
      return response;
    }
  };

  const cleanMeta=()=>document.querySelectorAll('.ig-rescue-meta').forEach(el=>{el.textContent=el.textContent.replace(/\s*·\s*puntaje\s+[\d.,]+/i,'');});
  const tuneUi=()=>{
    const badge=document.querySelector('#igRescueBadge');
    const panel=document.querySelector('.ig-rescue');
    if(!badge||!panel)return false;
    badge.textContent='Aleatorio mixto';
    const helper=panel.querySelector('.helper');
    if(helper)helper.textContent='Cada tanda mezcla publicaciones más recientes con otras antiguas al azar. No prioriza siempre las que tuvieron más likes y no repite las que ya viste en esta sesión.';
    cleanMeta();
    return true;
  };
  const observer=new MutationObserver(()=>cleanMeta());observer.observe(document.documentElement,{subtree:true,childList:true});
  let tries=0;const timer=setInterval(()=>{tries++;if(tuneUi()||tries>80)clearInterval(timer);},150);tuneUi();
})();