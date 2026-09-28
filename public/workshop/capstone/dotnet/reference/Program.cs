using System.Text.Json;
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
var notes = new Dictionary<string, Note>();
var gate = new object();
// Local test adapter only. Use server-verified sessions and a database before deploying.
app.MapMethods("/notes/{id?}", new[]{"GET","POST","PATCH"}, async (HttpContext context, string? id) => {
 var owner = context.Request.Headers["x-test-user"].ToString();
 if (string.IsNullOrWhiteSpace(owner)) return Results.Json(new {error="Test identity required"}, statusCode:401);
 JsonElement input = default;
 if (context.Request.Method is "POST" or "PATCH") {
  if (context.Request.ContentLength > 16384) return Results.Json(new {error="Too large"},statusCode:413);
  try { using var buffer=new MemoryStream(); var chunk=new byte[4096]; int n; while((n=await context.Request.Body.ReadAsync(chunk,context.RequestAborted))>0){if(buffer.Length+n>16384)return Results.Json(new {error="Too large"},statusCode:413);buffer.Write(chunk,0,n);} input=JsonSerializer.Deserialize<JsonElement>(buffer.ToArray()); }
  catch(JsonException) {return Results.Json(new {error="Invalid JSON"},statusCode:400);}
  if(input.ValueKind!=JsonValueKind.Object)return Results.Json(new {error="Object required"},statusCode:400);
 }
 lock(gate) {
  if(context.Request.Method=="GET" && id is null){var q=context.Request.Query["q"].ToString();return Results.Json(notes.Values.Where(n=>n.Owner==owner&&!n.Archived&&n.Body.Contains(q,StringComparison.OrdinalIgnoreCase)).ToArray());}
  string? text=null;
  bool hasBody=input.ValueKind==JsonValueKind.Object&&input.TryGetProperty("body",out _);
  if(hasBody){var field=input.GetProperty("body");if(field.ValueKind!=JsonValueKind.String)return Results.Json(new{error="Use 1–2000 characters"},statusCode:400);text=field.GetString()!.Trim();if(text.Length is <1 or >2000)return Results.Json(new{error="Use 1–2000 characters"},statusCode:400);}
  if(context.Request.Method=="POST" && id is null){if(text is null)return Results.Json(new{error="Use 1–2000 characters"},statusCode:400);var created=new Note(Guid.NewGuid().ToString(),owner,text,1,false);notes[created.Id]=created;return Results.Json(created,statusCode:201);}
  if(id is null||!notes.TryGetValue(id,out var note)||note.Owner!=owner)return Results.Json(new{error="Not found"},statusCode:404);
  if(context.Request.Method=="GET")return Results.Json(note);
  if(context.Request.Method=="PATCH"){
   if(!input.TryGetProperty("version",out var version)||version.ValueKind!=JsonValueKind.Number||!version.TryGetInt32(out var expected))return Results.Json(new{error="Expected version required"},statusCode:400);
   if(expected!=note.Version)return Results.Json(new{error="Note changed; reload and compare your draft",current=note},statusCode:409);
   var archived=note.Archived;
   if(input.TryGetProperty("archived",out var flag)){if(flag.ValueKind is not (JsonValueKind.True or JsonValueKind.False))return Results.Json(new{error="Invalid archive value"},statusCode:400);archived=flag.GetBoolean();}
   var updated=note with {Body=text??note.Body,Version=note.Version+1,Archived=archived};notes[id]=updated;return Results.Json(updated);
  }
  return Results.Json(new{error="Method not allowed"},statusCode:405);
 }
});
app.Run();
record Note(string Id,string Owner,string Body,int Version,bool Archived);
