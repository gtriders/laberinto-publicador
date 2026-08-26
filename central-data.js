(() => {
  function moveCentralData(){
    const settings=document.querySelector('#settingsView');
    const stats=document.querySelector('main.main-view .stats');
    if(!settings||!stats)return false;
    if(document.querySelector('#settingsCentralData'))return true;
    const section=document.createElement('section');
    section.id='settingsCentralData';
    section.className='settings-card settings-full';
    section.innerHTML=`<div><span class="eyebrow">DATOS CENTRALES</span><h3 style="margin:4px 0 0">Resumen del sistema</h3><p class="helper" style="margin:6px 0 0">Datos generales del Publicador, fuera del flujo diario.</p></div>`;
    const admin=settings.querySelector('.settings-tools');
    if(admin) admin.insertAdjacentElement('beforebegin',section);
    else settings.querySelector('.settings-grid')?.appendChild(section);
    stats.style.margin='0';
    stats.classList.add('settings-central-stats');
    section.appendChild(stats);
    return true;
  }
  if(!moveCentralData()){
    const timer=setInterval(()=>{if(moveCentralData())clearInterval(timer);},120);
    setTimeout(()=>clearInterval(timer),6000);
  }
})();