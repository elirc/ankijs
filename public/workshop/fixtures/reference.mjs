import {createHmac,timingSafeEqual} from 'node:crypto';
export function quantity(text){if(typeof text!=='string'||!text.trim())throw Error('blank');const n=Number(text);if(!Number.isInteger(n)||n<0||n>20)throw Error('range');return n;}
export function latestCommit(){let token=0;return {start:()=>++token,commit:(id,fn)=>{if(id===token)fn();},cancel:()=>{token++;}};}
export function guardedSave(write){let busy=false;return async value=>{if(busy)return false;busy=true;try{await write(value);return true;}finally{busy=false;}};}
export function atomicImport(store,rows,failAfter=Infinity){const next=new Map(store);for(let i=0;i<rows.length;i++){if(!rows[i]?.id||typeof rows[i].body!=='string')throw Error('invalid');next.set(rows[i].id,{...rows[i]});if(i===failAfter)throw Error('injected');}store.clear();for(const row of next)store.set(...row);}
export function localDay(instant,timeZone){const fields=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(instant)).map(x=>[x.type,x.value]));return fields.year+'-'+fields.month+'-'+fields.day;}
export function sign(secret,timestamp,raw){return createHmac('sha256',secret).update(timestamp+'.'+raw).digest('hex');}
export function verify(secret,timestamp,raw,signature,nowSeconds){if(!/^\d+$/.test(String(timestamp))||Math.abs(nowSeconds-Number(timestamp))>300||!(/^[a-f0-9]{64}$/i.test(signature)))return false;const expected=Buffer.from(sign(secret,timestamp,raw),'hex'),actual=Buffer.from(signature,'hex');return expected.length===actual.length&&timingSafeEqual(expected,actual);}
export class Inbox {
 seen=new Set();balance=0;
 receive(event,crash=false){if(this.seen.has(event.id))return false;if(!Number.isInteger(event.amount))throw Error('invalid');const next=this.balance+event.amount;if(crash)throw Error('before commit');this.balance=next;this.seen.add(event.id);return true;}
}
export class Projection {version=0;status='pending';apply(event){if(event.version<=this.version)return false;this.version=event.version;this.status=event.status;return true;}}
export class IdempotentStore {operations=new Map();write(owner,key,body){const id=owner+':'+key;const fingerprint=JSON.stringify(body);const old=this.operations.get(id);if(old){if(old.fingerprint!==fingerprint)throw Error('conflict');return old.result;}const result={id:this.operations.size+1,...body};this.operations.set(id,{fingerprint,result});return result;}}
export async function boundedRetry(send,{now,sleep,deadline,maxAttempts=3}){let attempts=0;while(attempts<maxAttempts&&now()<deadline){const response=await send();attempts++;if(response.status<400)return response;if(![429,502,503,504].includes(response.status))throw Error('permanent');if(attempts===maxAttempts)break;const delay=response.retryAfterMs??Math.min(1000*2**(attempts-1),4000);if(delay>=deadline-now())break;await sleep(delay);}throw Error('exhausted');}
export function restore(rows){const ids=new Set();for(const row of rows){if(!row.id||ids.has(row.id)||!row.owner||typeof row.body!=='string')throw Error('invalid backup');ids.add(row.id);}return new Map(rows.map(row=>[row.id,{...row}]));}
