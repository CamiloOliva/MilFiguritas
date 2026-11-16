export class AppError extends Error { constructor(message,status=400){super(message);this.status=status;} }
export function requireThat(condition,message,status=400){if(!condition)throw new AppError(message,status);}
export function text(value,min=1,max=160){requireThat(typeof value==='string','Completa los campos requeridos.');const v=value.trim();requireThat(v.length>=min&&v.length<=max,`El texto debe tener entre ${min} y ${max} caracteres.`);return v;}
export function positiveInteger(value,max=100000){requireThat(Number.isInteger(value)&&value>0&&value<=max,'Introduce un número entero positivo válido.');return value;}
