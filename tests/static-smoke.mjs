import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(join(root,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(match=>match[1].split('?')[0]);
const failures=[];
const check=(condition,message)=>{if(!condition)failures.push(message);};

check(new Set(scripts).size===scripts.length,'Hay scripts duplicados en index.html.');
for(const script of scripts)check(existsSync(join(root,script)),`Falta el script cargado: ${script}`);

const jsFiles=readdirSync(root).filter(name=>name.endsWith('.js'));
for(const file of jsFiles){
  const result=spawnSync(process.execPath,['--check',join(root,file)],{encoding:'utf8'});
  check(result.status===0,`${file} no tiene sintaxis válida: ${result.stderr.trim()}`);
}

const planner=readFileSync(join(root,'planner.js'),'utf8');
const publisher=readFileSync(join(root,'publish-flow-v3.js'),'utf8');
const studio=readFileSync(join(root,'ai-studio.js'),'utf8');
check(planner.includes('Calendario comercial'),'El Planificador no está identificado como calendario comercial.');
check(planner.includes('laberinto:calendar-draft'),'El calendario no prepara borradores en el Publicador.');
check(!planner.includes('posting-time-api'),'El calendario todavía depende de recomendaciones horarias.');
check(!html.includes('instagram-setup.js'),'index.html todavía carga la integración antigua de Instagram.');
check(!html.includes('newPostBtn')&&!html.includes('postDialog'),'Sigue cargado el publicador manual antiguo.');
check(publisher.includes('laberinto:studio-draft'),'El Publicador no recibe el borrador de Studio IA.');
check(studio.includes('caption,context,studio_analysis'),'Studio IA no entrega texto y contexto al Publicador.');

if(failures.length){console.error(failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(`OK: ${jsFiles.length} scripts válidos y flujo comercial/Studio conectado.`);
