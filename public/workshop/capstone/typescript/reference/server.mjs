import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
export function createNotesServer() {
 const notes = new Map();
 return http.createServer(async (req,res) => {
  const send=(status,value)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(value));};
  // Deliberate local test adapter. Replace with a verified session before deployment.
  const owner=req.headers['x-test-user'];
  if(typeof owner!=='string'||!owner.trim())return send(401,{error:'Test identity required'});
  const url=new URL(req.url,'http://localhost');
  const id=url.pathname.startsWith('/notes/')?url.pathname.slice(7):null;
  if(url.pathname!=='/notes'&&!id)return send(404,{error:'Not found'});
  try {
   let body={};
   if(req.method==='POST'||req.method==='PATCH') {
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>16384)return send(413,{error:'Too large'});}
    try{body=JSON.parse(raw);}catch{return send(400,{error:'Invalid JSON'});}
    if(!body||typeof body!=='object'||Array.isArray(body))return send(400,{error:'Object required'});
   }
   if(req.method==='GET'&&!id) {
    const q=(url.searchParams.get('q')??'').toLowerCase();
    return send(200,[...notes.values()].filter(n=>n.owner===owner&&!n.archived&&n.body.toLowerCase().includes(q)));
   }
   if(req.method==='POST'&&!id) {
    if(typeof body.body!=='string'||!body.body.trim()||body.body.trim().length>2000)return send(400,{error:'Use 1–2000 characters'});
    const note={id:randomUUID(),owner,body:body.body.trim(),version:1,archived:false};notes.set(note.id,note);return send(201,note);
   }
   const note=notes.get(id);
   if(!note||note.owner!==owner)return send(404,{error:'Not found'});
   if(req.method==='GET')return send(200,note);
   if(req.method==='PATCH') {
    if(!Number.isInteger(body.version))return send(400,{error:'Expected version required'});
    if(body.version!==note.version)return send(409,{error:'Note changed; reload and compare your draft',current:note});
    if(body.body!==undefined&&(typeof body.body!=='string'||!body.body.trim()||body.body.trim().length>2000))return send(400,{error:'Use 1–2000 characters'});
    if(body.archived!==undefined&&typeof body.archived!=='boolean')return send(400,{error:'Invalid archive value'});
    const next={...note,body:body.body===undefined?note.body:body.body.trim(),archived:body.archived??note.archived,version:note.version+1};
    notes.set(id,next);return send(200,next);
   }
   return send(405,{error:'Method not allowed'});
  }catch{return send(500,{error:'Save failed'});}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)createNotesServer().listen(4000,'127.0.0.1',()=>console.log('Local test API: http://127.0.0.1:4000'));
