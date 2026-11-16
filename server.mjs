import http from 'node:http';
import {serveStatic} from './src/static.mjs';
import path from 'node:path';
import {DatabaseSync,backup} from 'node:sqlite';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {handleApi,initialState,passwordHash} from './src/app.mjs';
import {readConfig,bootstrapCredentials} from './src/config.mjs';

const root=fileURLToPath(new URL('.',import.meta.url));
const config=readConfig(process.env,root);
await mkdir(config.dataDir,{recursive:true});
const db=new DatabaseSync(path.join(config.dataDir,'milfiguras.sqlite'));
db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS app_state(id TEXT PRIMARY KEY,version INTEGER NOT NULL DEFAULT 0,payload TEXT NOT NULL)');

const isNew=!db.prepare('SELECT id FROM app_state WHERE id=?').get('main');
let setupAccess;
if(isNew){
  setupAccess=bootstrapCredentials(config);
  const state=await initialState({adminPassword:setupAccess.password,adminEmail:setupAccess.email,includeDemo:config.includeDemo});
  db.prepare('INSERT INTO app_state(id,payload) VALUES(?,?)').run('main',JSON.stringify(state));
}
const initial=JSON.parse(db.prepare('SELECT payload FROM app_state WHERE id=?').get('main').payload);
let securityChanged=false,backedUp=false;
const credentials=[];
for(const user of initial.users.filter(u=>u.role==='admin')){
  const usesOldPassword=await passwordHash('Milfiguras2026!',user.salt)===user.password;
  if(isNew||usesOldPassword){
    if(!isNew&&!backedUp){await backup(db,path.join(config.dataDir,'before-security-upgrade.sqlite'));backedUp=true;}
    const access=setupAccess||bootstrapCredentials(config);
    const salt=crypto.randomUUID();user.password=await passwordHash(access.password,salt);user.salt=salt;
    initial.sessions=initial.sessions.filter(s=>s.userId!==user.id);
    credentials.push(`Correo: ${user.email}\nContraseña inicial: ${access.password}`);
    securityChanged=true;
  }
  if(user.isDemo){user.isDemo=false;securityChanged=true;}
}
if(securityChanged)db.prepare('UPDATE app_state SET payload=?,version=version+1 WHERE id=?').run(JSON.stringify(initial),'main');
if(credentials.length&&!config.production){
  await writeFile(path.join(config.dataDir,'ACCESO-ADMIN.txt'),'MILFIGURAS BGA · ACCESO PRIVADO DE ADMINISTRACIÓN\n\n'+credentials.join('\n\n')+'\n\nIngresa al sitio y cambia la contraseña desde el menú del perfil → Cambiar contraseña.\nEsta es una clave inicial: si ya la cambiaste, usa tu nueva contraseña.\nNo compartas este archivo. No está disponible desde el sitio web.\n',{mode:0o600});
  console.log('Credenciales iniciales guardadas en el directorio privado de datos: ACCESO-ADMIN.txt.');
}else if(credentials.length){
  console.log('Administración inicializada con las credenciales privadas del alojamiento.');
}

let queue=Promise.resolve();
const store={
  read:async()=>JSON.parse(db.prepare('SELECT payload FROM app_state WHERE id=?').get('main').payload),
  mutate(fn){
    const task=queue.then(async()=>{
      const state=await store.read();
      const result=await fn(state);
      db.prepare('UPDATE app_state SET payload=?,version=version+1 WHERE id=?').run(JSON.stringify(state),'main');
      return result;
    });
    queue=task.catch(()=>{});
    return task;
  }
};

const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.mp4':'video/mp4','.webp':'image/webp'};
const allowed={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/orders.js':'orders.js','/profile.js':'profile.js','/style.css':'style.css','/profile.css':'profile.css','/orders.css':'orders.css','/favicon.svg':'favicon.svg'};
for(const file of ['catalog.js','showcase.js','showcase.css','responsive.css','media/milfiguras-presentacion-v1.mp4','media/milfiguras-avance-v1.mp4','media/milfiguras-poster-v1.webp'])allowed['/'+file]=file;
const securityHeaders={
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'same-origin',
  'X-Frame-Options':'DENY',
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
};
const server=http.createServer(async(req,res)=>{
  for(const [key,value] of Object.entries(securityHeaders))res.setHeader(key,value);
  try{
    const origin=config.origin||`http://${req.headers.host}`;
    const incoming=new URL(req.url,'http://localhost');
    const url=new URL(incoming.pathname+incoming.search,origin);
    if(url.pathname==='/healthz'){
      try{db.prepare('SELECT version FROM app_state WHERE id=?').get('main');res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end('{"status":"ok"}');}
      catch{res.writeHead(503,{'Content-Type':'application/json'});res.end('{"status":"unavailable"}');}
      return;
    }
    if(url.pathname.startsWith('/api/')){
      let size=0;const chunks=[];
      for await(const chunk of req){
        size+=chunk.length;
        if(size>(url.pathname==='/api/profile'?200000:24000)){
          res.writeHead(413,{'Content-Type':'application/json; charset=utf-8'});
          res.end(JSON.stringify({error:'La solicitud es demasiado grande.'}));return;
        }
        chunks.push(chunk);
      }
      const request=new Request(url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})});
      const response=await handleApi(request,store);
      res.writeHead(response.status,Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));return;
    }
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
    const file=allowed[url.pathname];
    if(!file){res.writeHead(404);res.end('No encontrado');return;}
    await serveStatic(req,res,path.join(root,'public',file),types[path.extname(file)],file.startsWith('media/'));
  }catch(error){
    console.error('No se pudo procesar una solicitud:',error.name);
    if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json'});
    res.end('{"error":"Error del servidor."}');
  }
});
server.listen(config.port,config.host,()=>{
  console.log(`Milfiguras BGA · http://${config.host}:${server.address().port}`);
  if(config.origin)console.log('Origen público configurado: '+config.origin);
});
async function shutdown(){
  server.close(async()=>{await queue;db.close();});
  server.closeIdleConnections();
  setTimeout(()=>process.exit(1),10000).unref();
}
process.once('SIGTERM',shutdown);
process.once('SIGINT',shutdown);
