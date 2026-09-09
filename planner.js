(() => {
  const brands={
    'adria-sushi':{name:'Adrià Sushi',focus:'noche, delivery, tablas, rolls, ceviches, Thai y coctelería'},
    'adria-sangucheria':{name:'Sanguchería Adrià',focus:'almuerzo, barrio, fuente de soda, churrascos, completos, schop y combos'}
  };
  const DAY=86400000;
  const atNoon=(year,month,day)=>new Date(year,month-1,day,12);
  const nthWeekday=(year,month,weekday,n)=>{const first=atNoon(year,month,1),offset=(weekday-first.getDay()+7)%7;return atNoon(year,month,1+offset+(n-1)*7);};
  const lastFriday=(year,month)=>{const last=atNoon(year,month+1,0);return atNoon(year,month,last.getDate()-((last.getDay()+2)%7));};
  const definitions=[
    {id:'san-valentin',name:'San Valentín',date:y=>atNoon(y,2,14),brands:['adria-sushi'],hook:'Cena, tablas para compartir y una experiencia cercana.',offer:'Reserva o pedido especial para dos, solamente con productos y condiciones confirmadas.'},
    {id:'madre',name:'Día de la Madre',date:y=>nthWeekday(y,5,0,2),brands:Object.keys(brands),hook:'Celebrar con comida compartida y recuerdos familiares.',offer:'Menú, tabla o combo familiar confirmado antes de comunicar.'},
    {id:'completo',name:'Día del Completo',date:y=>atNoon(y,5,24),brands:['adria-sangucheria'],hook:'Un clásico chileno de fuente de soda y barrio.',offer:'Activación de completos con precio o promoción previamente confirmados.'},
    {id:'hamburguesa',name:'Día de la Hamburguesa',date:y=>atNoon(y,5,28),brands:['adria-sangucheria'],hook:'Producto protagonista, preparación real y antojo.',offer:'Destacar la hamburguesa disponible sin inventar ingredientes ni descuentos.'},
    {id:'padre',name:'Día del Padre',date:y=>nthWeekday(y,6,0,3),brands:Object.keys(brands),hook:'Compartir en familia con una propuesta abundante.',offer:'Mesa, tabla o combo confirmado para celebrar.'},
    {id:'sushi',name:'Día Internacional del Sushi',date:y=>atNoon(y,6,18),brands:['adria-sushi'],hook:'Autoridad de producto, oficio y variedad real de la carta.',offer:'Secuencia de producto, proceso y conversión con una propuesta confirmada.'},
    {id:'vino',name:'Día Nacional del Vino',date:y=>atNoon(y,9,4),brands:['adria-sushi'],hook:'Maridaje y experiencia de mesa.',offer:'Mostrar vinos realmente disponibles y combinaciones verificadas.'},
    {id:'fiestas-patrias',name:'Fiestas Patrias',date:y=>atNoon(y,9,18),brands:Object.keys(brands),hook:'Encuentro, barrio y celebración chilena.',offer:'Informar horarios, atención y promociones solo después de confirmarlos.'},
    {id:'turismo',name:'Día Mundial del Turismo',date:y=>atNoon(y,9,27),brands:Object.keys(brands),hook:'Invitar a descubrir el barrio y la experiencia Adrià.',offer:'Contenido de local, equipo, ubicación y platos reconocibles.'},
    {id:'halloween',name:'Halloween',date:y=>atNoon(y,10,31),brands:Object.keys(brands),hook:'Contenido visual y entretenido sin perder identidad de marca.',offer:'Pieza temática y CTA de pedido o visita con condiciones reales.'},
    {id:'sandwich',name:'Día Mundial del Sándwich',date:y=>atNoon(y,11,3),brands:['adria-sangucheria'],hook:'Historia, preparación y antojo de un sánguche emblemático.',offer:'Elegir un producto real como protagonista y llevarlo a conversión.'},
    {id:'black-friday',name:'Black Friday',date:y=>lastFriday(y,11),brands:Object.keys(brands),hook:'Oportunidad de venta puntual con una oferta clara.',offer:'Solo activar si existe una promoción rentable y confirmada.'},
    {id:'navidad',name:'Navidad',date:y=>atNoon(y,12,25),brands:Object.keys(brands),hook:'Reuniones, regalos y comida para compartir.',offer:'Pedidos anticipados, horarios y formatos especiales confirmados.'},
    {id:'ano-nuevo',name:'Año Nuevo',date:y=>atNoon(y,12,31),brands:Object.keys(brands),hook:'Cierre de año y soluciones para compartir.',offer:'Comunicar reservas, pedidos y horarios reales con anticipación.'}
  ];
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const iso=date=>{const local=new Date(date.getTime()-date.getTimezoneOffset()*60000);return local.toISOString().slice(0,10);};
  const fmt=date=>new Intl.DateTimeFormat('es-CL',{weekday:'short',day:'numeric',month:'long',year:'numeric'}).format(date);
  function upcoming(brand){
    const now=new Date(),start=atNoon(now.getFullYear(),now.getMonth()+1,now.getDate()),limit=new Date(start.getTime()+180*DAY),items=[];
    for(const year of [now.getFullYear(),now.getFullYear()+1])for(const def of definitions){const date=def.date(year);if(date>=start&&date<=limit&&def.brands.includes(brand))items.push({...def,date});}
    return items.sort((a,b)=>a.date-b.date);
  }
  const css=document.createElement('style');css.textContent=`.planner-view{display:none}.planner-view.active{display:block}.commercial-head{display:flex;gap:12px;align-items:end;flex-wrap:wrap}.commercial-head label{min-width:240px}.commercial-range{color:#756b5d;font-size:.84rem}.commercial-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.commercial-card{border:1px solid #e7dfd2;border-radius:16px;background:#fff;padding:16px;display:grid;gap:11px}.commercial-date{font-size:.82rem;font-weight:800;color:#7a6545;text-transform:capitalize}.commercial-card h3,.commercial-card p{margin:0}.ecm-steps{display:grid;gap:7px}.ecm-step{border-left:3px solid #d8cfc0;padding-left:9px;font-size:.82rem;line-height:1.4}.ecm-step strong{display:block}.commercial-actions{display:flex;justify-content:flex-end}.commercial-empty{grid-column:1/-1}@media(max-width:760px){.commercial-grid{grid-template-columns:1fr}.commercial-head,.commercial-head label{width:100%}}`;document.head.appendChild(css);
  function boot(){
    const tabs=document.querySelector('.app-tabs'),shell=document.querySelector('main.main-view'),settings=document.querySelector('#settingsView');if(!tabs||!shell||!settings)return setTimeout(boot,150);if(document.querySelector('#tabPlanner'))return;
    const button=document.createElement('button');button.id='tabPlanner';button.className='app-tab';button.type='button';button.textContent='Calendario comercial';tabs.insertBefore(button,document.querySelector('#tabSettings'));
    const view=document.createElement('main');view.id='plannerView';view.className='shell planner-view';view.innerHTML=`<section class="panel"><div class="panel-heading"><div><span class="eyebrow">MÉTODO ECM</span><h2>Calendario comercial</h2></div></div><p class="helper">Fechas y oportunidades de los próximos seis meses. Cada activación sigue Atracción → Conversión → Repetición y siempre requiere revisión antes de publicarse.</p><div class="commercial-head"><label>Marca<select id="commercialBrand">${Object.entries(brands).map(([id,brand])=>`<option value="${id}">${brand.name}</option>`).join('')}</select></label><span class="commercial-range">Ventana móvil de 180 días</span></div></section><section class="panel"><div id="commercialGrid" class="commercial-grid"></div></section>`;settings.insertAdjacentElement('beforebegin',view);
    const hide=()=>view.classList.remove('active');
    button.addEventListener('click',()=>{shell.classList.add('settings-hidden');settings.classList.remove('active');document.querySelector('#studioView')?.classList.remove('active');document.querySelector('#ugcView')?.classList.remove('active');view.classList.add('active');document.querySelectorAll('.app-tab').forEach(tab=>tab.classList.remove('active'));button.classList.add('active');render();});
    document.querySelector('#tabPublicador')?.addEventListener('click',hide);document.querySelector('#tabSettings')?.addEventListener('click',hide);document.querySelector('#commercialBrand').addEventListener('change',render);
    function render(){
      const brandId=document.querySelector('#commercialBrand').value,brand=brands[brandId],items=upcoming(brandId),root=document.querySelector('#commercialGrid');
      root.innerHTML=items.length?items.map(item=>{const attraction=new Date(item.date.getTime()-21*DAY),conversion=new Date(item.date.getTime()-7*DAY),repetition=new Date(item.date.getTime()+DAY);return `<article class="commercial-card"><div class="commercial-date">${esc(fmt(item.date))}</div><h3>${esc(item.name)}</h3><p>${esc(item.hook)}</p><div class="ecm-steps"><div class="ecm-step"><strong>Atracción · ${esc(fmt(attraction))}</strong>Historia, contexto o contenido útil para generar interés.</div><div class="ecm-step"><strong>Conversión · ${esc(fmt(conversion))}</strong>${esc(item.offer)}</div><div class="ecm-step"><strong>Repetición · ${esc(fmt(repetition))}</strong>Agradecer, reutilizar respuestas reales e invitar a volver.</div></div><div class="commercial-actions"><button class="btn primary" type="button" data-prepare="${esc(item.id)}">Preparar en Publicador</button></div></article>`;}).join(''):'<div class="empty commercial-empty">No hay fechas comerciales dentro de esta ventana.</div>';
      root.querySelectorAll('[data-prepare]').forEach(action=>action.addEventListener('click',()=>{const item=items.find(x=>x.id===action.dataset.prepare);if(!item)return;const conversion=new Date(Math.max(Date.now()+DAY,item.date.getTime()-7*DAY));conversion.setHours(13,0,0,0);window.dispatchEvent(new CustomEvent('laberinto:calendar-draft',{detail:{brand_id:brandId,title:item.name,scheduled_at:conversion,context:`Calendario comercial ECM · ${item.name}. Marca: ${brand.name}. Enfoque de marca: ${brand.focus}. Objetivo de esta pieza: Conversión. ${item.offer} No inventar precios, promociones, ingredientes, horarios ni disponibilidad.`}}));document.querySelector('#tabPublicador')?.click();}));
    }
    render();
  }
  boot();
})();
