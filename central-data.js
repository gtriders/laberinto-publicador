(() => {
  function moveCentralData(){
    const settings=document.querySelector('#settingsView');
    const stats=document.querySelector('main.main-view .stats') || document.querySelector('#settingsCentralData .stats');
    const connections=document.querySelector('.integration-panel');
    if(!settings)return false;

    let section=document.querySelector('#settingsCentralData');
    if(!section){
      section=document.createElement('section');
      section.id='settingsCentralData';
      section.className='settings-card settings-full';
      section.innerHTML=`<div><span class="eyebrow">DATOS CENTRALES</span><h3 style="margin:4px 0 0">Sistema y conexiones</h3><p class="helper" style="margin:6px 0 0">Estado general, marcas conectadas y servicios externos.</p></div>`;
      const admin=settings.querySelector('.settings-tools');
      if(admin) admin.insertAdjacentElement('beforebegin',section);
      else settings.querySelector('.settings-grid')?.appendChild(section);
    }

    if(stats && stats.parentElement!==section){
      stats.style.margin='0 0 12px';
      stats.classList.add('settings-central-stats');
      section.appendChild(stats);
    }

    if(connections && connections.parentElement!==section){
      connections.style.margin='0';
      connections.style.boxShadow='none';
      connections.classList.add('settings-central-connections');
      section.appendChild(connections);
    }

    return !!section;
  }

  if(!moveCentralData()){
    const timer=setInterval(()=>{if(moveCentralData())clearInterval(timer);},120);
    setTimeout(()=>clearInterval(timer),6000);
  } else {
    const timer=setInterval(moveCentralData,250);
    setTimeout(()=>clearInterval(timer),6000);
  }
})();