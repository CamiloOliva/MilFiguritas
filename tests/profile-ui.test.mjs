import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

// DOM harness: verifies client behavior without controlling a user browser.
async function ui(saved,storageBlocked=false) {
  const events={},savedValues=new Map(saved?[['milfiguras-theme',saved]]:[]),buttons=['light','dark'].map(theme=>({dataset:{themeChoice:theme},setAttribute(key,value){this[key]=value;}}));
  const menu={hidden:true,querySelector:()=>({focus(){}})},trigger={setAttribute(key,value){this[key]=value;},focus(){this.focused=true;}};
  const document={documentElement:{dataset:{}},querySelectorAll:()=>buttons,querySelector:()=>({setAttribute(){}}),addEventListener(type,fn){(events[type]??=[]).push(fn);}};
  const context=vm.createContext({document,localStorage:{getItem(k){if(storageBlocked)throw Error('blocked');return savedValues.get(k);},setItem(k,v){if(storageBlocked)throw Error('blocked');savedValues.set(k,v);}},$:selector=>selector==='#profile-dropdown'?menu:trigger,esc:v=>String(v).replaceAll('<','&lt;'),icon:()=>'',roleName:()=> 'Administración',state:{user:{name:'Mi Nombre',email:'mi@ejemplo.com'}},modal:(title,html)=>{context.lastModal={title,html};}});
  vm.runInContext(await readFile(new URL('../public/profile.js',import.meta.url),'utf8'),context);
  return {context,document,savedValues,buttons,events,menu,trigger};
}
test('restaura modo oscuro y permite cambiar a claro guardando preferencia',async()=>{
  const u=await ui('dark');assert.equal(u.document.documentElement.dataset.theme,'dark');
  vm.runInContext("setTheme('light')",u.context);assert.equal(u.document.documentElement.dataset.theme,'light');assert.equal(u.savedValues.get('milfiguras-theme'),'light');assert.equal(u.buttons[0]['aria-pressed'],'true');assert.equal(u.buttons[1]['aria-pressed'],'false');
});
test('la apariencia funciona aunque el almacenamiento del navegador esté bloqueado',async()=>{
  const u=await ui(null,true);vm.runInContext("setTheme('dark')",u.context);assert.equal(u.document.documentElement.dataset.theme,'dark');
});
test('abre y cierra el menú con el icono y con Escape',async()=>{
  const u=await ui();const target={dataset:{action:'profile-menu'},setAttribute(k,v){this[k]=v;}};
  u.events.click[0]({target:{closest:()=>target}});assert.equal(u.menu.hidden,false);assert.equal(target['aria-expanded'],'true');
  u.events.keydown[0]({key:'Escape',preventDefault(){}});assert.equal(u.menu.hidden,true);assert.equal(u.trigger.focused,true);
});
test('el menú contiene edición, ambos temas y cierre de sesión',async()=>{
  const u=await ui();const markup=vm.runInContext('profileControl(state.user)',u.context);
  for(const text of ['Modificar perfil','Claro','Oscuro','Cerrar sesión','aria-expanded="false"'])assert.ok(markup.includes(text));
});
test('el editor admite imagen local y ofrece guardar o cancelar',async()=>{
  const u=await ui();vm.runInContext('profileModal()',u.context);
  for(const text of ['type="file"','image/jpeg,image/png,image/webp','Guardar cambios','Cancelar','profile-name','profile-email'])assert.ok(u.context.lastModal.html.includes(text));
});
test('rechaza archivos que no son imágenes o superan los 5 MB antes de decodificarlos',async()=>{
  const u=await ui();await assert.rejects(vm.runInContext("prepareProfilePhoto({type:'text/plain',size:10})",u.context),/JPG/);await assert.rejects(vm.runInContext("prepareProfilePhoto({type:'image/jpeg',size:6*1024*1024})",u.context),/5 MB/);
});
