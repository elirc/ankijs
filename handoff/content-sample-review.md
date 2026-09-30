# Content sample review — v14 newly-admitted source areas

Read-only assessment of risk #4 in `03-open-risks.md`. Nothing in the generator or in
`src/data/**` was modified.

Method: `sample-new-areas.mjs` (scratchpad) streams all 165
`src/data/section-packs/reviewed-comprehensive-*.json` packs, buckets every card by the source
area in its `sourceKey`, records the deck each card actually landed in (pack id → deck name via
`section-expansion-manifest.json`), and reservoir-samples 40 cards per area with a fixed seed.
Total cards scanned: **36,853** (the generator-added set).

---

## 1. Per-area card counts

| Area | Cards | % of added | Source files | Verdict |
|---|---:|---:|---:|---|
| `.NET docs/framework/` | **8,163** | 22.2% | 3,585 | **Re-exclude** |
| `mdn/learn_web_development/` | 1,467 | 4.0% | 259 | Keep, trim |
| `.NET docs/fundamentals/` | 1,394 | 3.8% | 567 | Keep networking, **drop code-analysis** |
| `mdn/glossary/` | 610 | 1.7% | 540 | Keep, **fix routing** |
| `mdn/webassembly/` | 593 | 1.6% | 249 | **Drop `reference/`, fix routing** |
| `.NET docs/architecture/` | 508 | 1.4% | 113 | Keep, fix routing |
| `.NET docs/orleans/` | 329 | 0.9% | 86 | Borderline — re-exclude or route to distributed |
| `.NET docs/machine-learning/` | 315 | 0.9% | 55 | **Re-exclude** |
| `.NET docs/ai/` | 174 | 0.5% | 43 | Keep |
| `.NET docs/azure/` | 71 | 0.2% | 23 | Keep (tiny), or drop |
| `.NET docs/devops/` | 20 | 0.1% | 5 | Keep |
| `.NET docs/iot/` | 11 | <0.1% | 3 | **Re-exclude** (noise) |

`docs/framework/` alone is **more than one fifth of everything v14 added** and is the single
largest driver of the 93 MB / 43,887-card blowup flagged in risks #1 and #3.

## 2. Mechanical quality metrics (no red flags in fence handling)

| Area | n | median body | body <450ch | has code | unbalanced fences | dangling "the following example" | table-only body | unresolved directives |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| glossary | 610 | 627 | 35% | 9% | 0 | 2% | 0% | 0 |
| learn_web_development | 1467 | 997 | 18% | 41% | 0 | 4% | 0% | 0 |
| webassembly | 593 | 625 | 35% | 55% | 0 | 5% | **22%** | 0 |
| fundamentals | 1394 | 813 | 23% | 37% | 0 | 6% | **13%** | 0 |
| architecture | 508 | 1163 | 14% | 30% | 0 | **16%** | 0% | 0 |
| ai | 174 | 613 | 25% | 21% | 0 | 4% | 3% | 0 |
| azure | 71 | 548 | 35% | 27% | 0 | 8% | 0% | 0 |
| machine-learning | 315 | 671 | 29% | 29% | 0 | 3% | 8% | 0 |
| orleans | 329 | 684 | 31% | 20% | 0 | 7% | 12% | 0 |
| iot | 11 | 433 | **55%** | 45% | 0 | 0% | 0% | 0 |
| devops | 20 | 991 | 15% | 20% | 0 | 10% | 0% | 0 |
| framework | 8163 | 759 | 27% | 14% | 0 | **10%** | 9% | 0 |

Good news first: **no truncated or unbalanced code fences anywhere**, and **zero unresolved
`[!code-…]` / `:::code` / `[!INCLUDE]` directives** in any new area. The snippet-resolution work in
`read-source-archives.py` (admitting `samples/` and `includes/`) did its job. The `{%` and CRLF
fixes also hold up — no template residue was found in the samples.

The problems are semantic, not mechanical: **table-only bodies** (a card whose entire answer is a
reference table — nothing to recall) and **dangling cross-references** (a card that says "the
following example" or "as described above" when the example lives in a sibling section that was
split into a different card).

---

## 3. Deck-name distribution for the new areas

