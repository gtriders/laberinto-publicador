(() => {
  const PIN_KEY='laberinto_session_pin';
  const TIME_API='https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/posting-time-api';
  const brands={
    'adria-sushi':{name:'Adrià Sushi',ideas:[
      ['Proceso','Del armado al plato','Mostrar manos preparando un roll o plato, sin posar.','Toma 45°, manos trabajando, ingredientes reales y mesón limpio.','Mostrar cocina real y oficio.'],
      ['Experiencia','El sushi del barrio se vive aquí','Mostrar el local con personas y ambiente, no solo comida.','Plano amplio del salón o terraza con clientes, sin interrumpir el servicio.','Reforzar barrio, confianza y experiencia.'],
      ['Producto','Más que rolls','Mostrar un plato Thai, ceviche o entrada que tenga poca presencia reciente.','Primer plano natural del plato recién terminado, con algo del local de fondo.','Recordar que Adrià es más que rolls.'],
      ['Historia','Una escena que cuente Adrià','Usar un rincón, objeto o momento que permita contar años de barrio.','Foto espontánea de Rafael, Tamara, cocina o fachada trabajando.','Construir memoria y marca.'],
      ['Educación','Responder algo que siempre preguntan','Explicar una preparación, ingrediente o diferencia de la carta.','Foto detalle del producto y, si sirve, una toma del proceso.','Crear contenido útil.'],
      ['Venta','Una razón concreta para pedir hoy','Elegir un producto fuerte y acompañarlo de un CTA simple.','Foto limpia, apetecible y reconocible del producto completo.','Mover pedidos sin convertir el feed en promociones.']
    ]},
    'adria-sangucheria':{name:'Sanguchería Adrià',ideas:[
      ['Proceso','Plancha en acción','Mostrar cómo se prepara un churrasco, lomito o completo.','Foto o video corto de la plancha con manos trabajando y producto real.','Transmitir fuente de soda viva y oficio.'],
      ['Producto','El clásico que falta mostrar','Elegir entre completos, AS, churrascos o lomitos según lo menos mostrado.','Producto entero, mesa real y luz natural.','Ampliar percepción de la carta.'],
      ['Experiencia','Fuente de soda de barrio','Mostrar una mesa servida, barra o momento cotidiano del local.','Plano con comida y personas en contexto.','Vender experiencia y cercanía.'],
      ['Educación','¿Qué hace distinto este sánguche?','Explicar ingredientes y lógica de un clásico chileno.','Foto abierta del producto y detalle del relleno.','Dar contexto y generar conversación.'],
      ['Historia','Una fuente de soda con historia Adrià','Conectar Sanguchería con la historia familiar y de barrio.','Fachada, equipo o escena cotidiana sin posar.','Construir confianza.'],
      ['Venta','Antojo con CTA','Elegir un producto de buena rentabilidad o una promoción vigente.','Foto frontal o 45°; agregar acompañamientos solo si corresponden realmente.','Mover ventas con una pieza concreta.']
    ]},
    'pet':{name:'Adrià PET',ideas:[
      ['Mascotas','El producto en su contexto real','Mostrar una mascota real interactuando con un snack Adrià PET.','Mascota a su altura, luz natural y producto visible sin forzar la escena.','Generar confianza y cercanía.'],
      ['Proceso','De cocina a snack','Mostrar preparación, secado o envasado de un producto.','Detalle de manos, ingrediente y proceso higiénico.','Transmitir transparencia.'],
      ['Producto','Conoce un snack','Elegir un producto y mostrarlo claramente.','Envase y producto fuera del envase sobre fondo simple.','Facilitar comprensión y compra.'],
      ['Educación','Qué estás comprando','Explicar de qué está hecho un snack sin afirmaciones veterinarias.','Macro del ingrediente o producto y envase.','Aportar información útil sin promesas médicas.']
    ]},
    'chef-rafael':{name:'Chef Rafael',ideas:[
      ['Proceso','Lo que estoy haciendo hoy','Mostrar una decisión o trabajo real detrás de Adrià.','Foto espontánea trabajando, probando, costeando o cocinando.','Construir una marca personal creíble.'],
      ['Historia','Una historia detrás de Adrià','Contar un recuerdo concreto usando una foto o lugar real.','Foto antigua o actual relacionada con la historia.','Conectar experiencia y trayectoria.'],
      ['Aprendizaje','Algo que aprendí operando un restaurante','Partir de un problema real y explicar una conclusión útil.','Rafael en contexto real, no retrato corporativo.','Aportar valor desde experiencia.'],
      ['Cocina','El criterio del chef','Explicar por qué una preparación se hace de determinada forma.','Proceso y resultado final.','Mostrar oficio y criterio gastronómico.']
    ]},
    'laberinto-digital':{name:'Laberinto Digital',ideas:[
      ['Caso real','Una automatización que sí usamos','Mostrar una solución implementada realmente en Adrià o una pyme.','Captura limpia del sistema y contexto real del negocio.','Demostrar capacidad con evidencia.'],
      ['Educación','Un problema pyme explicado simple','Elegir un problema de marketing, WhatsApp, web o automatización.','Captura, esquema simple o pantalla real.','Aportar utilidad inmediata.'],
      ['Proceso','Así lo construimos','Mostrar antes, decisión y resultado de un proyecto.','Dos o tres capturas reales del proceso.','Hacer visible el trabajo detrás del servicio.'],
      ['Sistema','Menos tareas repetidas','Mostrar una tarea manual que se pueda ordenar o automatizar.','Foto del proceso real y captura de la solución.','Conectar dolor operacional con sistema.']
    ]}
  };

  const KEY='laberinto-content-planner-v2';
  const state=(()=>{try{return JSON.parse(localStorage.getItem(KEY))||{};}catch{return {};}})();
  const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const recommendations={};
  let recoLoaded=false;
  const localDateValue=(d=new Date())=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  const dateFromISO=iso=>{const [y,m,d]=iso.split('-').map(Number);return new Date(y,m-1,d);};
  const isoDate=(y,m,d)=>`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const nthWeekday=(year,month,weekday,n)=>{const first=new Date(year,month-1,1),delta=(weekday-first.getDay()+7)%7;return 1+delta+(n-1)*7;};
  const ensure=id=>state[id]??={cursor:0};

  function getIdeas(id,count=3){
    const cfg=brands[id],s=ensure(id),out=[];
    for(let n=0;n<count;n++)out.push({index:(s.cursor+n)%cfg.ideas.length,data:cfg.ideas[(s.cursor+n)%cfg.ideas.length]});
    return out;
  }

  async function loadRecommendations(){
    try{
      const r=await fetch(TIME_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:sessionStorage.getItem(PIN_KEY)||''})}),d=await r.json();
      if(!r.ok)return;
      Object.keys(recommendations).forEach(k=>delete recommendations[k]);
      for(const x of d.items||[]){recommendations[x.brand_id]??={};recommendations[x.brand_id][Number(x.weekday)]??=[];recommendations[x.brand_id][Number(x.weekday)].push(x);}
      recoLoaded=true;renderTimeChoices();
    }catch{}
  }

  function selectedWeekday(){const v=document.querySelector('#plannerDate')?.value;if(!v)return new Date().getDay();return dateFromISO(v).getDay();}
  function renderTimeChoices(){
    const select=document.querySelector('#plannerTime'),brand=document.querySelector('#plannerBrand')?.value||'adria-sushi';if(!select)return;
    const rows=(recommendations[brand]?.[selectedWeekday()]||[]).sort((a,b)=>a.rank-b.rank),recommended=new Map(rows.map(x=>[Number(x.hour_local),x]));
    const old=select.value;
    select.innerHTML=Array.from({length:16},(_,i)=>i+8).map(h=>`<option value="${String(h).padStart(2,'0')}:00">${String(h).padStart(2,'0')}:00${recommended.has(h)?' ★':''}</option>`).join('');
    const preferred=rows[0]?`${String(rows[0].hour_local).padStart(2,'0')}:00`:'13:00';
    select.value=old&&[...select.options].some(o=>o.value===old)?old:preferred;
    const note=document.querySelector('#plannerTimeNote');if(note){const top=rows.slice(0,3).map(x=>`${String(x.hour_local).padStart(2,'0')}:00`).join(' · ');note.textContent=top?`Mejores: ${top}`:(recoLoaded?'Horario base':'Cargando…');}
  }

  function eventIdeas(title){
    const generic=`Usar ${title} como contexto real de la marca, sin forzar una promoción.`;
    const map={
      'San Valentín':{
        'adria-sushi':'Mesa para dos, roll o cóctel real y un mensaje corto de compartir en el barrio.',
        'adria-sangucheria':'Plan simple para compartir: sánguche, schop o mesa real sin convertirlo en campaña romántica genérica.',
        'pet':'Mostrar que las mascotas también forman parte de los momentos que compartimos.',
        'chef-rafael':'Contar una escena real de cómo se vive San Valentín trabajando en un restaurante.',
        'laberinto-digital':'Mostrar cómo se prepara una campaña estacional simple sin sobrecargar al negocio.'
      },
      'Día del Completo':{'adria-sangucheria':'Producto protagonista: completo o italiano real, primer plano y CTA directo a la Sanguchería.'},
      'Día Internacional del Sushi':{'adria-sushi':'Elegir un roll representativo de Adrià y contar por qué sigue siendo parte del sushi del barrio.'},
      'Día del Perro':{'pet':'Mascota real del barrio con un snack Adrià PET; natural, sin afirmaciones de salud.'},
      'Día del Gato':{'pet':'Gato real y producto real; foco en convivencia y alimentación sin promesas médicas.'},
      'Fiestas Patrias':{
        'adria-sushi':'Mostrar cómo Adrià vive septiembre desde el barrio: local, banderines, comida o brindis real.',
        'adria-sangucheria':'Fuente de soda chilena en septiembre: completos, churrascos, schop o ambiente del local.',
        'chef-rafael':'Contar cómo cambia la operación del restaurante en Fiestas Patrias.',
        'laberinto-digital':'Mostrar una campaña de temporada construida desde una necesidad real de Adrià.'
      },
      'Halloween':{
        'adria-sushi':'Pieza visual simple con un producto real y un giro de Halloween, sin deformar la comida.',
        'adria-sangucheria':'Antojo nocturno con estética de Halloween suave y producto real.',
        'pet':'Mascota real con ambientación simple; evitar disfraces incómodos o escenas forzadas.'
      },
      'Navidad':{'adria-sushi':'Mensaje de barrio y equipo; más humano que promocional.','adria-sangucheria':'Mesa, equipo o agradecimiento de fin de año con identidad de fuente de soda.','pet':'Mascotas como parte de la familia y de la mesa, sin convertirlo en catálogo.'},
      'Fin de año':{'adria-sushi':'Resumen corto del año o agradecimiento a los vecinos.','adria-sangucheria':'Cierre de año desde el local y el equipo.','chef-rafael':'Qué aprendí este año operando y construyendo Adrià.','laberinto-digital':'Un sistema o automatización que realmente cambió el trabajo durante el año.'}
    };
    return brandId=>map[title]?.[brandId]||generic;
  }

  function commercialEvents(year){
    const raw=[
      [1,1,'Año Nuevo','Inicio de año. Sirve para mensajes de apertura, horarios, nuevos proyectos o una vuelta simple al barrio.'],
      [2,14,'San Valentín','Fecha fuerte para restaurantes. Conviene usarla solo si hay una experiencia, producto o mensaje real que mostrar.'],
      [2,20,'Día del Gato','Oportunidad puntual para Adrià PET y contenido de comunidad.'],
      [3,8,'Día de la Mujer','Mejor desde comunidad, equipo o historia real; evitar promociones forzadas.'],
      [5,nthWeekday(year,5,0,2),'Día de la Madre','Fecha de alta intención gastronómica. Funciona mejor mostrando experiencia real y reserva o compra clara.'],
      [5,24,'Día del Completo','Fecha muy útil para Sanguchería Adrià. Producto protagonista y mensaje directo.'],
      [6,nthWeekday(year,6,0,3),'Día del Padre','Buena fecha para planes de comida y reuniones familiares, sin necesidad de descuento.'],
      [6,18,'Día Internacional del Sushi','Fecha natural para Adrià Sushi: producto, historia, oficio o identidad de barrio.'],
      [7,21,'Día del Perro','Fecha útil para Adrià PET y para reforzar la idea de mascotas como parte de la mesa.'],
      [8,nthWeekday(year,8,0,2),'Día de la Niñez','Útil para contenidos familiares y experiencias de mesa, sin sobrepromocionar.'],
      [9,18,'Fiestas Patrias','Una de las fechas comerciales más importantes del mes. Mostrar cómo la vive realmente cada marca.'],
      [9,19,'Glorias del Ejército','Segundo día de Fiestas Patrias; se puede usar como continuidad si la operación y horarios lo justifican.'],
      [10,31,'Halloween','Fecha visual y de conversación. Mejor una intervención sencilla sobre contenido real.'],
      [12,24,'Nochebuena','Mensaje humano, horarios o preparación del equipo.'],
      [12,25,'Navidad','Contenido de comunidad y agradecimiento; no necesita ser promocional.'],
      [12,31,'Fin de año','Resumen, agradecimiento, aprendizaje o cierre de ciclo.']
    ];
    return raw.map(([m,d,title,why])=>({date:isoDate(year,m,d),title,why,idea:eventIdeas(title)}));
  }

  const css=document.createElement('style');
  css.textContent=`
    .planner-view{display:none}.planner-view.active{display:block}.planner-compact{display:grid;gap:14px}.planner-toolbar{display:flex;gap:8px;align-items:end;flex-wrap:wrap}.planner-toolbar label{display:grid;gap:4px;font-size:.72rem;font-weight:800;color:#756b5d}.planner-toolbar select,.planner-toolbar input{min-width:0}.planner-brand{min-width:210px}.planner-time-note{font-size:.72rem;color:#8a6f42;min-height:1em}.planner-list{display:grid;border-top:1px solid #ece8e1}.planner-row{border-bottom:1px solid #ece8e1}.planner-row summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:92px 1fr auto;gap:10px;align-items:center;padding:12px 2px}.planner-row summary::-webkit-details-marker{display:none}.planner-kind{font-size:.72rem;font-weight:850;color:#756b5d;text-transform:uppercase}.planner-row h3{font-size:1rem;margin:0}.planner-chevron{font-size:.85rem;color:#8b8175}.planner-row[open] .planner-chevron{transform:rotate(180deg)}.planner-detail{padding:0 0 12px 102px;display:grid;gap:7px}.planner-detail p{margin:0;color:#655c50}.planner-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:3px}.commercial-head{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}.month-nav{display:flex;gap:6px;align-items:center}.month-label{min-width:150px;text-align:center;font-weight:800}.calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.cal-dow{text-align:center;font-size:.68rem;font-weight:850;color:#8a8176;padding:4px}.cal-day{min-height:46px;border:1px solid #eee9e1;border-radius:9px;background:#fff;padding:6px;text-align:left;position:relative}.cal-day.muted{opacity:.25}.cal-day.today{outline:2px solid #111827}.cal-day.has-event{cursor:pointer;background:#fbf6ed}.cal-num{font-size:.78rem}.cal-dot{position:absolute;left:6px;right:6px;bottom:5px;height:3px;border-radius:999px;background:#9a7a45}.event-lines{display:grid;border-top:1px solid #ece8e1;margin-top:10px}.event-line{width:100%;border:0;border-bottom:1px solid #ece8e1;background:transparent;padding:10px 2px;text-align:left;display:grid;grid-template-columns:78px 1fr auto;gap:10px;cursor:pointer}.event-date{font-size:.78rem;font-weight:800;color:#756b5d}.event-title{font-weight:750}.event-arrow{color:#8a8176}.event-empty{padding:14px 0;color:#777}.event-dialog{border:0;border-radius:16px;padding:0;width:min(620px,calc(100vw - 28px));box-shadow:0 28px 80px rgba(0,0,0,.22)}.event-dialog::backdrop{background:rgba(17,24,39,.5)}.event-dialog-body{padding:20px;display:grid;gap:12px}.event-dialog-body h2,.event-dialog-body p{margin:0}.event-idea{padding:12px;border-radius:11px;background:#f7f2ea}.event-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}
    @media(max-width:700px){.planner-toolbar{display:grid;grid-template-columns:1fr 1fr}.planner-brand{grid-column:1/-1;width:100%}.planner-toolbar .btn{grid-column:1/-1}.planner-row summary{grid-template-columns:74px 1fr auto}.planner-detail{padding-left:84px}.calendar-grid{gap:3px}.cal-day{min-height:40px;padding:5px}.event-line{grid-template-columns:64px 1fr auto}.event-actions .btn{flex:1}}
  `;
  document.head.appendChild(css);

  const dialog=document.createElement('dialog');dialog.className='event-dialog';dialog.innerHTML=`<div class="event-dialog-body"><div class="commercial-head"><div><span class="eyebrow">CALENDARIO COMERCIAL</span><h2 id="eventTitle"></h2></div><button id="eventClose" class="icon-btn" type="button">×</button></div><p id="eventWhy"></p><div class="event-idea"><strong>Idea para <span id="eventBrand"></span></strong><p id="eventIdea" style="margin-top:5px"></p></div><div class="event-actions"><button id="eventCancel" class="btn secondary" type="button">Cerrar</button><button id="eventStudio" class="btn secondary" type="button">Crear con IA</button><button id="eventPublisher" class="btn primary" type="button">Pasar al Publicador</button></div></div>`;document.body.appendChild(dialog);
  let activeEvent=null,calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);

  function scheduledISO(date,time){const d=new Date(`${date}T${time||'13:00'}:00`);return Number.isNaN(d.getTime())?new Date(Date.now()+86400000).toISOString():d.toISOString();}
  function transferToPublisher({title,context,date}){
    const brandId=document.querySelector('#plannerBrand')?.value||'adria-sushi',time=document.querySelector('#plannerTime')?.value||'13:00';
    const safeDate=date&&dateFromISO(date).getTime()>Date.now()-86400000?date:(document.querySelector('#plannerDate')?.value||localDateValue(new Date(Date.now()+86400000)));
    window.dispatchEvent(new CustomEvent('laberinto:calendar-draft',{detail:{brand_id:brandId,title,context,scheduled_at:scheduledISO(safeDate,time)}}));
    document.querySelector('#tabPublicador')?.click();
  }
  function openStudioFor({title,context}){
    const brandId=document.querySelector('#plannerBrand')?.value||'adria-sushi';
    document.querySelector('#tabStudio')?.click();
    setTimeout(()=>{
      const brand=document.querySelector('#studioBrand'),idea=document.querySelector('#studioIdea');
      if(brand){brand.value=brandId;brand.dispatchEvent(new Event('change',{bubbles:true}));}
      if(idea)idea.value=`${title}. ${context}`;
    },80);
  }

  function openEvent(event){
    activeEvent=event;const brandId=document.querySelector('#plannerBrand')?.value||'adria-sushi';
    document.querySelector('#eventTitle').textContent=`${new Intl.DateTimeFormat('es-CL',{day:'numeric',month:'long'}).format(dateFromISO(event.date))} · ${event.title}`;
    document.querySelector('#eventWhy').textContent=event.why;
    document.querySelector('#eventBrand').textContent=brands[brandId]?.name||brandId;
    document.querySelector('#eventIdea').textContent=event.idea(brandId);
    dialog.showModal();
  }

  function renderCalendar(){
    const root=document.querySelector('#calendarGrid'),lines=document.querySelector('#eventLines'),label=document.querySelector('#monthLabel');if(!root||!lines||!label)return;
    const year=calendarCursor.getFullYear(),month=calendarCursor.getMonth(),events=commercialEvents(year).filter(x=>dateFromISO(x.date).getMonth()===month),byDate=new Map(events.map(x=>[x.date,x]));
    label.textContent=new Intl.DateTimeFormat('es-CL',{month:'long',year:'numeric'}).format(calendarCursor).replace(/^./,c=>c.toUpperCase());
    const first=new Date(year,month,1),start=new Date(year,month,1-first.getDay()),today=localDateValue();
    const dows=['D','L','M','M','J','V','S'];
    root.innerHTML=dows.map(x=>`<div class="cal-dow">${x}</div>`).join('')+Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);const iso=localDateValue(d),event=byDate.get(iso),muted=d.getMonth()!==month;return `<button type="button" class="cal-day${muted?' muted':''}${iso===today?' today':''}${event?' has-event':''}" data-date="${iso}" ${event?'':'tabindex="-1"'}><span class="cal-num">${d.getDate()}</span>${event?'<span class="cal-dot"></span>':''}</button>`;}).join('');
    root.querySelectorAll('.has-event').forEach(b=>b.onclick=()=>{const event=commercialEvents(dateFromISO(b.dataset.date).getFullYear()).find(x=>x.date===b.dataset.date);if(event)openEvent(event);});
    lines.innerHTML=events.length?events.sort((a,b)=>a.date.localeCompare(b.date)).map(e=>`<button class="event-line" type="button" data-event-date="${e.date}"><span class="event-date">${new Intl.DateTimeFormat('es-CL',{day:'2-digit',month:'short'}).format(dateFromISO(e.date))}</span><span class="event-title">${esc(e.title)}</span><span class="event-arrow">›</span></button>`).join(''):'<div class="event-empty">No hay fechas comerciales cargadas este mes.</div>';
    lines.querySelectorAll('[data-event-date]').forEach(b=>b.onclick=()=>{const event=events.find(x=>x.date===b.dataset.eventDate);if(event)openEvent(event);});
  }

  function renderIdeas(){
    const id=document.querySelector('#plannerBrand')?.value||'adria-sushi',items=getIdeas(id,3),root=document.querySelector('#plannerIdeas');if(!root)return;
    root.innerHTML=items.map(({data:d})=>`<details class="planner-row"><summary><span class="planner-kind">${esc(d[0])}</span><h3>${esc(d[1])}</h3><span class="planner-chevron">⌄</span></summary><div class="planner-detail"><p>${esc(d[2])}</p><p><strong>Foto:</strong> ${esc(d[3])}</p><div class="planner-actions"><button type="button" class="btn primary use-idea" data-title="${esc(d[1])}" data-context="${esc(`${d[2]} Foto sugerida: ${d[3]} Objetivo: ${d[4]}`)}">Usar en Publicador</button></div></div></details>`).join('');
    root.querySelectorAll('.use-idea').forEach(b=>b.onclick=()=>transferToPublisher({title:b.dataset.title,context:b.dataset.context,date:document.querySelector('#plannerDate')?.value}));
  }

  function boot(){
    const tabs=document.querySelector('.app-tabs'),shell=document.querySelector('main.main-view'),settings=document.querySelector('#settingsView');if(!tabs||!shell||!settings)return setTimeout(boot,150);if(document.querySelector('#tabPlanner'))return;
    const btn=document.createElement('button');btn.id='tabPlanner';btn.className='app-tab';btn.type='button';btn.textContent='Planificador';tabs.insertBefore(btn,document.querySelector('#tabSettings'));
    const view=document.createElement('main');view.id='plannerView';view.className='shell planner-view';view.innerHTML=`
      <section class="panel planner-compact"><div class="panel-heading"><div><span class="eyebrow">PLANIFICADOR</span><h2>Ideas para publicar</h2></div></div><div class="planner-toolbar"><label class="planner-brand">Marca<select id="plannerBrand">${Object.entries(brands).map(([id,b])=>`<option value="${id}">${b.name}</option>`).join('')}</select></label><label>Fecha<input id="plannerDate" type="date" value="${localDateValue()}"></label><label>Hora<select id="plannerTime"></select><span id="plannerTimeNote" class="planner-time-note">Cargando…</span></label><button id="plannerRefresh" class="btn secondary" type="button">Otras 3 ideas</button></div><div id="plannerIdeas" class="planner-list"></div></section>
      <section class="panel"><div class="commercial-head"><div><span class="eyebrow">CALENDARIO COMERCIAL</span><h2>Fechas que vale la pena mirar</h2></div><div class="month-nav"><button id="monthPrev" class="btn ghost" type="button">‹</button><span id="monthLabel" class="month-label"></span><button id="monthNext" class="btn ghost" type="button">›</button></div></div><div id="calendarGrid" class="calendar-grid" style="margin-top:12px"></div><div id="eventLines" class="event-lines"></div></section>`;
    settings.insertAdjacentElement('beforebegin',view);
    function showPlanner(){shell.classList.add('settings-hidden');settings.classList.remove('active');document.querySelector('#studioView')?.classList.remove('active');document.querySelector('#ugcView')?.classList.remove('active');view.classList.add('active');document.querySelectorAll('.app-tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');renderIdeas();renderTimeChoices();renderCalendar();}
    btn.addEventListener('click',showPlanner);tabs.addEventListener('click',e=>{if(e.target!==btn)view.classList.remove('active');});
    document.querySelector('#plannerBrand').addEventListener('change',()=>{renderIdeas();renderTimeChoices();if(dialog.open&&activeEvent)openEvent(activeEvent);});
    document.querySelector('#plannerDate').addEventListener('change',renderTimeChoices);
    document.querySelector('#plannerRefresh').addEventListener('click',()=>{const id=document.querySelector('#plannerBrand').value;ensure(id).cursor=(ensure(id).cursor+3)%brands[id].ideas.length;save();renderIdeas();});
    document.querySelector('#monthPrev').addEventListener('click',()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderCalendar();});
    document.querySelector('#monthNext').addEventListener('click',()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderCalendar();});
    renderIdeas();renderTimeChoices();renderCalendar();loadRecommendations();
  }

  document.querySelector('#eventClose').onclick=document.querySelector('#eventCancel').onclick=()=>dialog.close();
  document.querySelector('#eventPublisher').onclick=()=>{if(!activeEvent)return;const brandId=document.querySelector('#plannerBrand')?.value||'adria-sushi';transferToPublisher({title:activeEvent.title,context:`${activeEvent.why} Idea: ${activeEvent.idea(brandId)}`,date:activeEvent.date});dialog.close();};
  document.querySelector('#eventStudio').onclick=()=>{if(!activeEvent)return;const brandId=document.querySelector('#plannerBrand')?.value||'adria-sushi';openStudioFor({title:activeEvent.title,context:`${activeEvent.why} Idea para ${brands[brandId]?.name}: ${activeEvent.idea(brandId)}`});dialog.close();};
  boot();
})();