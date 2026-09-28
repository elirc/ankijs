import fs from 'node:fs';
import assert from 'node:assert/strict';
const units=JSON.parse(fs.readFileSync('src/data/workshop-units.json','utf8'));
assert.equal(units.length,38);assert.equal(new Set(units.map(u=>u.id)).size,38);
const counts=new Map();const cardIds=new Set();
for(const u of units){counts.set(u.group,(counts.get(u.group)??0)+1);for(const field of ['title','objective','runtime','evidence','task','solution','question','answer'])assert.ok(typeof u[field]==='string'&&u[field].trim(),u.id+': '+field);assert.equal(u.rubric.length,3);assert.ok(u.hints.length>=2);assert.ok(u.sources.every(s=>new URL(s).protocol==='https:'));assert.ok(fs.existsSync('public'+u.fixture));for(const id of u.cardIds){assert.ok(!cardIds.has(id));cardIds.add(id);}assert.ok(u.solution.length>150,u.id+' needs a developed reference');}
assert.equal(counts.get('Capstones'),2);assert.equal(counts.size,7);for(const [group,count]of counts)if(group!=='Capstones')assert.equal(count,6);assert.equal(cardIds.size,76);
for(const p of ['capstone/typescript/starter/server.ts','capstone/typescript/reference/server.ts','capstone/typescript/reference/App.tsx','capstone/dotnet/starter/Program.cs','capstone/dotnet/reference/Program.cs','capstone/contract.mjs','sql/setup.sql','sql/verify.sql'])assert.ok(fs.existsSync('public/workshop/'+p),p);
console.log('Workshop validated: 38 units, 7 areas, 76 stable recall cards; starter/reference assets present.');

const existing=JSON.parse(fs.readFileSync('src/data/expanded-catalog.json','utf8'));const added=[...new Set(units.map(u=>u.deckId))];assert.equal(added.length,7);assert.ok(added.every(id=>!existing.some(d=>d.id===id)),'Workshop deck identity collides with core content');const oldCards=JSON.parse(fs.readFileSync('src/data/expanded-cards.json','utf8')).flatMap(d=>d.cards);assert.ok(oldCards.every(c=>!cardIds.has(c.id)),'Workshop card identity collides with core content');
