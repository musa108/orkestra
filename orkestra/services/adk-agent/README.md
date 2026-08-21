# Orkestra ADK Agent Service

Real `google-adk` agents (Gemini-backed, via Google Cloud Agent Builder's
Python SDK) that call the Orkestra MCP server (`../mcp-server`) as a
toolset, wrapped in a small FastAPI HTTP layer so `apps/api`'s
`AdkAgentProvider` can call them exactly like it calls the Mock/Gemini
providers.

## What's actually verified vs. what needs your credentials to prove further

This was built by installing the real `google-adk`, `mcp`, and
`google-genai` packages in a sandbox and checking every constructor
signature used in `orkestra_agents.py` and `main.py` against the installed
code — nothing here is written from memorized/guessed API shape. Specifically
verified, in-sandbox, with real processes running:

- `pip install google-adk mcp google-genai fastapi uvicorn` — all real,
  current PyPI packages (`google-adk` 1.x/2.x, not a placeholder name).
- `services/mcp-server/server.py` actually **boots** as a process and
  registers its 5 tools against the real MCP Python SDK
  (`mcp.server.fastmcp.FastMCP`) — confirmed via `list_tools()`.
- `orkestra_agents.py` actually **constructs** all 7 `google.adk.agents.Agent`
  instances, including the `McpToolset`/`StreamableHTTPConnectionParams`
  pointed at the MCP server above, and the Director's `sub_agents=[...]`
  delegation list — confirmed by importing the module and inspecting the
  live objects (`director_agent.sub_agents`, `.tools`, `.output_schema`).
- `main.py`'s FastAPI app actually **boots** as a `uvicorn` process and its
  `/health` endpoint returns `200` listing all 7 agents.
- Calling `/agents/RISK/execute` reaches the point of actually invoking
  the ADK `Runner` against Gemini — which is exactly where it *should* stop
  in this environment, since the sandbox this was built in has no route to
  `generativelanguage.googleapis.com` and no `GEMINI_API_KEY`. That's the
  correct, expected boundary — not a bug in this code.

**What this means for you:** the integration code is real and structurally
verified end-to-end up to the model call. To see it actually generate
output, you need to run it somewhere with real network egress and a real
key:

```bash
export GEMINI_API_KEY="your-real-key"
cd services/mcp-server && pip install -r requirements.txt && python server.py &
cd services/adk-agent && pip install -r requirements.txt && uvicorn main:app --port 8081 &
curl -X POST localhost:8081/agents/RISK/execute \
  -H 'Content-Type: application/json' \
  -d '{"production_id":"...", "workflow_id":"...", "input":{}}'
```

Then in `apps/api/.env`: `AI_PROVIDER=adk`, `ADK_AGENT_URL=http://localhost:8081`.

## The version-pinning note (important if you upgrade dependencies)

`google-adk`'s `McpToolset` requires `mcp>=1.24` (needs `SamplingCapability`,
added in that release). But `mcp>=2.0` renamed the server API
(`mcp.server.fastmcp` → `mcp.server.mcpserver`), which `server.py` here
doesn't use yet. So the verified-working range for **both** sides of this
integration is `mcp>=1.24.0,<2.0.0` — that's what `requirements.txt` pins.
If you bump past 2.0, `server.py`'s `FastMCP` import needs to move to the
new location.

## What's still a real gap, not just a caveat

- **Confidence score is a placeholder (`0.85`)** — ADK's structured-output
  mode doesn't natively expose a calibrated confidence value the way the
  Mock/Gemini providers' prompted JSON schema does. Getting a real one
  means either prompting for it explicitly in each agent's `instruction`
  and reading it back out of `output_schema`, or computing one from
  `Runner` event metadata (token logprobs aren't exposed at this API
  level). Flagged here rather than left silently fake.
- **No Cloud Run deployment has been done** — Dockerfiles exist and are
  structurally correct, but nothing has actually been deployed to GCP in
  this session; no Vertex AI project, no Agent Engine registration.
- **Session/state cleanup** — `InMemoryRunner` sessions are created per
  call and never explicitly deleted; fine for a scaffold, would need a TTL
  or explicit cleanup for sustained production load.
