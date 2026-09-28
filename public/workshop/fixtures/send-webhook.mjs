import {sign} from './reference.mjs';
const raw=JSON.stringify({id:process.argv[2]??'evt-42',amount:10,version:8,status:'paid'}),timestamp=Math.floor(Date.now()/1000);
const response=await fetch('http://127.0.0.1:4500/webhook',{method:'POST',headers:{'x-timestamp':String(timestamp),'x-signature':sign('local-learning-secret',timestamp,raw)},body:raw});
console.log(response.status,await response.json());
