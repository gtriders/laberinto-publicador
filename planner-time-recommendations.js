(() => {
  const API='https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/posting-time-api';
  const PIN_KEY='laberinto_session_pin';
  const cache=new Map();
  const fallback={0:[12,19],1:[12,19],2:[13,19],3:[12,18],4:[13,19],5:[13,20],6:[13,20]};
  const css=document.createElement('style');
  css.textContent=`
    .planner-time-box{margin-top:12px;border-top:1px solid #ece7df;padding-top:12px;display:grid;gap:8px}
    .planner-time-row{display:grid;grid-template-columns:minmax(140px,.8fr) minmax(130px,.6fr) 1fr;gap:10px;align-items:end}
    .planner-time-row label{display:grid;gap:5px;font-size:.78rem;font-weight:750;color:#5f574d}
    .planner-time-row input,.planner-time-row select{width:100%;min-width:0}
    .planner-best-times{display:flex;gap:6px;flex-wrap:wrap;align-items:center;min-height:42px}
    .planner-best-label{font-size:.72rem;font-weight:800;letter-spacing:.03em;color:#7d7469;margin-right:2px}
    .planner-time-chip{border:1px solid #d9cfc0;background:#f7f2ea;color:#4f463d;border-radius:999px;padding:6px 9px;font-size:.78rem;font-weight:800;cursor:pointer}
    .planner-time-chip.best{background:#111827;color:#fff;border-color:#111827}
    .planner-time-meta{font-size:.72rem;color:#8a8176}
    @media(max-width:760px){.planner-time-row{grid-template-columns:1fr 1fr}.planner-best-times{grid-column:1/-1}}
  `;
  document.head.appendChild(css);
  const fmt=h=>`${String(h).padStart(2,'0')}:00`;
  const localDateValue=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
  const getWeekday=value=>{if(!value)return new Date().getDay();const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d,12,0,0).getDay();};
  async function fetchRecommendations(brand){
    if(cache.has(brand))return cache.get(brand);
    try{
      const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:sessionStorage.getItem(PIN_KEY)||'',brand_id:brand})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||'No se pudieron cargar horarios');
      cache.set(brand,d.items||[]);return d.items||[];
    }catch{return [];}
  }
  function mount(){
    const planner=document.querySelector('#plannerView'),brand=document.querySelector('#plannerBrand');
    if(!planner||!brand)return false;
    if(document.querySelector('#plannerTimeBox'))return true;
    const toolbar=planner.querySelector('.planner-toolbar');if(!toolbar)return false;
    const box=document.createElement('div');box.id='plannerTimeBox';box.className='planner-time-box';
    box.innerHTML=`<div class="planner-time-row"><label>Fecha<input id="plannerDate" type="date"></label><label>Hora<select id="plannerHour"></select></label><div><div id="plannerBestTimes" class="planner-best-times"></div><div id="plannerTimeMeta" class="planner-time-meta"></div></div></div>`;
    toolbar.parentElement?.appendChild(box);
    const date=document.querySelector('#plannerDate'),hour=document.querySelector('#plannerHour');
    date.value=localDateValue();
    for(let h=8;h<=22;h++){const o=document.createElement('option');o.value=fmt(h);o.textContent=fmt(h);hour.appendChild(o);}
    async function refresh(){
      const brandId=brand.value,weekday=getWeekday(date.value),rows=await fetchRecommendations(brandId);
      let recs=rows.filter(x=>Number(x.weekday)===weekday).sort((a,b)=>Number(a.rank)-Number(b.rank));
      if(!recs.length)recs=(fallback[weekday]||[13,19]).map((h,i)=>({hour_local:h,rank:i+1,source:'fallback',sample_size:0}));
      const top=recs.slice(0,3),root=document.querySelector('#plannerBestTimes');
      root.innerHTML=`<span class="planner-best-label">Mejores horas</span>${top.map((x,i)=>`<button type="button" class="planner-time-chip ${i===0?'best':''}" data-hour="${fmt(Number(x.hour_local))}">${i===0?'★ ':''}${fmt(Number(x.hour_local))}</button>`).join('')}`;
      root.querySelectorAll('[data-hour]').forEach(b=>b.addEventListener('click',()=>{hour.value=b.dataset.hour;}));
      const current=hour.value,valid=[...hour.options].some(o=>o.value===fmt(Number(top[0]?.hour_local)));
      if(!current||!valid)hour.value=fmt(Number(top[0]?.hour_local||13));
      else hour.value=fmt(Number(top[0]?.hour_local||13));
      const real=top.some(x=>x.source==='instagram_history'&&Number(x.sample_size)>0);
      const updated=rows[0]?.updated_at?new Date(rows[0].updated_at).toLocaleDateString('es-CL'):'';
      document.querySelector('#plannerTimeMeta').textContent=real?`Basado en historial de esta cuenta${updated?` · actualizado ${updated}`:''}`:`Referencia inicial${updated?` · actualizado ${updated}`:''}`;
    }
    brand.addEventListener('change',refresh);date.addEventListener('change',refresh);refresh();
    return true;
  }
  let n=0;const t=setInterval(()=>{n++;if(mount()||n>80)clearInterval(t);},250);mount();
})();
