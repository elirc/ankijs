import test from 'node:test';
import { once } from 'node:events';
import { createNotesServer } from './server.mjs';
import { checkContract } from '../../contract.mjs';
test('notes API meets the shared contract',async()=>{const server=createNotesServer().listen(0,'127.0.0.1');await once(server,'listening');try{await checkContract('http://127.0.0.1:'+server.address().port);}finally{await new Promise(resolve=>server.close(resolve));}});
