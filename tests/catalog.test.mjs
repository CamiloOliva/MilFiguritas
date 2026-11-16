import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBreakfast,validateServiceOptions} from '../src/catalog.mjs';
import {setup,sampleOrder} from './helpers.mjs';
const base={size:'large',main:'both',side:'both',drink:'soda',sweetPreference:'arequipe'};
test('los tres tamaños permiten únicamente sus platos y acompañamientos correspondientes',()=>{
 for(const size of ['large','medium','small'])for(const main of ['both','sandwich','pancakes'])for(const side of ['both','fruit','sweet']){
  const valid=(size==='small'?main!=='both':main==='both')&&(size==='large'?side==='both':side!=='both');
  const fn=()=>validateBreakfast({...base,size,main,side});if(valid)assert.equal(fn().size,size);else assert.throws(fn);
 }
 for(const invalid of [null,[],{}, {...base,size:'enorme'},{...base,drink:'agua'},{...base,sweetPreference:'no-existe'}])assert.throws(()=>validateBreakfast(invalid));
});
test('dulce personalizado y bebidas con alcohol requieren datos explícitos',()=>{
 assert.throws(()=>validateBreakfast({...base,sweetPreference:'other',customSweet:''}));
 assert.equal(validateBreakfast({...base,sweetPreference:'other',customSweet:'Chocolate'}).customSweet,'Chocolate');
 assert.equal(validateBreakfast({...base,size:'medium',side:'fruit',sweetPreference:'other',customSweet:'irrelevante'}).sweetPreference,null);
 for(const drink of ['beer','whisky']){assert.throws(()=>validateBreakfast({...base,drink}));assert.throws(()=>validateBreakfast({...base,drink,alcoholConfirmed:'true'}));assert.equal(validateBreakfast({...base,drink,alcoholConfirmed:true}).alcoholConfirmed,true);}
});
test('los eventos requieren temática y dirección del montaje; asistentes son opcionales',()=>{
 const event={product:'Decoración de eventos',deliveryMethod:'delivery',eventDetails:{theme:'Jardín floral',guests:40},giftDetails:'Globos lavanda'};
 assert.deepEqual(validateServiceOptions(event).eventDetails,{theme:'Jardín floral',guests:40});
 assert.equal(validateServiceOptions({...event,eventDetails:{theme:'Floral'}}).eventDetails.guests,null);
 for(const override of [{eventDetails:null},{deliveryMethod:'pickup'},{eventDetails:{theme:'x'}},{eventDetails:{theme:'Floral',guests:0}},{eventDetails:{theme:'Floral',guests:5001}}])assert.throws(()=>validateServiceOptions({...event,...override}));
});
test('API conserva composición y personalización, rechaza combinaciones alteradas sin guardar pedidos',async()=>{
 const f=await setup(),cookie=await f.login();
 let result=await f.request('reservations',sampleOrder({breakfast:{...base,size:'small',main:'pancakes',side:'sweet',sweetPreference:'other',customSweet:'Chocolate'},giftDetails:'Rosas y tarjeta azul'}),cookie);
 assert.equal(result.status,200);assert.equal(result.body.reservation.breakfast.customSweet,'Chocolate');assert.equal(f.read().reservations[0].giftDetails,'Rosas y tarjeta azul');
 for(const breakfast of [{...base,size:'small'},{...base,size:'medium'},{...base,drink:'beer'}]){result=await f.request('reservations',sampleOrder({breakfast}),cookie);assert.equal(result.status,400);}
 result=await f.request('reservations',sampleOrder({product:'Decoración de eventos',eventDetails:{theme:'Cumpleaños floral',guests:25},color:'Personalizada'}),cookie);assert.equal(result.status,200);assert.equal(result.body.reservation.eventDetails.guests,25);assert.equal(result.body.reservation.color,'Personalizada');assert.equal(f.read().reservations.length,2);
});

test('el servidor fija los precios por tamaño e ignora importes enviados por el cliente',async()=>{
 const f=await setup(),cookie=await f.login();
 for(const [size,amount] of [['large',150000],['medium',100000],['small',80000]]){
  const breakfast={...base,size,main:size==='small'?'sandwich':'both',side:size==='large'?'both':'fruit'};
  const result=await f.request('reservations',sampleOrder({breakfast,price:1,pricing:{kind:'fixed',amount:1,currency:'USD'}}),cookie);
  assert.equal(result.status,200);assert.deepEqual(result.body.reservation.pricing,{kind:'fixed',amount,currency:'COP'});
  assert.deepEqual(f.read().reservations.at(-1).pricing,{kind:'fixed',amount,currency:'COP'});
 }
 for(const product of ['Caja de Momentos','Decoración de eventos']){
  const result=await f.request('reservations',sampleOrder({product,eventDetails:{theme:'Floral'},pricing:{kind:'fixed',amount:500}}),cookie);
  assert.equal(result.status,200);assert.deepEqual(result.body.reservation.pricing,{kind:'quote',amount:null,currency:'COP'});
 }
});