### The dominant routing defect: everything .NET falls through to the two beginner decks

`decksFor()` ends the `dotnet/docs` branch with `return deckIds(6001,6002)` —
**01 · C# from your first line** and **02 · Model your web app in C#**. Every newly-admitted .NET
area is mostly keyword-miss, so it lands there:

| Area | → 6001+6002 | share |
|---|---:|---:|
| fundamentals | 1,215 / 1,394 | 87% |
| architecture | 447 / 508 | 88% |
| ai | 168 / 174 | 97% |
| azure | 56 / 71 | 79% |
| machine-learning | 290 / 315 | 92% |
| orleans | 271 / 329 | 82% |
| iot | 11 / 11 | 100% |
| devops | 20 / 20 | 100% |
| framework | 5,770 / 8,163 | 71% |

**≈8,250 cards.** A deck named *"01 · C# from your first line"* now contains Orleans grain
placement policy, ML.NET forecasting CLI flags, Azure Resource Manager SDK, remote-debugging a
Raspberry Pi over SSH, and CA/IDE analyzer rule tables. This is the worst mis-routing found, and it
is independent of whether the areas are kept.

### MDN areas

**webassembly (593)** — Systems · processes & concurrency 212, **Observability · diagnose
production 211**, JavaScript & TypeScript 170. The single rule
`if (/\/webassembly\//.test(path)) return deckIds(3008,3007,2);` sends ~36% of Wasm cards into an
*observability/production-diagnosis* deck, which has nothing to do with Wasm.

**glossary (610)** — JavaScript & TypeScript 217, Engineering craft 203, 05 · Understand a web page
73, HTML · semantics 19, DOM practice 14, CSS layout 14, and a long tail. The glossary fallback is
`return deckIds(8,2,4005)`, so **217 non-JavaScript glossary terms are filed under JavaScript &
TypeScript** — ARPANET, SISD, MVC, packet, public-key cryptography, screen reader, UTF-16.

Substring collisions are also visible: `domain_sharding` matches the `dom` alternative and lands in
*HTML · semantics & browser behavior*; `registrable_domain` lands in *Browser APIs & DOM practice*.

**learn_web_development (1,467)** — 15 · Build interfaces people can use 304, 19 · Ship and maintain
a small app 229, CSS layout 208, HTML semantics 182, **Delivery · containers & safe releases 179**,
JS mechanics 181, Engineering craft 72, others. Routing here is the most defensible of the three,
though `server-side` (296 cards, Django + Express tutorials) being funnelled into *Delivery ·
containers* / *Ship and maintain a small app* is a stretch — e.g. a Django **security** card lands
in a release-engineering deck rather than a security deck.

---

## 4. `.NET docs/framework/` — verbatim samples and verdict

### Composition (8,163 cards, 1,373 distinct sub-paths)

| Sub-area | Cards |
|---|---:|
| `wcf/**` (Windows Communication Foundation, incl. 495 sample walkthroughs) | **3,371** |
| `unmanaged-api/**` (CLR hosting, profiling, debugging, WMI, fusion — COM interfaces) | **1,762** |
| `data/adonet/**` (classic ADO.NET, DataSet, OLE DB, Oracle provider) | **1,055** |
| `configure-apps/file-schema/**` (app.config / web.config XML element reference) | **770** |
| `additional-apis/pos-for-net` (point-of-sale device API) | 214 |
| `windows-workflow-foundation/**` | ~130 |
| `ui-automation/`, `interop/`, `deployment/`, `network-programming/`, release notes… | rest |

467 cards are `How to:` topics, 32 are `Walkthrough:`, 594 come from `**/samples/` directories, and
253 contain literal Visual Studio GUI steps ("Press F5", "from the **Build** menu").

### Verbatim samples

**Sample 1 — deck `12 · Build a real notes app, one decision at a time`**
`docs/framework/wcf/feature-details/stand-alone-json-serialization.md#Advanced information / Polymorphism / Collections Assigned to Object`
> Front: **Stand-Alone JSON Serialization using DataContractJsonSerializer / Advanced information / Polymorphism / Collections Assigned to Object** — "Explain … in the context of …"
> Back: "Collections assigned to Object are serialized as if they are collections that implement
> `IEnumerable<T>`: a JSON array with each entry that has a type hint if it is a complex type…
> `[{"__type":"Shape:#MyApp.Shapes","x":50,"y":70}, …]`"

