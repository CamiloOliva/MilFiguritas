import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,sampleOrder,ADMIN_PASSWORD} from './helpers.mjs';
import {initialState,passwordHash,handleApi} from '../src/app.mjs';

test('una instalación nueva no acepta la contraseña administrativa de demostración',async()=>{
 const state=await initialState();const admin=state.users.find(u=>u.role==='admin');assert.notEqual(admin.password,await passwordHash('Milfiguras2026!',admin.salt));assert.equal(admin.isDemo,false);
});
test('registro público ignora privilegios y puntos enviados por el cliente',async()=>{
 const f=await setup();const r=await f.request('register',{name:'Nuevo cliente',email:'nuevo@example.test',password:'ClienteSeguro2026!',consent:true,role:'admin',xp:10000});
 assert.equal(r.status,200);assert.equal(r.body.user.role,'explorer');assert.equal(r.body.user.xp,0);assert.equal((await f.request('admin/codes',{userId:r.body.user.id,reference:'COMPRA-1'},r.cookie)).status,403);
});
test('crear pedido guarda teléfono, dirección y referencia sin sumar puntos',async()=>{
 const f=await setup(),cookie=await f.login();const before=f.read().users[0].xp;
 const r=await f.request('reservations',sampleOrder({contactPhone:'+57 300 123 4567'}),cookie);assert.equal(r.status,200);assert.match(r.body.reservation.reference,/^MFG-/);assert.equal(r.body.reservation.contactPhone,'3001234567');assert.equal(r.body.reservation.status,'pending');assert.equal(f.read().users[0].xp,before);
});
test('validación rechaza fecha cercana, celular inválido y domicilio sin dirección',async()=>{
 const f=await setup(),cookie=await f.login();for(const extra of [{delivery:new Date(Date.now()+47*3600000).toISOString()},{contactPhone:'1234567890'},{address:''},{deliveryMethod:'inventado'}])assert.equal((await f.request('reservations',sampleOrder(extra),cookie)).status,400);
 assert.equal((await f.request('reservations',sampleOrder({deliveryMethod:'pickup',address:''}),cookie)).status,200);
});
test('reintentar una solicitud con la misma referencia de envío no crea pedidos duplicados',async()=>{
 const f=await setup(),cookie=await f.login(),order=sampleOrder();const results=await Promise.all([f.request('reservations',order,cookie),f.request('reservations',order,cookie)]);assert.equal(results[0].body.reservation.id,results[1].body.reservation.id);assert.equal(f.read().reservations.length,1);
});
test('el administrador confirma, registra auditoría y asigna puntos exactamente una vez',async()=>{
 const f=await setup(),client=await f.login(),admin=await f.login('admin');const created=await f.request('reservations',sampleOrder(),client);const id=created.body.reservation.id;const before=f.read().users[0].xp;
 const results=await Promise.all([f.request('admin/reservations',{id,status:'confirmed'},admin),f.request('admin/reservations',{id,status:'confirmed'},admin)]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal(f.read().users[0].xp,before+80);assert.equal(f.read().reservations[0].status,'confirmed');assert.equal(f.read().audit.length,1);assert.equal(f.read().audit[0].actorId,'demo-admin');
 assert.equal((await f.request('state',null,client)).body.reservations[0].status,'confirmed');
});
test('cancelar no acredita puntos y un cliente no puede confirmar pedidos',async()=>{
 const f=await setup(),client=await f.login(),admin=await f.login('admin');const created=await f.request('reservations',sampleOrder(),client);const id=created.body.reservation.id;const before=f.read().users[0].xp;
 assert.equal((await f.request('admin/reservations',{id,status:'confirmed'},client)).status,403);
 assert.equal((await f.request('admin/reservations',{id,status:'cancelled'},admin)).status,200);assert.equal(f.read().users[0].xp,before);assert.equal(f.read().ledger.length,0);
});
test('otro cliente no ve las reservas del titular',async()=>{
 const f=await setup(),client=await f.login(),other=await f.login('ambassador');await f.request('reservations',sampleOrder(),client);assert.equal((await f.request('state',null,other)).body.reservations.length,0);
});
test('un reto pausado no impide reservar y las solicitudes previas conservan sus puntos',async()=>{
 const f=await setup(),client=await f.login(),admin=await f.login('admin');const first=await f.request('reservations',sampleOrder(),client);
 assert.equal((await f.request('admin/challenges',{id:'early',title:'Reserva anticipada',description:'Reserva con tiempo y recibe puntos al confirmar.',points:100,active:false},admin)).status,200);
 const second=await f.request('reservations',sampleOrder(),client);assert.equal(second.status,200);assert.equal(second.body.reservation.points,0);
 await f.request('admin/reservations',{id:first.body.reservation.id,status:'confirmed'},admin);assert.equal(f.read().users[0].xp,170);
 assert.equal((await f.request('admin/reservations',{id:second.body.reservation.id,status:'confirmed'},admin)).status,200);
});
test('las fotos pendientes se revisan aunque el reto se pause y conservan los puntos ofrecidos',async()=>{
 const f=await setup(),client=await f.login(),admin=await f.login('admin');await f.request('contributions',{url:'https://example.test/foto.jpg',authorization:true},client);const id=f.read().contributions[0].id;
 await f.request('admin/challenges',{id:'photo',title:'Foto de tu sorpresa',description:'Comparte una foto autorizada de tu sorpresa.',points:100,active:false},admin);
 assert.equal((await f.request('admin/contributions',{id,status:'approved'},admin)).status,200);assert.equal(f.read().users[0].xp,130);assert.equal((await f.request('admin/contributions',{id,status:'approved'},admin)).status,409);
});
test('cambiar contraseña requiere la actual, invalida otras sesiones y conserva la sesión activa',async()=>{
 const f=await setup(),admin=await f.login('admin'),otherSession=await f.login('admin');
 assert.equal((await f.request('account/password',{currentPassword:'Incorrecta2026!',newPassword:'NuevaSegura2026!'},admin)).status,403);
 assert.equal((await f.request('account/password',{currentPassword:ADMIN_PASSWORD,newPassword:'muycorta'},admin)).status,400);
 assert.equal((await f.request('account/password',{currentPassword:ADMIN_PASSWORD,newPassword:'NuevaSegura2026!'},admin)).status,200);
 assert.equal((await f.request('me',null,otherSession)).status,401);assert.equal((await f.request('me',null,admin)).status,200);
 assert.equal((await f.request('login',{email:'admin@milfiguras.demo',password:ADMIN_PASSWORD})).status,401);assert.equal((await f.request('login',{email:'admin@milfiguras.demo',password:'NuevaSegura2026!'})).status,200);
});
test('10 contraseñas incorrectas bloquean temporalmente los siguientes intentos',async()=>{
 const f=await setup();for(let i=0;i<10;i++)assert.equal((await f.request('login',{email:'admin@milfiguras.demo',password:'Incorrecta2026!'})).status,401);
 assert.equal((await f.request('login',{email:'admin@milfiguras.demo',password:ADMIN_PASSWORD})).status,429);
});
test('JSON nulo produce un error controlado y no un fallo del servidor',async()=>{
 const f=await setup();const r=await handleApi(new Request('http://localhost/api/login',{method:'POST',body:'null'}),f.store);assert.equal(r.status,400);
});
