import test from 'node:test';
import assert from 'node:assert/strict';
import {AppError,requireThat,levelFor,text,positiveInteger,leadHours,validateReservation,award,redeem,consumeCoupon,metrics} from '../src/rules.mjs';
import {sampleOrder} from './helpers.mjs';

test('niveles en límites de 0, 300 y 800 XP',()=>{
 for(const [xp,name] of [[-1,'Aprendiz de Detalles'],[0,'Aprendiz de Detalles'],[299,'Aprendiz de Detalles'],[300,'Creador de Sorpresas'],[799,'Creador de Sorpresas'],[800,'Cliente VIP']])assert.equal(levelFor(xp).name,name);
});
test('valida texto, enteros y fechas inválidas',()=>{
 assert.equal(text(' Hola '),'Hola');assert.equal(positiveInteger(1),1);assert.equal(leadHours('2026-11-19T12:00:00Z',Date.parse('2026-11-17T12:00:00Z')),48);
 for(const fn of [()=>text(null),()=>text(''),()=>positiveInteger(0),()=>positiveInteger(1.5),()=>positiveInteger(100001),()=>leadHours('inválida'),()=>requireThat(false,'No',403)])assert.throws(fn,AppError);
});
test('reserva admite exactamente 48 horas y rechaza 90 días excedidos, producto o datos inválidos',()=>{
 const now=Date.now();assert.ok(validateReservation(sampleOrder({delivery:new Date(now+48*3600000).toISOString()}),now));
 for(const data of [{delivery:new Date(now+91*86400000).toISOString()},{product:'Otro'},{contactPhone:'123'},{color:'Otro',deliveryMethod:'pickup',address:''}]) {
  if(data.color)assert.equal(validateReservation(sampleOrder(data),now).color,'Rosa');else assert.throws(()=>validateReservation(sampleOrder(data),now));
 }
});
test('puntos positivos actualizan experiencia y saldo con protección de repetición',()=>{
 const state={ledger:[]},user={id:'u',xp:0,balance:0};assert.equal(award(state,user,80,'Reserva','r1'),80);assert.equal(user.xp,80);assert.equal(user.balance,80);assert.equal(state.ledger.length,1);
 assert.throws(()=>award(state,user,80,'Reserva','r1'));assert.throws(()=>award(state,user,0,'Reserva','r2'));
});
function wallet(){return {state:{coupons:[],ledger:[]},user:{id:'u',xp:500,balance:500},reward:{id:'r',title:'Regalo',active:true,stock:2,cost:150}};}
test('canje descuenta saldo y stock, conserva XP y evita cupón vigente duplicado',()=>{
 const {state,user,reward}=wallet();const coupon=redeem(state,user,reward);assert.equal(user.balance,350);assert.equal(user.xp,500);assert.equal(reward.stock,1);assert.equal(coupon.status,'issued');assert.equal(state.ledger[0].amount,-150);assert.throws(()=>redeem(state,user,reward));
 consumeCoupon(coupon);assert.equal(coupon.status,'used');assert.throws(()=>consumeCoupon(coupon));assert.ok(redeem(state,user,reward));
});
test('rechaza canje sin recompensa, inactiva, agotada o sin saldo',()=>{
 for(const mutation of [x=>x.reward=null,x=>x.reward.active=false,x=>x.reward.stock=0,x=>x.user.balance=0]){const x=wallet();mutation(x);assert.throws(()=>redeem(x.state,x.user,x.reward));}
 const x=wallet(),expired=redeem(x.state,x.user,x.reward,0);assert.throws(()=>consumeCoupon(expired));assert.throws(()=>consumeCoupon(null));assert.ok(redeem(x.state,x.user,x.reward));
});
test('métricas calculan conversión, frecuencia, días continuos y excluyen demos del piloto',()=>{
 const now=Date.parse('2026-11-16T17:00:00Z');
 const state={users:[{id:'real',role:'explorer',consent:true,isDemo:false},{id:'demo',role:'explorer',consent:true,isDemo:true},{id:'admin',role:'admin',consent:true}],events:[],coupons:[{userId:'real',issuedAt:'2026-11-15T17:00:00Z',status:'used'},{userId:'real',issuedAt:'2026-11-15T18:00:00Z',status:'issued'}],reservations:[{userId:'real',createdAt:'2026-11-15T17:00:00Z',status:'confirmed'}]};
 for(let i=0;i<5;i++)state.events.push({userId:'real',at:new Date(now-i*86400000).toISOString()});
 for(let i=0;i<7;i++)state.events.push({userId:'demo',at:new Date(now-i*86400000).toISOString()});
 let m=metrics(state,7,false,now);assert.equal(m.conversion,50);assert.equal(m.weeklyFrequency,5);assert.equal(m.activeUsers,1);assert.equal(m.confirmed,1);assert.equal(m.pilot.consecutiveDays,5);assert.equal(m.pilot.participants,1);assert.equal(m.pilot.ready,false);assert.equal(m.series.reduce((n,s)=>n+s.count,0),m.interactions);
 m=metrics(state,7,true,now);assert.equal(m.activeUsers,2);assert.equal(m.pilot.participants,1);assert.equal(m.pilot.consecutiveDays,5);
 assert.equal(metrics({users:[],events:[],coupons:[],reservations:[]},7,false,now).conversion,0);
});
test('piloto requiere 10 participantes reales y 5 días consecutivos',()=>{
 const now=Date.parse('2026-11-16T17:00:00Z');const state={users:Array.from({length:10},(_,i)=>({id:String(i),role:'explorer',consent:true})),events:[],coupons:[],reservations:[]};
 for(let i=0;i<10;i++)state.events.push({userId:String(i),at:new Date(now).toISOString()});for(let i=1;i<5;i++)state.events.push({userId:'0',at:new Date(now-i*86400000).toISOString()});
 assert.equal(metrics(state,7,false,now).pilot.ready,true);state.events=state.events.filter(e=>e.at!==new Date(now-2*86400000).toISOString());assert.equal(metrics(state,7,false,now).pilot.ready,false);
});
