import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';
import vm from 'node:vm';
import {setup,sampleOrder} from './helpers.mjs';

async function until(check){for(let i=0;i<100;i++){if(check())return;await new Promise(r=>setTimeout(r,10));}assert.fail('La interfaz no alcanzó el estado esperado.');}
async function application(f,role='admin'){
 const cookie=await f.login(role),calls=[],errors=[];
 const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',error=>errors.push(error.message));
 const dom=new JSDOM(await readFile(new URL('../public/index.html',import.meta.url),'utf8'),{url:'http://localhost',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});
 const w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.matchMedia=()=>({matches:true});w.scrollTo=()=>{};
 Object.defineProperty(w.crypto,'randomUUID',{value:()=>crypto.randomUUID()});
 Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async()=>{}}});
 w.fetch=async(path,options={})=>{calls.push({path,body:options.body?JSON.parse(options.body):undefined});return f.send(path.replace('/api/',''),options.body?JSON.parse(options.body):null,cookie);};
 for(const script of ['profile.js','orders.js','app.js'])vm.runInContext(await readFile(new URL('../public/'+script,import.meta.url),'utf8'),dom.getInternalVMContext());
 try{await until(()=>w.document.querySelector('.shell'));}catch(error){w.close();throw new Error(error.message+' '+errors.join('; '));}
 return {dom,w,calls,errors,click:selector=>{const button=w.document.querySelector(selector);assert.ok(button,'Botón no encontrado: '+selector);button.click();},submit:form=>form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}))};
}

