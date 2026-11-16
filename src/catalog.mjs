import '../public/catalog.js';
import {requireThat,text,positiveInteger} from './validation.mjs';
const catalog=globalThis.MilfigurasCatalog;
export const serviceFor=catalog.serviceFor;

export function validateBreakfast(value){
  requireThat(value&&typeof value==='object'&&!Array.isArray(value),'Selecciona el tamaño y las opciones de tu desayuno.');
  const {size,main,side,drink}=value;
  requireThat(catalog.breakfastSizes.some(s=>s.id===size),'Selecciona un tamaño de desayuno válido.');
  requireThat(size==='small'?['sandwich','pancakes'].includes(main):main==='both',size==='small'?'El desayuno pequeño incluye un solo plato.':'El desayuno grande y mediano incluyen sándwich y panqueques con huevo.');
  requireThat(size==='large'?side==='both':['fruit','sweet'].includes(side),size==='large'?'El desayuno grande incluye frutas y dulce.':'Elige frutas o dulce, solo uno.');
  const beverage=catalog.drinks.find(d=>d.id===drink);
  requireThat(beverage,'Selecciona una bebida válida.');
  requireThat(!beverage.alcohol||value.alcoholConfirmed===true,'Las bebidas con alcohol requieren confirmar mayoría de edad.');
  let sweetPreference=null,customSweet='';
  if(side!=='fruit'){
    requireThat(catalog.sweets.some(s=>s.id===value.sweetPreference),'Selecciona qué dulce prefieres.');
    sweetPreference=value.sweetPreference;
    if(sweetPreference==='other')customSweet=text(value.customSweet,2,80);
  }
  return {size,main,side,drink,sweetPreference,customSweet,alcoholConfirmed:beverage.alcohol&&value.alcoholConfirmed===true};
}

export function validateServiceOptions(input){
  const service=serviceFor(input.product);
  requireThat(service,'Selecciona un servicio del catálogo.');
  const giftDetails=input.giftDetails?text(input.giftDetails,1,240):'';
  if(service==='breakfast'){const breakfast=validateBreakfast(input.breakfast);return {service,breakfast,giftDetails,pricing:{kind:'fixed',amount:catalog.breakfastSizes.find(size=>size.id===breakfast.size).price,currency:'COP'}};}
  if(service==='event'){
    const value=input.eventDetails;
    requireThat(value&&typeof value==='object'&&!Array.isArray(value),'Completa los datos de la decoración de tu evento.');
    requireThat(input.deliveryMethod==='delivery','Indica el lugar donde se realizará la decoración del evento.');
    const theme=text(value.theme,2,120);
    const guests=value.guests===undefined||value.guests===null||value.guests===''?null:positiveInteger(value.guests,5000);
    return {service,eventDetails:{theme,guests},giftDetails,pricing:{kind:'quote',amount:null,currency:'COP'}};
  }
  return {service,giftDetails,pricing:{kind:'quote',amount:null,currency:'COP'}};
}
