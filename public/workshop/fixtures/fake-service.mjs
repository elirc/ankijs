import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {verify,Inbox,Projection} from './reference.mjs';
export function createFakeService({secret='local-learning-secret',now=()=>Math.floor(Date.now()/1000)}={}){
 const inbox=new Inbox(),projection=new Projection();let requests=0;
 return http.createServer(async(req,res)=>{
  const send=(status,body,headers={})=>{res.writeHead(status,{'content-type':'application/json',...headers});res.end(JSON.stringify(body));};
  if(req.url==='/state'&&req.method==='GET')return send(200,{balance:inbox.balance,events:inbox.seen.size,status:projection.status,version:projection.version});
  if(req.url==='/flaky'){requests++;return send(requests===1?429:requests===2?503:200,{attempt:requests},requests===1?{'retry-after':'1'}:{});}
  if(req.url!=='/webhook'||req.method!=='POST')return send(404,{error:'Not found'});
  let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>16384)return send(413,{error:'Too large'});}
  if(!verify(secret,req.headers['x-timestamp'],raw,String(req.headers['x-signature']??''),now()))return send(401,{error:'Invalid signature or timestamp'});
  let event;try{event=JSON.parse(raw);}catch{return send(400,{error:'Invalid JSON'});}
  if(!event||typeof event.id!=='string'||!event.id||!Number.isInteger(event.amount))return send(400,{error:'Invalid event'});
  const applied=inbox.receive(event);if(applied&&Number.isInteger(event.version)&&typeof event.status==='string')projection.apply(event);
  return send(200,{accepted:true,applied});
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)createFakeService().listen(4500,'127.0.0.1',()=>console.log('Local fake integration service on 127.0.0.1:4500'));