test('confirmar una reserva desde el diálogo actualiza la tabla y acredita puntos',async()=>{
 const f=await setup(),client=await f.login();const created=await f.request('reservations',sampleOrder(),client);const app=await application(f);
 try{
  app.click('[data-page="manage"]');await until(()=>app.w.document.querySelector('[data-order]'));
  app.click('[data-order="'+created.body.reservation.id+'"][data-status="confirmed"]');
  const form=app.w.document.querySelector('#admin-decision');assert.ok(form);
  // Model browsers where named controls shadow native HTMLFormElement properties.
  Object.defineProperty(form,'id',{value:form.elements.namedItem('id')});
  app.submit(form);
  await until(()=>f.read().reservations[0].status==='confirmed');await until(()=>app.w.document.querySelector('.status.confirmed'));
  assert.equal(f.read().users[0].xp,170);assert.ok(app.w.document.querySelector('#toast').textContent.includes('confirmada'));
  assert.equal(app.w.document.querySelector('#modal').open,false);assert.deepEqual(app.errors,[]);
 }finally{app.dom.window.close();}
});
test('los errores administrativos aparecen en el diálogo y permiten reintentar',async()=>{
 const f=await setup(),client=await f.login(),admin=await f.login('admin');const created=await f.request('reservations',sampleOrder(),client);const app=await application(f);
 try{
  app.click('[data-page="manage"]');await until(()=>app.w.document.querySelector('[data-order]'));
  app.click('[data-order="'+created.body.reservation.id+'"][data-status="confirmed"]');
  await f.request('admin/reservations',{id:created.body.reservation.id,status:'cancelled'},admin);
  const form=app.w.document.querySelector('#admin-decision');app.submit(form);
  await until(()=>form.querySelector('.modal-error').textContent.length>0);
  assert.match(form.querySelector('.modal-error').textContent,/procesada/);assert.equal(form.querySelector('button.btn').disabled,false);assert.equal(app.w.document.querySelector('#modal').open,true);
 }finally{app.dom.window.close();}
});
test('editar recompensas y retos funciona con campos llamados id',async()=>{
 const f=await setup(),app=await application(f);
 try{
  app.click('[data-page="rewards"]');await until(()=>app.w.document.querySelector('[data-edit-reward]'));app.click('[data-edit-reward="topper"]');
  let form=app.w.document.querySelector('#reward-form');form.elements.namedItem('title').value='Topper de prueba';form.elements.namedItem('cost').value='175';Object.defineProperty(form,'id',{value:form.elements.namedItem('id')});app.submit(form);
  await until(()=>f.read().rewards[0].cost===175);await until(()=>!app.w.document.querySelector('#modal').open);
  app.click('[data-page="challenges"]');await until(()=>app.w.document.querySelector('[data-edit-challenge]'));app.click('[data-edit-challenge="early"]');form=app.w.document.querySelector('#challenge-form');form.elements.namedItem('points').value='95';Object.defineProperty(form,'id',{value:form.elements.namedItem('id')});app.submit(form);
  await until(()=>f.read().challenges[0].points===95);assert.deepEqual(app.errors,[]);
 }finally{app.dom.window.close();}
});
test('crear pedido muestra WhatsApp con número correcto, mensaje y referencia sin enviar automáticamente',async()=>{
 const f=await setup(),app=await application(f,'explorer');
 try{
  app.click('[data-page="create"]');await until(()=>app.w.document.querySelector('[data-product]'));app.click('[data-product="Desayuno Amanecer"]');
  const form=app.w.document.querySelector('#reservation-form');const data=sampleOrder();
  for(const key of ['recipient','occasion','color','message','contactPhone','deliveryMethod','address'])form.elements.namedItem(key).value=data[key];
  app.submit(form);
  await until(()=>app.w.document.querySelector('.whatsapp-btn'));
  const link=new URL(app.w.document.querySelector('.whatsapp-btn').href);assert.equal(link.origin,'https://wa.me');assert.equal(link.pathname,'/573044817781');
  const message=link.searchParams.get('text');for(const text of ['Quisiera coordinar','Persona de prueba','Calle de prueba 123','3001234567',f.read().reservations[0].reference,'Colombia'])assert.ok(message.includes(text),text);
  assert.equal(f.read().reservations[0].status,'pending');assert.equal(f.read().ledger.length,0);
  assert.ok(app.w.document.querySelector('.order-message').textContent.includes('Mensaje de la tarjeta'));assert.deepEqual(app.errors,[]);
  const external=app.calls.filter(c=>!c.path.startsWith('/api/'));assert.equal(external.length,0);
 }finally{app.dom.window.close();}
});
test('recogida oculta la dirección y los mensajes del usuario se muestran como texto',async()=>{
 const f=await setup(),app=await application(f,'explorer');
 try{
  app.click('[data-page="create"]');await until(()=>app.w.document.querySelector('[data-product]'));app.click('[data-product="Caja de Momentos"]');
  const form=app.w.document.querySelector('#reservation-form');form.elements.namedItem('deliveryMethod').value='pickup';form.elements.namedItem('deliveryMethod').dispatchEvent(new app.w.Event('change',{bubbles:true}));
  assert.equal(form.elements.namedItem('address').required,false);assert.equal(app.w.document.querySelector('#delivery-address-field').hidden,true);
  form.elements.namedItem('recipient').value='Nombre de prueba';form.elements.namedItem('contactPhone').value='3001234567';form.elements.namedItem('message').value='<img src=x onerror=alert(1)>';
  app.submit(form);await until(()=>app.w.document.querySelector('.order-message'));
  assert.equal(app.w.document.querySelector('.order-message img'),null);assert.ok(app.w.document.querySelector('.order-message').textContent.includes('<img'));
 }finally{app.dom.window.close();}
});
test('la pantalla pública no contiene accesos directos ni la contraseña antigua',async()=>{
 const f=await setup(),dom=new JSDOM('<div id="app"></div><div id="toast"></div><dialog id="modal"></dialog>',{url:'http://localhost',runScripts:'outside-only'}),w=dom.window;
 try{
  w.fetch=async()=>new Response(JSON.stringify({error:'Inicia sesión.'}),{status:401});w.matchMedia=()=>({matches:true});
  for(const script of ['profile.js','orders.js','app.js'])vm.runInContext(await readFile(new URL('../public/'+script,import.meta.url),'utf8'),dom.getInternalVMContext());
  await until(()=>w.document.querySelector('#auth-form'));assert.equal(w.document.querySelector('[data-action="demo"]'),null);
  assert.ok(!w.document.body.innerHTML.includes('Milfiguras2026!'));assert.equal(w.document.querySelector('input[type="password"]').required,true);
  assert.equal((await f.request('login',{email:'admin@milfiguras.demo',password:'Milfiguras2026!'})).status,401);
 }finally{w.close();}
});
