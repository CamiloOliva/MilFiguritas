import {fileURLToPath} from 'node:url';
import {verifyRelease} from './release-files.mjs';
const files=await verifyRelease(fileURLToPath(new URL('../',import.meta.url)));
console.log('Publicación verificada: '+files.length+' archivos de código, configuración y pruebas. Sin base de datos ni acceso administrativo privado.');
