import assert from 'node:assert/strict';
export async function checkContract(base) {
 const call=async(method,path,body,user='alice')=>{const res=await fetch(base+path,{method,headers:{'x-test-user':user,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,body:await res.json()};};
 assert.equal((await call('GET','/notes',undefined,'')).status,401);
 assert.equal((await call('POST','/notes',{body:'   '})).status,400);
 assert.equal((await call('POST','/notes',{body:'x'.repeat(2001)})).status,400);
 const created=await call('POST','/notes',{body:'  First note  '});assert.equal(created.status,201);assert.equal(created.body.body,'First note');
 const path='/notes/'+created.body.id;
 assert.equal((await call('GET',path,undefined,'bob')).status,404);
 assert.equal((await call('PATCH',path,{body:'stolen',version:1},'bob')).status,404);
 assert.equal((await call('GET',path)).body.body,'First note');
 const pair=await Promise.all([call('PATCH',path,{body:'Editor A',version:1}),call('PATCH',path,{body:'Editor B',version:1})]);
 assert.deepEqual(pair.map(x=>x.status).sort(),[200,409]);
 const saved=await call('GET',path);assert.equal(saved.body.version,2);
 assert.equal((await call('GET','/notes?q=Editor')).body.length,1);
 assert.equal((await call('GET','/notes',undefined,'bob')).body.length,0);
 assert.equal((await call('PATCH',path,{archived:true,version:2})).status,200);
 assert.equal((await call('GET','/notes')).body.length,0);
 assert.equal((await call('GET',path)).body.archived,true);
}
if(process.argv[2]){await checkContract(process.argv[2]);console.log('Shared notes contract passed');}
