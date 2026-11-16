import path from 'node:path';
import {validateNewPassword} from './security.mjs';

export function readConfig(env,root) {
  const production=env.NODE_ENV==='production';
  const port=Number(env.PORT||3000);
  if(!Number.isInteger(port)||port<0||port>65535)throw new Error('PORT debe ser un puerto válido.');
  const publicOrigin=env.PUBLIC_ORIGIN||env.RENDER_EXTERNAL_URL||'';
  let origin='';
  if(publicOrigin) {
    const url=new URL(publicOrigin);
    const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
    if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('PUBLIC_ORIGIN debe ser el origen del sitio, sin rutas ni credenciales.');
    if(production&&!local&&url.protocol!=='https:')throw new Error('El sitio público de producción debe usar HTTPS.');
    origin=url.origin;
  }else if(production)throw new Error('Configura PUBLIC_ORIGIN con la URL HTTPS del sitio. En Render se detecta RENDER_EXTERNAL_URL automáticamente.');
  return {production,port,host:env.HOST||(production?'0.0.0.0':'127.0.0.1'),origin,dataDir:path.resolve(root,env.DATA_DIR||'data'),adminEmail:env.ADMIN_EMAIL?.trim().toLowerCase(),adminPassword:env.ADMIN_PASSWORD,includeDemo:!production&&env.INCLUDE_DEMO_DATA!=='false'};
}

export function bootstrapCredentials(config) {
  if(config.production) {
    if(!config.adminEmail||!/^\S+@\S+\.\S+$/.test(config.adminEmail))throw new Error('Configura ADMIN_EMAIL para crear la cuenta administrativa.');
    validateNewPassword(config.adminPassword);
  }
  return {email:config.adminEmail||'admin@milfiguras.demo',password:config.adminPassword?validateNewPassword(config.adminPassword):crypto.randomUUID()+'Aa9!'};
}
