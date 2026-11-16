import assert from 'node:assert/strict';
import {handleApi,initialState} from '../src/app.mjs';

export const ADMIN_PASSWORD='PrivateAdmin2026!';
export const sampleOrder=(extra={})=>({product:'Desayuno Amanecer',delivery:new Date(Date.now()+72*3600000).toISOString(),occasion:'Cumpleaños',recipient:'Persona de prueba',message:'¡Que tengas un día inolvidable!',color:'Rosa',contactPhone:'3001234567',deliveryMethod:'delivery',address:'Calle de prueba 123, Bucaramanga',requestId:crypto.randomUUID(),breakfast:{size:'large',main:'both',side:'both',drink:'soda',sweetPreference:'arequipe',customSweet:'',alcoholConfirmed:false},...extra});

export async function setup(){
  let state=await initialState({adminPassword:ADMIN_PASSWORD});let queue=Promise.resolve();
  const store={read:async()=>structuredClone(state),mutate(fn){const task=queue.then(async()=>{const draft=structuredClone(state);const result=await fn(draft);state=draft;return result;});queue=task.catch(()=>{});return task;}};
  async function send(path,body,cookie='',extraHeaders={}) {
    return handleApi(new Request('http://localhost/api/'+path,{method:body?'POST':'GET',headers:{cookie,...(body?{'Content-Type':'application/json'}:{}),...extraHeaders},...(body?{body:JSON.stringify(body)}:{})}),store);
  }
  async function request(path,body,cookie='',headers={}){const r=await send(path,body,cookie,headers);return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
  async function login(role='explorer') {const r=await request('login',{email:({admin:'admin',explorer:'explorador',ambassador:'embajador'}[role])+'@milfiguras.demo',password:role==='admin'?ADMIN_PASSWORD:'Milfiguras2026!'});assert.equal(r.status,200);return r.cookie;}
  return {request,send,login,store,read:()=>structuredClone(state)};
}
