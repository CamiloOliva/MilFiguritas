import test from 'node:test';
import assert from 'node:assert/strict';
import {handleApi,initialState} from '../src/app.mjs';
import {validateAvatar} from '../src/profile.mjs';

const photo='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAACAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDEooorI+pP/9k=';

async function fixture(role='explorer') {
  let state=await initialState({adminPassword:'PrivateAdmin2026!'});
  const store={read:async()=>structuredClone(state),mutate:async fn=>{const draft=structuredClone(state);const result=await fn(draft);state=draft;return result;}};
  const email={admin:'admin',explorer:'explorador',ambassador:'embajador'}[role]+'@milfiguras.demo';
  async function request(path,body,cookie='',headers={}) {
    const r=await handleApi(new Request('http://localhost/api/'+path,{method:body?'POST':'GET',headers:{cookie,...(body?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})}),store);
    return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
  }
  const login=await request('login',{email,password:role==='admin'?'PrivateAdmin2026!':'Milfiguras2026!'});
  assert.equal(login.status,200);
  return {request:(path,body,headers)=>request(path,body,login.cookie,headers),anonymous:(path,body)=>request(path,body),read:()=>state,email};
}

for(const role of ['explorer','ambassador','admin'])test(`${role}: puede guardar su nombre, correo y foto sin modificar privilegios`,async()=>{
  const f=await fixture(role),before=f.read().users.find(u=>u.role===role);
  const r=await f.request('profile',{name:'Nuevo Nombre',email:'nuevo@ejemplo.com',avatar:photo,role:'admin',xp:999999,balance:999999,userId:'demo-admin'});
  assert.equal(r.status,200);assert.equal(r.body.user.name,'Nuevo Nombre');assert.equal(r.body.user.avatar,photo);
  assert.equal(r.body.user.role,role);assert.equal(r.body.user.xp,before.xp);assert.equal(r.body.user.balance,before.balance);
  assert.equal(r.body.user.password,undefined);assert.equal(r.body.user.salt,undefined);
  const me=await f.request('me');assert.equal(me.body.user.email,'nuevo@ejemplo.com');
  const login=await f.anonymous('login',{email:'nuevo@ejemplo.com',password:role==='admin'?'PrivateAdmin2026!':'Milfiguras2026!'});assert.equal(login.status,200);
  assert.equal(f.read().users.filter(u=>u.id!==before.id&&u.email==='nuevo@ejemplo.com').length,0);
});
test('requiere una sesión válida para actualizar el perfil',async()=>{
  const f=await fixture();assert.equal((await f.anonymous('profile',{name:'Intruso',email:'intruso@ejemplo.com'})).status,401);
});
test('rechaza correo duplicado y conserva el perfil anterior',async()=>{
  const f=await fixture();const r=await f.request('profile',{name:'No guardar',email:'ADMIN@MILFIGURAS.DEMO',avatar:null});
  assert.equal(r.status,409);assert.equal((await f.request('me')).body.user.name,'Valentina García');
});
test('valida nombre y formato de correo',async()=>{
  const f=await fixture();
  for(const data of [{name:'x',email:f.email},{name:'Nombre',email:'no-es-correo'},{name:'x'.repeat(81),email:f.email}])assert.equal((await f.request('profile',data)).status,400);
});
test('permite quitar la foto y conserva la foto cuando no se envía',async()=>{
  const f=await fixture();const data={name:'Mi Nombre',email:f.email};
  assert.equal((await f.request('profile',{...data,avatar:photo})).status,200);
  assert.equal((await f.request('profile',data)).body.user.avatar,photo);
  assert.equal((await f.request('profile',{...data,avatar:null})).body.user.avatar,null);
});
test('rechaza SVG, enlaces remotos, archivos falsos y fotos excesivas',()=>{
  for(const value of ['data:image/svg+xml;base64,PHN2Zz4=', 'https://example.com/a.jpg','data:image/jpeg;base64,aG9sYQ==','data:image/jpeg;base64,'+'A'.repeat(175000),{},'data:image/jpeg;base64,not-valid'])assert.throws(()=>validateAvatar(value));
  assert.equal(validateAvatar(photo),photo);assert.equal(validateAvatar(null),null);
});
test('rechaza fotos con dimensiones superiores a 512 píxeles',()=>{
  const bytes=Buffer.from(photo.split(',')[1],'base64');const sof=bytes.indexOf(Buffer.from([255,192]));assert.ok(sof>0);
  bytes[sof+5]=3;bytes[sof+6]=0;
  assert.throws(()=>validateAvatar('data:image/jpeg;base64,'+bytes.toString('base64')),/512/);
});
test('rechaza solicitudes desde otro origen',async()=>{
  const f=await fixture();const r=await f.request('profile',{name:'Mi Nombre',email:f.email},{origin:'https://otro.example'});assert.equal(r.status,403);
});
test('una foto inválida no guarda parcialmente el nuevo nombre',async()=>{
  const f=await fixture();const r=await f.request('profile',{name:'No guardar',email:f.email,avatar:'data:image/jpeg;base64,aG9sYQ=='});assert.equal(r.status,400);assert.equal((await f.request('me')).body.user.name,'Valentina García');
});
test('cerrar sesión invalida el acceso al perfil y elimina la cookie',async()=>{
  const f=await fixture();const logout=await f.request('logout',{});assert.equal(logout.status,200);assert.equal(logout.cookie,'mfg_session=');assert.equal((await f.request('me')).status,401);assert.equal((await f.request('profile',{name:'Mi Nombre',email:f.email})).status,401);
});
