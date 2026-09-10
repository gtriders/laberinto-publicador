(() => {
  const PIN='laberinto_session_pin';
  const API='https://ufsxdlmnjuaymdszyjue.supabase.co/functions/v1/image-studio';
  const frames=[
    {id:'productexplosion',name:'Product Explosion',short:'Ingredientes alrededor',desc:'Mantiene el producto como protagonista y separa alrededor solo los ingredientes reales confirmados.',needs:'ingredients',icon:'✦'},
    {id:'magazine',name:'Magazine',short:'Editorial',desc:'Convierte la foto en una composición editorial limpia con espacio visual para un titular.',needs:'context',icon:'Aa'},
    {id:'hero',name:'Hero Product',short:'Producto protagonista',desc:'Limpia la escena y convierte el producto real en el único protagonista de la imagen.',needs:'context',icon:'●'},
    {id:'ingredients',name:'Ingredientes',short:'Producto + ingredientes',desc:'Acompaña el producto únicamente con ingredientes reales que tú confirmes.',needs:'ingredients',icon:'◌'},
    {id:'creative-context',name:'Contexto creativo',short:'Escena creativa',desc:'Mantiene el producto real y lo sitúa en una escena creativa coherente con la marca.',needs:'context',icon:'◇'},
    {id:'poster',name:'Poster',short:'Afiche',desc:'Crea una imagen publicitaria fuerte con el producto protagonista y espacio para texto posterior.',needs:'context',icon:'▣'}
  ];

  const css=document.createElement('style');
  css.textContent=`
    .studio-view{display:none}.studio-view.active{display:block}.studio-panel{max-width:1040px;margin-inline:auto}
    .studio-head{display:flex;justify-content:space-between;gap:16px;align-items:end;flex-wrap:wrap}.studio-head h2{margin-bottom:4px}.studio-brand{display:grid;gap:5px;min-width:220px;font-size:.78rem;font-weight:800;color:#756b5d}
    .studio-work{display:grid;grid-template-columns:minmax(260px,.8fr) minmax(340px,1.2fr);gap:18px;margin-top:16px}.studio-step{display:grid;gap:10px}.studio-step-title{display:flex;align-items:center;gap:8px;font-weight:850}.studio-step-num{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#111827;color:#fff;font-size:.75rem}
    .studio-drop{border:1.5px dashed #d8cfc0;border-radius:15px;min-height:260px;display:grid;place-items:center;padding:16px;text-align:center;cursor:pointer;background:#faf9f6}.studio-drop strong{display:block;font-size:1rem}.studio-drop p{margin:5px 0 0;color:#756b5d;font-size:.86rem}.studio-preview{max-width:100%;max-height:390px;border-radius:12px;display:block;margin:auto}
    .frame-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.frame-card{display:grid;gap:3px;min-height:72px;border:1px solid #e5ddd2;background:#fff;border-radius:12px;padding:10px;text-align:left;cursor:pointer}.frame-card:hover{background:#faf8f4}.frame-card.active{border-color:#111827;box-shadow:inset 0 0 0 1px #111827;background:#fafafa}.frame-card .frame-top{display:flex;justify-content:space-between;align-items:center;gap:8px}.frame-card .frame-icon{font-size:.9rem;font-weight:900;color:#776a58}.frame-card strong{font-size:.84rem;line-height:1.2}.frame-card small{font-size:.72rem;color:#81786c;line-height:1.25}.studio-frame-help{margin:0;padding:10px 12px;background:#f7f2ea;border-radius:10px;color:#62594d;font-size:.84rem;line-height:1.4}
    .studio-more{border-top:1px solid #eee7dd;padding-top:9px}.studio-more summary{cursor:pointer;font-weight:750;font-size:.86rem;color:#5f574d}.studio-more textarea{width:100%;margin-top:8px;min-height:70px}.ai-question{background:#f7f2ea;border-radius:12px;padding:12px;margin-top:2px}.ai-question p{margin:5px 0}.ai-question textarea{width:100%;margin-top:7px;min-height:72px}.studio-inspection{font-size:.8rem;color:#74695d;margin-top:4px}.studio-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.studio-actions .btn{min-width:140px}.studio-status{font-size:.86rem;color:#62594d;min-height:1.3em}.studio-loading{opacity:.65;pointer-events:none}
    .studio-result{margin-top:18px;display:none;border-top:1px solid #eee7dd;padding-top:16px}.studio-result.active{display:block}.studio-result-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}.studio-result-head h3{margin:0}.studio-compare{display:grid;grid-template-columns:1fr 1fr;gap:10px}.studio-compare figure{margin:0;border:1px solid #e7dfd2;border-radius:13px;padding:8px;background:#fff}.studio-compare figcaption{font-size:.72rem;font-weight:850;margin-bottom:6px;color:#756b5d}.studio-compare img{width:100%;border-radius:9px;display:block}
    @media(max-width:760px){.studio-work,.studio-compare{grid-template-columns:1fr}.frame-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.studio-drop{min-height:210px}.studio-head{align-items:stretch}.studio-brand{width:100%}.studio-actions .btn{flex:1 1 140px}}
  `;
  document.head.appendChild(css);

  const postForm=async(action,file,extra={})=>{
    const fd=new FormData();
    fd.append('action',action);
    fd.append('pin',sessionStorage.getItem(PIN)||'');
    fd.append('file',file,file.name||'input.jpg');
    Object.entries(extra).forEach(([k,v])=>fd.append(k,String(v??'')));
    const r=await fetch(API,{method:'POST',body:fd});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){const e=new Error(d.error||'Error de conexión');e.detail=d.detail||'';throw e;}
    return d;
  };

  function boot(){
    const tabs=document.querySelector('.app-tabs');
    const settings=document.querySelector('#settingsView');
    const publicador=document.querySelector('main.main-view');
    if(!tabs||!settings||!publicador)return setTimeout(boot,150);
    if(document.querySelector('#tabStudio'))return;

    const planner=document.querySelector('#tabPlanner');
    const btn=document.createElement('button');
    btn.id='tabStudio';btn.className='app-tab';btn.type='button';btn.textContent='Estudio IA';
    planner?.insertAdjacentElement('afterend',btn)||tabs.insertBefore(btn,document.querySelector('#tabSettings'));

    const view=document.createElement('main');
    view.id='studioView';view.className='shell studio-view';
    view.innerHTML=`<section class="panel studio-panel">
      <div class="studio-head">
        <div><span class="eyebrow">ESTUDIO IA</span><h2>Mejora una foto</h2><p class="helper" style="margin:0">Usa una foto real como base. La IA pregunta solo si necesita confirmar algo.</p></div>
        <label class="studio-brand">MARCA<select id="studioBrand"><option value="adria-sushi">Adrià Sushi</option><option value="adria-sangucheria">Sanguchería Adrià</option><option value="pet">Adrià PET</option><option value="chef-rafael">Chef Rafael</option><option value="laberinto-digital">Laberinto Digital</option></select></label>
      </div>
      <div class="studio-work">
        <div class="studio-step"><div class="studio-step-title"><span class="studio-step-num">1</span>Sube la foto</div><div id="studioDrop" class="studio-drop"><div id="studioSourceWrap"><strong>Elegir imagen</strong><p>Producto o fotografía real.</p></div><input id="studioFile" type="file" accept="image/jpeg,image/png,image/webp" hidden></div></div>
        <div class="studio-step"><div class="studio-step-title"><span class="studio-step-num">2</span>Elige un estilo</div><div id="frameGrid" class="frame-grid">${frames.map((f,i)=>`<button type="button" class="frame-card ${i===0?'active':''}" data-frame="${f.id}"><span class="frame-top"><strong>${f.name}</strong><span class="frame-icon">${f.icon}</span></span><small>${f.short}</small></button>`).join('')}</div><p id="studioFrameHelp" class="studio-frame-help">${frames[0].desc}</p><details class="studio-more"><summary>Agregar indicación opcional</summary><textarea id="studioIdea" rows="2" placeholder="Ej: fondo oscuro, escena de barrio, mantener la presentación idéntica…"></textarea></details><div id="studioQuestion" class="ai-question" hidden><strong id="studioQuestionTitle">Necesito confirmar algo</strong><p id="studioQuestionText"></p><div id="studioInspection" class="studio-inspection"></div><textarea id="studioAnswer" rows="3" placeholder="Escribe aquí la información confirmada…"></textarea></div><div class="studio-actions"><button id="studioAnalyze" class="btn secondary" type="button">Revisar foto</button><button id="studioGenerate" class="btn primary" type="button" disabled>Crear imagen</button></div><div id="studioStatus" class="studio-status">Primero sube una imagen.</div></div>
      </div>
      <div id="studioResult" class="studio-result"><div class="studio-result-head"><div><span class="eyebrow">RESULTADO</span><h3>Imagen lista</h3></div></div><div class="studio-compare"><figure><figcaption>ORIGINAL</figcaption><img id="studioOriginalPreview" alt="Imagen original"></figure><figure><figcaption>RESULTADO IA</figcaption><img id="studioGeneratedPreview" alt="Imagen generada"></figure></div><div class="studio-actions" style="margin-top:10px"><button id="studioRegenerate" class="btn secondary" type="button">Crear otra versión</button><button id="studioUse" class="btn primary" type="button">Enviar al Publicador</button></div></div>
    </section>`;
    settings.insertAdjacentElement('beforebegin',view);

    let selected=frames[0],file=null,inspection=null,result=null,sourceUrl='';
    const $=s=>view.querySelector(s);
    const status=t=>$('#studioStatus').textContent=t;
    const resetResult=()=>{result=null;$('#studioResult').classList.remove('active');$('#studioGenerate').disabled=true;};
    const resetInspection=()=>{inspection=null;$('#studioQuestion').hidden=true;$('#studioAnswer').value='';resetResult();};
    const hide=()=>view.classList.remove('active');

    document.querySelector('#tabPublicador')?.addEventListener('click',hide);
    document.querySelector('#tabPlanner')?.addEventListener('click',hide);
    document.querySelector('#tabSettings')?.addEventListener('click',hide);

    btn.onclick=()=>{
      publicador.classList.add('settings-hidden');
      settings.classList.remove('active');
      document.querySelector('#plannerView')?.classList.remove('active');
      document.querySelector('#ugcView')?.classList.remove('active');
      view.classList.add('active');
      document.querySelectorAll('.app-tab').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
    };

    $('#frameGrid').querySelectorAll('.frame-card').forEach(card=>card.onclick=()=>{
      view.querySelectorAll('.frame-card').forEach(x=>x.classList.remove('active'));
      card.classList.add('active');
      selected=frames.find(f=>f.id===card.dataset.frame)||frames[0];
      $('#studioFrameHelp').textContent=selected.desc;
      resetInspection();
      if(file)status(`${selected.name} seleccionado. Revisa la foto antes de crear.`);
    });

    const input=$('#studioFile');
    const drop=$('#studioDrop');
    drop.onclick=e=>{if(e.target===input)return;input.click();};
    input.onchange=()=>{
      file=input.files?.[0]||null;
      if(!file)return;
      if(sourceUrl)URL.revokeObjectURL(sourceUrl);
      sourceUrl=URL.createObjectURL(file);
      $('#studioSourceWrap').innerHTML=`<img class="studio-preview" src="${sourceUrl}" alt="Vista previa original"><p class="helper">Toca la foto para cambiarla</p>`;
      $('#studioOriginalPreview').src=sourceUrl;
      resetInspection();
      status('Foto lista. Ahora elige el estilo y pulsa “Revisar foto”.');
    };

    async function inspect(){
      if(!file){status('Sube primero una imagen.');return;}
      const b=$('#studioAnalyze');
      b.disabled=true;view.classList.add('studio-loading');status('Revisando la foto…');
      try{
        const d=await postForm('inspect',file,{brand_id:$('#studioBrand').value,frame:selected.id,idea:$('#studioIdea').value});
        inspection=d.inspection||{};
        const visible=Array.isArray(inspection.visible_elements)?inspection.visible_elements.join(', '):'';
        $('#studioInspection').textContent=[inspection.product_guess?`Veo: ${inspection.product_guess}.`:'',visible?`Visible: ${visible}.`:'',inspection.notes||''].filter(Boolean).join(' ');
        if(inspection.ready){
          $('#studioQuestion').hidden=true;
          $('#studioGenerate').disabled=false;
          status('Todo listo. Puedes crear la imagen.');
        }else{
          $('#studioQuestion').hidden=false;
          $('#studioQuestionTitle').textContent='Confirma esto antes de crear';
          $('#studioQuestionText').textContent=inspection.question||'Confirma la información que no puede deducirse con seguridad.';
          $('#studioAnswer').placeholder=inspection.suggested_answer_hint||'Escribe aquí la información confirmada…';
          $('#studioGenerate').disabled=true;
          status('Responde la pregunta y podrás crear la imagen.');
        }
      }catch(e){status(e.message+(e.detail?` — ${e.detail}`:''));}
      finally{b.disabled=false;view.classList.remove('studio-loading');}
    }

    $('#studioAnswer').addEventListener('input',()=>{
      if(inspection&&!inspection.ready)$('#studioGenerate').disabled=!$('#studioAnswer').value.trim();
    });

    async function generate(){
      if(!file)return;
      const ans=$('#studioAnswer').value.trim();
      if(inspection&&!inspection.ready&&!ans){status('Responde primero la pregunta.');return;}
      if(selected.needs==='ingredients'&&!ans){status('Confirma los ingredientes antes de crear.');return;}
      const b=$('#studioGenerate');
      b.disabled=true;view.classList.add('studio-loading');status('Creando imagen…');
      try{
        const d=await postForm('generate',file,{brand_id:$('#studioBrand').value,frame:selected.id,answer:ans,idea:$('#studioIdea').value,inspection:inspection?JSON.stringify(inspection):''});
        result=d;
        $('#studioGeneratedPreview').src=d.media_url;
        $('#studioResult').classList.add('active');
        status('Imagen lista. Revísala o envíala al Publicador.');
        $('#studioResult').scrollIntoView({behavior:'smooth',block:'center'});
      }catch(e){status(e.message+(e.detail?` — ${e.detail}`:''));}
      finally{b.disabled=false;view.classList.remove('studio-loading');}
    }

    $('#studioAnalyze').onclick=inspect;
    $('#studioGenerate').onclick=generate;
    $('#studioRegenerate').onclick=generate;
    $('#studioUse').onclick=()=>{
      if(!result)return;
      const resultAnalysis=result.analysis||{};
      const hashtags=Array.isArray(result.hashtags)?result.hashtags:(Array.isArray(resultAnalysis.hashtags)?resultAnalysis.hashtags:[]);
      const baseCaption=result.caption||result.copy||result.post_caption||resultAnalysis.caption||'';
      const caption=baseCaption+(baseCaption&&hashtags.length?'\n\n'+hashtags.join(' '):'');
      const idea=$('#studioIdea').value.trim();
      const answer=$('#studioAnswer').value.trim();
      const visible=Array.isArray(inspection?.visible_elements)?inspection.visible_elements.join(', '):'';
      const context=[`Creada en Estudio IA /${selected.id}`,idea,answer?`Información confirmada por Rafael: ${answer}`:'',inspection?.product_guess?`Producto identificado: ${inspection.product_guess}`:'',visible?`Elementos visibles: ${visible}`:'',inspection?.notes||''].filter(Boolean).join('. ');
      window.dispatchEvent(new CustomEvent('laberinto:studio-media',{detail:{media_url:result.media_url,media_path:result.media_path,brand_id:$('#studioBrand').value,frame:selected.id,title:result.title||resultAnalysis.title||'',caption,context,studio_analysis:{...(inspection||{}),frame:selected.id,idea,answer}}}));
      document.querySelector('#tabPublicador')?.click();
      status('Imagen enviada al Publicador.');
    };

    $('#studioBrand').addEventListener('change',()=>{
      resetInspection();
      if(file)status('Marca cambiada. Revisa la foto nuevamente.');
    });
  }
  boot();
})();
