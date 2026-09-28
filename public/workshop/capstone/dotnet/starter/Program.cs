var builder=WebApplication.CreateBuilder(args);
var app=builder.Build();
// Implement the shared contract from ../../contract.mjs.
app.MapMethods("/notes/{id?}",new[]{"GET","POST","PATCH"},()=>Results.Json(new{error="Implement owner-scoped notes and revision checks"},statusCode:501));
app.Run();