`DataContractJsonSerializer` is superseded by `System.Text.Json` — this actively teaches the wrong
API, in a deck about building a notes app.

**Sample 2 — deck `13 · Debug without guessing`**
`docs/framework/unmanaged-api/diagnostics/isymunmanagedencupdate-updatesymbolstore2-method.md#Parameters`
> Front: **ISymUnmanagedENCUpdate::UpdateSymbolStore2 Method / Parameters** — "Which inputs does … accept?"
> Back: "`pIStream` \[in] A pointer to an IStream that contains the line information. `pDeltaLines`
> \[in] A pointer to a SYMLINEDELTA structure that contains the lines that have changed. `cDeltaLines`
> \[in] A ULONG that represents the number of lines that have changed."

An unmanaged COM parameter list. There are **1,762** cards from `unmanaged-api/`. A learner cannot
answer this from memory and would gain nothing if they could.

**Sample 3 — deck `02 · Model your web app in C#`**
`docs/framework/data/adonet/system-requirements-for-the-dotnet-data-provider-for-oracle.md#…UTF-8 Data`
> Back: "To set the alternate character set, set the Registry Key
> `HKEY_LOCAL_MACHINE\SOFTWARE\ORACLE\HOMEID\NLS_LANG` to UTF8. See the Oracle Installation notes on
> your platform for more information…"

A Windows registry key for a removed Oracle provider, filed in the beginner web-app deck.

**Sample 4 — deck `10 · Test and debug .NET web apps`**
`docs/framework/ui-automation/using-ui-automation-for-automated-testing.md#Related Tools and Technologies`
> Back: "Inspect.exe is a graphical user interface (GUI) application that can be used to gather UI
> Automation information… MSAABridge exposes UI Automation information to Active Accessibility
> clients…"

A "Related tools" section — the exact nav-stub/see-also shape the `skippedHeading` filter exists to
reject, surviving because the heading reads "Related Tools and Technologies" rather than
"Related content".

**Sample 5 — deck `01 · C# from your first line`**
`docs/framework/windows-workflow-foundation/samples/programming-model-item-tree.md#To use this sample`
> Back: "1. Open the ProgrammingModelItemTree.sln solution in Visual Studio. 2. Build the solution by
> selecting **Build Solution** from the **Build** menu. 3. Press F5 to run the application. The WPF
> form is then displayed. 4. Click the **Load WF** button to load the ModelItem and bind it to the
> tree view…"

Pure GUI click-path for a WPF sample. Zero recall value. 594 cards come from `samples/` dirs.

**Sample 6 — deck `02 · Model your web app in C#`**
`docs/framework/wcf/using-bindings-to-configure-services-and-clients.md#What a Binding Defines`
> Back: "…the information a binding contains about how to connect to an endpoint falls into one of
> the categories in the following table.
> Protocols — Determines the security mechanism being used…
> Transport — Determines the underlying transport protocol to use (for example, TCP or HTTP).
> Encoding — Determines the message encoding…"

The "following table" is not a table — legacy MSDN-converted content uses two-space line breaks that
the markdown pipeline flattens. 10% of framework cards contain a dangling
"the following/preceding example|table" reference, tied for the worst rate with `architecture`.

**Sample 7 — deck `08 · Validation and web security`**
`docs/framework/wcf/feature-details/security-behaviors-in-wcf.md#Service Credentials / <issuedTokenAuthentication> Element`
> Back: "The issued token scenario has three stages… The `<issuedTokenAuthentication>` element is the
> repository for any such secure token service certificates. To add certificates, use the
> `<knownCertificates>` element…"

WS-Trust STS configuration via `app.config` XML, presented in the modern web-security deck.

### Verdict on `docs/framework/`: **RE-EXCLUDE. Unambiguous.**

