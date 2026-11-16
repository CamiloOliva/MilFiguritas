import {requireThat} from './rules.mjs';

export function validateNewPassword(password) {
  requireThat(typeof password==='string'&&password.length>=12&&password.length<=120,'La nueva contraseña debe tener entre 12 y 120 caracteres.');
  requireThat(/[a-z]/.test(password)&&/[A-Z]/.test(password)&&/[0-9]/.test(password),'Usa mayúsculas, minúsculas y al menos un número.');
  requireThat(password!=='Milfiguras2026!','Elige una contraseña diferente de la antigua contraseña de demostración.');
  return password;
}

export function auditDecision(state,actor,type,targetId,status) {
  state.audit??=[];
  state.audit.push({id:crypto.randomUUID(),actorId:actor.id,type,targetId,status,at:new Date().toISOString()});
}
