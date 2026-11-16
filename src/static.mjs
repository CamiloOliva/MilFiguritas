import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';

// Trusted paths come from the server's explicit public asset map.
export async function serveStatic(req,res,file,type,immutable=false){
 const {size}=await stat(file);
 const headers={'Content-Type':type,'Accept-Ranges':'bytes','Cache-Control':immutable?'public, max-age=31536000, immutable':'no-cache'};
 let start=0,end=size-1,status=200;
 if(req.headers.range){
  const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if(!match||(!match[1]&&!match[2])){res.writeHead(416,{...headers,'Content-Range':`bytes */${size}`});res.end();return;}
  if(!match[1])start=Math.max(0,size-Number(match[2]));
  else {start=Number(match[1]);if(match[2])end=Math.min(Number(match[2]),size-1);}
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>end||start>=size){res.writeHead(416,{...headers,'Content-Range':`bytes */${size}`});res.end();return;}
  status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;
 }
 headers['Content-Length']=end-start+1;
 res.writeHead(status,headers);
 if(req.method==='HEAD'){res.end();return;}
 const stream=createReadStream(file,{start,end});
 stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
}