- **Curricular fit: none.** ~80% of the area is WCF, unmanaged CLR COM interfaces, classic ADO.NET
  and `app.config` XML schema. The curriculum's C#/.NET track is ASP.NET Core + EF Core + modern
  C#. Nothing in `wcf/`, `unmanaged-api/`, `pos-for-net/`, `ui-automation/` or
  `windows-workflow-foundation/` maps to any deck in `section-expansion-manifest.json`.
- **Actively harmful, not merely neutral.** Cards teach `DataContractJsonSerializer`,
  `DataSet`/OLE DB, `<system.serviceModel>` configuration and .NET Remoting migration as current
  practice. A learner drilling these builds wrong priors about modern .NET.
- **Card-shape quality is the worst of the twelve areas:** 594 sample click-paths, 467 "How to:"
  procedure fragments, 253 Visual Studio GUI steps, 10% dangling cross-references, 9% table-only
  bodies.
- **It is the cost driver.** Removing it drops ~8,163 cards (22% of added content) and roughly
  20 MB of pack JSON, materially relieving risks #1 and #3 at no curricular cost.
- v13 excluded this area deliberately. The v14 diff removed it from both the deck-routing skip
  regex and the post-parse exclusion regex **with no justification anywhere**. The evidence says
  the v13 decision was correct and the reversal was accidental.

---

## 5. The other questioned .NET areas

### `machine-learning/` (315) — **re-exclude**
Mostly ML.NET tutorials and Model Builder **GUI walkthroughs**:
> `machine-learning/tutorials/movie-recommendation-model-builder.md#Select an environment` →
> deck *01 · C# from your first line* — "Model Builder can run the training on different
> environments depending on the scenario that was selected. Select **Local** as your environment and
> click the **Next step** button."

