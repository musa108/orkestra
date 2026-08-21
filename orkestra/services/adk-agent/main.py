"""
Orkestra ADK Agent Service — HTTP wrapper around the real google-adk agents
in orkestra_agents.py, so the NestJS Workflow Engine can call it exactly
like it calls the Mock/Gemini providers (see apps/api/src/agents/providers/
adk.provider.ts), but execution now actually goes through Agent Builder/ADK
infrastructure: multi-agent delegation, tool-calling via the Orkestra MCP
server, and session state — not a bare generateContent() call.

Every signature used below (InMemoryRunner.run_async, InMemorySessionService
.create_session, types.Content) was verified against the installed
google-adk package in this build's sandbox before being used here — see
services/adk-agent/README.md.

Run: uvicorn main:app --host 0.0.0.0 --port 8081
"""
import time
import uuid
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google.adk.runners import InMemoryRunner
from google.genai import types

from orkestra_agents import AGENT_REGISTRY

app = FastAPI(title="Orkestra ADK Agent Service")

# One InMemoryRunner per agent type, built lazily and cached — mirrors the
# NestJS AgentRuntimeService's registry-of-agents pattern on this side too.
_runners: dict[str, InMemoryRunner] = {}


def _runner_for(agent_type: str) -> InMemoryRunner:
    if agent_type not in AGENT_REGISTRY:
        raise HTTPException(404, f"Unknown agent type: {agent_type}")
    if agent_type not in _runners:
        _runners[agent_type] = InMemoryRunner(
            agent=AGENT_REGISTRY[agent_type],
            app_name="orkestra",
        )
    return _runners[agent_type]


class ExecuteRequest(BaseModel):
    production_id: str
    workflow_id: str
    input: dict[str, Any] = {}


class ExecuteResponse(BaseModel):
    structured_data: dict[str, Any]
    reasoning_summary: str
    confidence: float
    duration_ms: int


@app.get("/health")
def health():
    return {"status": "ok", "agents": list(AGENT_REGISTRY.keys())}


@app.post("/agents/{agent_type}/execute", response_model=ExecuteResponse)
async def execute_agent(agent_type: str, req: ExecuteRequest):
    """Matches the wire contract apps/api/src/agents/providers/ai-provider
    .interface.ts's AgentGeneration expects, so AdkAgentProvider can treat
    this exactly like the Mock/Gemini providers from the caller's side."""
    agent_type = agent_type.upper()
    runner = _runner_for(agent_type)
    start = time.time()

    user_id = f"workflow-{req.workflow_id}"
    session_id = str(uuid.uuid4())

    await runner.session_service.create_session(
        app_name="orkestra", user_id=user_id, session_id=session_id,
        state={"production_id": req.production_id, "workflow_id": req.workflow_id, **req.input},
    )

    prompt = (
        f"production_id: {req.production_id}\n"
        f"workflow_id: {req.workflow_id}\n"
        f"input: {req.input}\n\n"
        "Produce your structured output now, using your tools to ground it "
        "in real production/workflow data."
    )

    final_state: dict[str, Any] = {}
    last_text = ""
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=types.Content(role="user", parts=[types.Part(text=prompt)]),
    ):
        if event.content and event.content.parts:
            for part in event.content.parts:
                if part.text:
                    last_text = part.text

    session = await runner.session_service.get_session(
        app_name="orkestra", user_id=user_id, session_id=session_id,
    )
    if session and session.state:
        final_state = dict(session.state)

    output_key = AGENT_REGISTRY[agent_type].output_key
    structured = final_state.get(output_key, {})

    duration_ms = int((time.time() - start) * 1000)

    return ExecuteResponse(
        structured_data=structured if isinstance(structured, dict) else {},
        reasoning_summary=last_text[:2000] if last_text else f"{agent_type} agent completed via ADK.",
        confidence=0.85,  # ADK's structured-output mode doesn't expose a
                          # native confidence score; this scaffold reports a
                          # fixed placeholder rather than fabricating false
                          # precision — see README for how to wire a real one.
        duration_ms=duration_ms,
    )
