import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readConfig,bootstrapCredentials} from '../src/config.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
test('configuración local mantiene localhost y separa la carpeta de datos',()=>{
 const c=readConfig({},root);assert.equal(c.host,'127.0.0.1');assert.equal(c.port,3000);assert.equal(c.production,false);assert.equal(c.includeDemo,true);
 assert.equal(readConfig({DATA_DIR:'privado'},root).dataDir,path.join(root,'privado'));
});
test('producción exige HTTPS y credenciales administrativas explícitas',()=>{
 assert.throws(()=>readConfig({NODE_ENV:'production'},root),/PUBLIC_ORIGIN/);
 assert.throws(()=>readConfig({NODE_ENV:'production',PUBLIC_ORIGIN:'http://publico.example'},root),/HTTPS/);
 const c=readConfig({NODE_ENV:'production',PUBLIC_ORIGIN:'https://milfiguras.example'},root);assert.equal(c.host,'0.0.0.0');assert.equal(c.includeDemo,false);assert.throws(()=>bootstrapCredentials(c),/ADMIN_EMAIL/);
 c.adminEmail='admin@example.test';assert.throws(()=>bootstrapCredentials(c),/contraseña/);c.adminPassword='UnaClavePrivada2026!';assert.equal(bootstrapCredentials(c).email,c.adminEmail);
});
test('detecta el origen HTTPS de Render sin confiar en cabeceras enviadas por visitantes',()=>{
 const c=readConfig({NODE_ENV:'production',RENDER_EXTERNAL_URL:'https://milfiguras.onrender.com'},root);assert.equal(c.origin,'https://milfiguras.onrender.com');
 assert.equal(readConfig({NODE_ENV:'production',RENDER_EXTERNAL_URL:'https://milfiguras.onrender.com',PUBLIC_ORIGIN:'https://mi.dominio.example'},root).origin,'https://mi.dominio.example');
 for(const origin of ['https://user:pass@example.test','https://example.test/ruta','https://example.test?dato=x','file:///tmp/prueba'])assert.throws(()=>readConfig({PUBLIC_ORIGIN:origin},root));
 assert.throws(()=>readConfig({PORT:'no-es-puerto'},root));
});

