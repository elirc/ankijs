// Implement the contract in ../../contract.mjs. Reference is ../reference/server.ts.
import http from 'node:http';
export const server=http.createServer((_request,response)=>{
 response.writeHead(501,{'content-type':'application/json'});
 response.end(JSON.stringify({error:'Implement validation, owner-scoped CRUD and revision checks'}));
});
server.listen(4000,'127.0.0.1');
