import {requireThat,text} from './rules.mjs';

// The browser redraws photos as 256px JPEGs, stripping original metadata.
export function validateAvatar(value) {
  if(value===null)return null;
  requireThat(typeof value==='string'&&value.length<=175000,'La foto es demasiado grande. Selecciona otra imagen.');
  const match=value.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/);
  requireThat(match&&match[1].length%4===0,'Selecciona una fotografía JPG, PNG o WebP válida.');
  let bytes;
  try { bytes=Uint8Array.from(atob(match[1]),c=>c.charCodeAt(0)); }
  catch { requireThat(false,'La fotografía no es válida.'); }
  requireThat(bytes.length<=131072&&bytes[0]===255&&bytes[1]===216&&bytes.at(-2)===255&&bytes.at(-1)===217,'La fotografía no es válida.');
  let offset=2,dimensions=null;
  while(offset+3<bytes.length) {
    requireThat(bytes[offset]===255,'La fotografía no es válida.');
    const marker=bytes[offset+1];
    if(marker===218||marker===217)break;
    const length=(bytes[offset+2]<<8)|bytes[offset+3];
    requireThat(length>=2&&offset+length+2<=bytes.length,'La fotografía no es válida.');
    if([192,193,194].includes(marker)) {
      requireThat(length>=8,'La fotografía no es válida.');
      dimensions={height:(bytes[offset+5]<<8)|bytes[offset+6],width:(bytes[offset+7]<<8)|bytes[offset+8]};
      break;
    }
    offset+=length+2;
  }
  requireThat(dimensions&&dimensions.width>0&&dimensions.height>0&&dimensions.width<=512&&dimensions.height<=512,'La foto debe tener un máximo de 512 × 512 píxeles.');
  return value;
}

export function updateProfile(state,user,input) {
  const name=text(input.name,2,80);
  const email=text(input.email,5,120).toLowerCase();
  requireThat(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'Introduce un correo válido.');
  requireThat(!state.users.some(u=>u.id!==user.id&&u.email===email),'Este correo ya está registrado.',409);
  const avatar=input.avatar===undefined?user.avatar:validateAvatar(input.avatar);
  Object.assign(user,{name,email,avatar,updatedAt:new Date().toISOString()});
}