async function launch(env){
 const child=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,...env},stdio:['ignore','pipe','pipe'],windowsHide:true});
 let logs='';child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);
 let exited=false;child.once('exit',()=>{exited=true;});
 for(let i=0;i<200;i++){
  const ready=logs.match(/Milfiguras BGA · http:\/\/127\.0\.0\.1:(\d+)/);
  if(ready)return {child,base:'http://127.0.0.1:'+ready[1],logs:()=>logs};
  if(exited)throw new Error('El servidor no pudo iniciarse: '+logs);
  await new Promise(r=>setTimeout(r,10));
 }
 child.kill();throw new Error('El servidor no respondió a tiempo.');
}
async function stop(app){if(!app||app.child.exitCode!==null||app.child.signalCode!==null)return;const done=new Promise(resolve=>app.child.once('exit',resolve));app.child.kill();await done;}
async function cleanup(dir){const target=path.resolve(dir);if(path.dirname(target)!==path.resolve(os.tmpdir())||!path.basename(target).startsWith('milfiguras-'))throw new Error('Directorio temporal fuera del alcance de pruebas.');await rm(target,{recursive:true,force:true});}
async function request(base,route,body,cookie='',headers={}){
 return fetch(base+route,{method:body?'POST':'GET',headers:{cookie,...(body?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
}

test('el servidor publica rutas seguras, conserva datos al reiniciar y aplica HTTPS detrás de un proxy',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'milfiguras-deploy-'));
 const env={PORT:'0',HOST:'127.0.0.1',DATA_DIR:dir,NODE_ENV:'development',PUBLIC_ORIGIN:'',RENDER_EXTERNAL_URL:'',ADMIN_EMAIL:'admin@example.test',ADMIN_PASSWORD:'PrivateDeploy2026!',INCLUDE_DEMO_DATA:'false'};
 let app;
 try{
  app=await launch(env);
  assert.equal((await fetch(app.base+'/healthz')).status,200);
  for(const asset of ['/catalog.js','/showcase.js','/showcase.css','/responsive.css','/media/milfiguras-poster-v1.webp'])assert.equal((await fetch(app.base+asset)).status,200);
  const media=app.base+'/media/milfiguras-presentacion-v1.mp4';let clip=await fetch(media,{headers:{Range:'bytes=0-1023'}});assert.equal(clip.status,206);assert.equal((await clip.arrayBuffer()).byteLength,1024);assert.equal(clip.headers.get('Content-Type'),'video/mp4');assert.match(clip.headers.get('Content-Range'),/^bytes 0-1023\//);
  clip=await fetch(media,{method:'HEAD'});assert.equal(clip.status,200);const total=Number(clip.headers.get('Content-Length'));assert.ok(total>100000);assert.equal((await clip.arrayBuffer()).byteLength,0);
  clip=await fetch(media,{headers:{Range:'bytes=-256'}});assert.equal(clip.status,206);assert.equal((await clip.arrayBuffer()).byteLength,256);
  for(const range of ['bytes=999999999-','bytes=90-10','bytes=-0','bytes=0-1,4-5','invalid'])assert.equal((await fetch(media,{headers:{Range:range}})).status,416);

  let login=await request(app.base,'/api/login',{email:env.ADMIN_EMAIL,password:env.ADMIN_PASSWORD});assert.equal(login.status,200);let cookie=login.headers.get('set-cookie').split(';')[0];
  assert.equal((await request(app.base,'/api/profile',{name:'Administración persistente',email:env.ADMIN_EMAIL},cookie)).status,200);
  for(const route of ['/data/ACCESO-ADMIN.txt','/data/milfiguras.sqlite','/.env','/.openai/hosting.json'])assert.equal((await fetch(app.base+route)).status,404);
  assert.equal((await request(app.base,'/api/login',{email:env.ADMIN_EMAIL,password:env.ADMIN_PASSWORD},'',{origin:'https://otro.example'})).status,403);
  assert.equal((await request(app.base,'/',{})).status,405);
  await stop(app);app=await launch(env);
  login=await request(app.base,'/api/login',{email:env.ADMIN_EMAIL,password:env.ADMIN_PASSWORD});assert.equal(login.status,200);assert.equal((await login.json()).user.name,'Administración persistente');
  await stop(app);app=await launch({...env,NODE_ENV:'production',PUBLIC_ORIGIN:'https://milfiguras.example'});
  const secureLogin=await request(app.base,'/api/login',{email:env.ADMIN_EMAIL,password:env.ADMIN_PASSWORD},'',{origin:'https://milfiguras.example','x-forwarded-proto':'http'});
  assert.equal(secureLogin.status,200);assert.match(secureLogin.headers.get('set-cookie'),/; Secure/);
  assert.equal((await request(app.base,'/api/login',{email:env.ADMIN_EMAIL,password:env.ADMIN_PASSWORD},'',{origin:'https://ajeno.example','x-forwarded-host':'ajeno.example'})).status,403);
 }finally{await stop(app);await cleanup(dir);}
});

test('producción nueva no crea usuarios de demostración ni un archivo de contraseña pública',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'milfiguras-prod-'));
 let app;
 try{
  // Local HTTP is permitted only for localhost to make Docker and integration checks possible.
  app=await launch({PORT:'0',HOST:'127.0.0.1',DATA_DIR:dir,NODE_ENV:'production',PUBLIC_ORIGIN:'http://127.0.0.1:0',RENDER_EXTERNAL_URL:'',ADMIN_EMAIL:'admin@example.test',ADMIN_PASSWORD:'PrivateDeploy2026!'});
  const response=await request(app.base,'/api/login',{email:'admin@example.test',password:'PrivateDeploy2026!'});assert.equal(response.status,200);
  const cookie=response.headers.get('set-cookie').split(';')[0];const state=await (await request(app.base,'/api/state',null,cookie)).json();assert.equal(state.users.length,1);assert.equal(state.users[0].isDemo,false);
  assert.ok(!(await readdir(dir)).includes('ACCESO-ADMIN.txt'));
 }finally{await stop(app);await cleanup(dir);}
});
