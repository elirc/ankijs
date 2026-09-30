import test from 'node:test';
import assert from 'node:assert/strict';
import {latestCommit, guardedSave, atomicImport} from '../../../../public/workshop/fixtures/reference.mjs';
const deferred = () => { let resolve; const promise = new Promise(r => {resolve=r;}); return {promise,resolve}; };
test('current intent owns completion even when older parsing finishes later', async () => {
 const gate=latestCommit(), oldParse=deferred(), seen=[];
 const old=gate.start();
 const pending=oldParse.promise.then(value => gate.commit(old,()=>seen.push(value)));
 const current=gate.start(); gate.commit(current,()=>seen.push('current'));
 oldParse.resolve('obsolete'); await pending;
 assert.deepEqual(seen,['current']);
 gate.cancel(); gate.commit(current,()=>seen.push('after cancel'));
 assert.deepEqual(seen,['current']);
});
test('save guard rejects overlap and releases after failure', async () => {
 const hold=deferred(); let calls=0;
 const save=guardedSave(async () => {calls++; await hold.promise; if(calls===1) throw Error('write failed');});
 const first=save('first'); const rejected=assert.rejects(first,/write failed/);
 assert.equal(await save('overlap'),false); assert.equal(calls,1);
 hold.resolve(); await rejected;
 assert.equal(await save('retry'),true); assert.equal(calls,2);
});
test('staged import failure preserves original and successful neighbor commits', () => {
 const original={id:'original',body:'keep'}; const store=new Map([[original.id,original]]);
 const rows=[{id:'a',body:'first'},{id:'b',body:'second'}];
 assert.throws(()=>atomicImport(store,rows,0),/injected/);
 assert.deepEqual([...store],[[original.id,original]]);
 atomicImport(store,rows); assert.deepEqual([...store.keys()],['original','a','b']);
 assert.notEqual(store.get('a'),rows[0]);
});
