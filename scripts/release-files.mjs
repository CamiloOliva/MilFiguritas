import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';

const rootFiles=['.gitignore','.gitattributes','.dockerignore','.env.example','.node-version','Dockerfile','compose.yaml','render.yaml','package.json','pnpm-lock.yaml','README.md','server.mjs'];
const sourceDirs=['src','public','tests','docs','migrations','scripts','.github'];

export async function listReleaseFiles(root){
  const files=[...rootFiles];
  async function visit(dir){
    for(const entry of await readdir(path.join(root,dir),{withFileTypes:true})){
      if(entry.isSymbolicLink())throw new Error('No se exportan enlaces simbólicos: '+entry.name);
      const name=dir+'/'+entry.name;
      if(entry.isDirectory())await visit(name);
      else if(entry.isFile())files.push(name);
    }
  }
  for(const dir of sourceDirs)await visit(dir);
  return files.sort();
}

export async function verifyRelease(root){
  const files=await listReleaseFiles(root);
  const credentialText=await readFile(path.join(root,'data/ACCESO-ADMIN.txt'),'utf8').catch(()=> '');
  const privatePasswords=[...credentialText.matchAll(/Contraseña inicial: (.+)/g)].map(m=>m[1].trim()).filter(v=>v.length>10);
  const source=[];
  for(const file of files){
    if(/(^|\/)(data|node_modules|\.openai|output|dist)(\/|$)|(^|\/)\.env$|\.sqlite(?:-|$)|ACCESO-ADMIN\.txt$/.test(file))throw new Error('Archivo privado en la publicación: '+file);
    const buffer=await readFile(path.join(root,file));
    if(/\.(mp4|webp)$/.test(file)){if(buffer.length>25*1024*1024)throw new Error('Recurso multimedia demasiado grande: '+file);source.push({path:file,bytes:buffer.length,binary:true});continue;}
    const content=buffer.toString('utf8');
    if(/(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(content))throw new Error('Posible credencial privada en: '+file);
    if(privatePasswords.some(secret=>content.includes(secret)))throw new Error('La publicación contiene una contraseña administrativa privada: '+file);
    source.push({path:file,content});
  }
  const example=source.find(f=>f.path==='.env.example').content;
  if(!/^ADMIN_PASSWORD=\s*$/m.test(example))throw new Error('El ejemplo de entorno no debe contener una contraseña.');
  return source;
}