That is a click instruction, not knowledge. Others are ML.NET CLI flag dumps
(`mlnet forecasting --dataset --horizon --label-col …`) and a generic ML glossary ("Supervised
machine learning: a subclass of machine learning in which a desired model predicts the label for
yet-unseen data") that duplicates general ML vocabulary the curriculum does not teach. ML.NET is
not on any track in the manifest.

### `orleans/` (329) — **re-exclude, or route only to distributed-systems decks**
Content quality is genuinely fine — grain placement policies, cancellation-token callbacks running
on the grain scheduler, Orleans reminder meters — coherent prose with real C#. The problem is fit
and routing: Orleans is a niche actor framework, 82% of its cards land in the two beginner C#
decks, and only 10 reach *Distributed systems · failure scenarios*. If the goal is
distributed-systems intuition, `architecture/microservices` covers it better with less
framework-specific vocabulary.

### `iot/` (11) — **re-exclude**
Three files, 11 cards, 55% of bodies under 450 chars, all in *01 · C# from your first line*:
> `iot/debugging.md#…Install the Visual Studio Remote Debugger on the SBC` —
> "`curl -sSL https://aka.ms/getvsdbgsh | /bin/sh /dev/stdin -v latest -l ~/vsdbg`"

Rounding-error volume, off-curriculum, and mostly setup commands. (One decent card:
`iot/intro.md#A word on threads` on the libraries not being thread-safe — not worth the area.)

### `azure/` (71) — **keep (marginal)**
Small and better than expected. The Azure SDK pagination card teaches a real, transferable lesson:
> `azure/sdk/pagination.md#…Beware client-side evaluation` — "When using the `System.Linq.Async`
> package, beware that LINQ operations are executed on the client. The following query would fetch
> *all* the items just to count them: `await client.GetPropertiesOfSecretsAsync().CountAsync();`"

One clear reject in the sample: `azure/sdk/resource-management.md#Next steps / Additional
Documentation`, a pure link list that `skippedHeading` missed because the heading is compound.

### `ai/` (174) — **keep**
The strongest of the new .NET areas. `Microsoft.Extensions.AI` `IChatClient`, passing data to AI
functions, routing chat clients, responsible-AI framing — current, first-party, teachable prose.
Only routing needs work (97% land in the two beginner decks).

### `devops/` (20) — **keep**
GitHub Actions + .NET SDK in CI. On-curriculum, decent length (median 991 chars). Should route to
*Delivery · containers & safe releases* (3009), not *01 · C# from your first line*.

### `architecture/` (508) — **keep, trim**
`microservices/microservice-ddd-cqrs-patterns` (67), `multi-container-microservice-net-applications`
(36), `implement-resilient-applications` (11) and `modern-web-apps-azure` are curriculum-grade, with
real repository/EF Core code. Two caveats: the **16% dangling-cross-reference rate is the highest of
any area**, and `blazor-for-web-forms-developers/**` is legacy-adjacent — it teaches by contrast
with Web Forms ("Web Forms developers could maintain information about the currently acting user
with the `ISession` dictionary object…") and should follow `docs/framework/` out the door.

### `fundamentals/` (1,394) — **keep networking, drop code-analysis**
**1,105 of 1,394 cards (79%) are Roslyn analyzer rule pages** — 430 distinct `CA####`/`IDE####`
documents, each producing a property table:
> `fundamentals/code-analysis/quality-rules/ca1016.md#guided-lesson` → deck *01 · C# from your first
> line* — "| **Rule ID** | CA1016 | | **Title** | Mark assemblies with AssemblyVersionAttribute |
> | **Category** | … |"

These are IDE-lookup reference, not memorizable teaching material; 13% of the area's bodies are
table-only. The residual (`networking/quic` 31, `networking/http` 29, `networking/telemetry` 27,
`sockets` 7, `reflection`) is good and worth keeping.

---

## 6. MDN areas

### `glossary/` (610) — keep the content, fix the routing
Bodies are short, self-contained definitions and read well as flashcards:
> `glossary/grid_row` → *CSS · layout & interaction · 1* — "A **grid row** is a horizontal track in
> a CSS grid layout, that is the space between two horizontal grid lines. It is defined by the
> `grid-template-rows` property…"

Two problems:
1. **217 cards land in *JavaScript & TypeScript*** purely via the `return deckIds(8,2,4005)`
   fallback — e.g. `glossary/arpanet` ("an early computer network, constructed in 1969… ARPANET was
   closed in early 1990") and `glossary/sisd` ("Single Instruction/Single Data… one classification
   of computer architectures"). Historical and CS-trivia terms in the JS deck.
2. **Substring collisions**: `dom` matches `domain_sharding` (→ *HTML · semantics*) and
   `registrable_domain` (→ *Browser APIs & DOM practice*); `cache`, `hash` and `auth` will collide
   the same way. The glossary path segment is just the term slug, so these alternatives need
   boundary anchoring.

### `learn_web_development/` (1,467) — the best new area, with three trims
Highest median body length (997), 41% carry code, no mechanical defects. Sampled cards on
`<address>` markup, IndexedDB object stores, and building accessible media controls are exactly the
right shape. Rejects:
- **`getting_started/soft_skills` (39 cards)** — `styling_basics/debugging_css#Take a step back from
  the problem`: "If you are becoming frustrated, take a step away from the issue for a while — go
  for a walk, grab a drink, chat to a co-worker…". Not recallable knowledge.
- **`extensions/server-side/django` (115 cards)** — Python/Django in a curriculum whose backend
  track is C#/.NET. The Express/Node material in the same tree is defensible; Django is not.
- **Multi-part tutorial fragments** — "Express Tutorial Part 3: Using a Database (with Mongoose) /
  Defining the LocalLibrary Schema", whose body opens "We will define a separate module for each
  model, as discussed above" and links back to the source file. Step-N-of-a-tutorial cards are
  unanswerable standalone. The `core/accessibility/mobile` TalkBack cards ("swipe left/right till
  you get to it, and then double-tapping") are the same shape — device procedure, not concept.

### `webassembly/` (593) — drop `reference/`, fix routing
**438 of 593 cards (74%)** come from `reference/simd`, `reference/numeric`, `value_types`, `table`,
`memory`, `control_flow` etc. — one card per Wasm instruction, whose entire body is a binary-encoding
table:
> `webassembly/reference/simd/arithmetic/extmul_high_i16x8_s#Syntax / Binary encoding` → deck
> *Observability · diagnose production* — "| `i32x4.extmul_high_i16x8_s` | `0xfd 189:u32` |
> `i32x4.extmul_high_i16x8_s` => `0xfd 0xbd 0x01` |"

22% of the area's bodies are table-only, the worst rate measured. No web developer memorizes Wasm
opcodes, and the deck is wrong on top of that. The **`guides/` subtree** (c_to_wasm, rust_to_wasm,
using_the_javascript_api, concepts, understanding_the_text_format — ~60 cards) is the opposite:
real, teachable, complete code (the `emcc hello.c -o hello.html` walkthrough is a good card).

---

## 7. Ranked recommended actions

All line references are `scripts/build-comprehensive-content.mjs`, function `decksFor()`.

**1. Re-exclude `docs/framework/` (highest impact: −8,163 cards, ~−20 MB).**
Restore the v13 behaviour in the `dotnet/docs` skip regex:

```js
if (/visual-basic|fsharp|migration|whats-new|breaking-change|install\/|tools\/|docs\/framework\//.test(path)) return [];
```

and restore the matching term in the post-parse exclusion regex it was removed from.

**2. Drop the Roslyn analyzer rule reference (−1,105 cards).** Add to the same skip regex:

```js
|docs\/fundamentals\/code-analysis\/(?:quality|style)-rules\/
```

(keep `fundamentals/networking/**` and `fundamentals/reflection/**`).

**3. Drop the Wasm instruction reference, keep the guides (−438 cards).** Replace

```js
if (/\/webassembly\//.test(path)) return deckIds(3008,3007,2);
```

with

```js
if (/\/webassembly\//.test(path)) {
  if (/\/webassembly\/reference\//.test(path)) return [];   // per-opcode encoding tables
  return deckIds(2, 3008);                                   // JS/TS + Systems, not Observability
}
```

**4. Stop the .NET fallback dumping everything into the beginner decks (~8,250 cards re-routed).**
Insert area-specific routing *before* the keyword chain in the `dotnet/docs` branch:

```js
if (/docs\/architecture\/|docs\/orleans\//.test(path)) return deckIds(4,3002,6011);
if (/docs\/devops\//.test(path))                      return deckIds(3009,5009,8);
if (/docs\/ai\//.test(path))                          return deckIds(6006,6005,6012);
```

and consider making the terminal `return deckIds(6001,6002)` conditional on the path actually being
under `docs/csharp/` or `docs/core/`, returning `[]` otherwise — so future area widenings fail
closed instead of silently filling the beginner decks.

**5. Re-exclude `machine-learning/`, `iot/` and (recommended) `orleans/` (−655 cards).**

```js
if (/docs\/(?:machine-learning|iot|orleans)\//.test(path)) return [];
```

If Orleans is kept for its distributed-systems value, apply action 4's routing instead and drop
`machine-learning/` + `iot/` only.

**6. Fix the glossary fallback so non-JS terms stop landing in the JS deck (−217 mis-routes).**
Change the glossary fallback from `return deckIds(8,2,4005);` to `return deckIds(8);`, and anchor
the substring-prone alternatives — e.g. `(?:^|_)dom(?:$|_)` instead of bare `dom`, so
`domain_sharding` and `registrable_domain` route on `domain` rather than `dom`. Same for `cache`,
`hash`, `auth`.

**7. Trim `learn_web_development/` (−154 cards).** In the `learn_web_development` branch:

```js
if (/\/getting_started\/soft_skills\/|\/server-side\/django\//.test(path)) return [];
```

and route `/server-side/` to backend/API decks rather than `3009` (*Delivery · containers*).

**8. Widen `skippedHeading` to catch compound nav headings.** It currently anchors on the whole
heading string, so "Next steps / Additional Documentation" and "Related Tools and Technologies"
survive. Match on any `/`-separated segment of the heading, and add
`related tools?( and technologies)?`, `additional documentation`, `to use this sample`,
`to run the sample`.

**9. Consider dropping `architecture/blazor-for-web-forms-developers/**`** — it teaches by contrast
with Web Forms and only makes sense to someone migrating legacy code.

**10. Re-measure after 1–3, 5 and 7.** Those actions remove roughly **10,500 cards (~29% of what
v14 added)** without touching `RECALL_EXPANSION_MULTIPLE`. That is a curriculum-quality-driven
reduction that also substantially addresses risks #1 and #3 — take this cut *before* deciding
whether to lower the expansion multiple, since the multiple would otherwise halve good content and
bad content alike.
