import test from 'node:test';
import assert from 'node:assert/strict';
import {sign,verify,IdempotentStore,boundedRetry,Inbox,Projection,restore} from '../../../../public/workshop/fixtures/reference.mjs';

test('signature freshness accepts exact window and rejects one second beyond',()=>{
 const raw='{"id":"boundary"}',stamp=1000,signature=sign('disposable-fixture-key',stamp,raw);
 for(const now of [700,1300]) assert.equal(verify('disposable-fixture-key',stamp,raw,signature,now),true);
 for(const now of [699,1301]) assert.equal(verify('disposable-fixture-key',stamp,raw,signature,now),false);
 assert.equal(verify('disposable-fixture-key',stamp,raw,signature.toUpperCase(),1000),true);
 assert.equal(verify('disposable-fixture-key',stamp,raw,signature.slice(1),1000),false);
});
test('teaching idempotency model exposes delimiter and noncanonical fingerprint limits',()=>{
 const store=new IdempotentStore();
 const first=store.write('a:b','c',{amount:1});
 assert.equal(store.write('a','b:c',{amount:1}),first);
 const ordered={amount:2,currency:'X'},reordered={currency:'X',amount:2};
 store.write('owner','order',ordered);
 assert.throws(()=>store.write('owner','order',reordered),/conflict/);
});
test('retry refuses a delay equal to remaining budget',async()=>{
 let clock=0,calls=0; const sleeps=[];
 await assert.rejects(boundedRetry(async()=>{calls++;return {status:429,retryAfterMs:1000};},{now:()=>clock,sleep:async ms=>{sleeps.push(ms);clock+=ms;},deadline:1000}),/exhausted/);
 assert.equal(calls,1);assert.deepEqual(sleeps,[]);assert.equal(clock,0);
});
test('retry model does not catch transport errors or reject a late successful response',async()=>{
 let clock=0,calls=0;
 const options={now:()=>clock,sleep:async ms=>{clock+=ms;},deadline:1000};
 await assert.rejects(boundedRetry(async()=>{calls++;throw Error('transport');},options),/transport/);
 assert.equal(calls,1);
 const result=await boundedRetry(async()=>{clock=2000;return {status:200};},options);
 assert.equal(result.status,200);assert.equal(clock,2000);
});
test('inbox deduplicates identity without a changed-payload conflict',()=>{
 const inbox=new Inbox();assert.equal(inbox.receive({id:'e1',amount:2}),true);
 assert.equal(inbox.receive({id:'e1',amount:99}),false);assert.equal(inbox.balance,2);
});
test('projection keeps first accepted value on an equal version',()=>{
 const p=new Projection();assert.equal(p.apply({version:4,status:'first'}),true);
 assert.equal(p.apply({version:4,status:'different'}),false);assert.equal(p.status,'first');
});
test('restore model checks owner presence but has no owner-reference table',()=>{
 const rows=[{id:'n1',owner:'not-in-an-external-directory',body:'fixture'}];
 const restored=restore(rows);assert.deepEqual(restored.get('n1'),rows[0]);assert.notEqual(restored.get('n1'),rows[0]);
 assert.throws(()=>restore([{id:'n2',body:'missing owner'}]),/invalid backup/);
});
