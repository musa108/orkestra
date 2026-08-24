"""
Orkestra MCP Server — the "Partner Entity / MCP" integration.

Exposes Orkestra's own production, workflow, and approval data as MCP tools
over Streamable HTTP, so any MCP-compatible agent (the ADK agents in
../adk-agent, or any other MCP client — Claude Desktop, another vendor's
agent runtime, etc.) can read and act on real workflow state without a
bespoke integration per agent framework.

Built on the official MCP Python SDK's FastMCP server (verified against
mcp==1.29.0 in this environment — see README for the version-compatibility
note: earlier 1.x releases lack `SamplingCapability`, which the ADK's
MCPToolset/McpToolset requires, and 2.0.0 renamed `fastmcp` to `mcpserver`,
so this pins to the range that satisfies both sides of the integration).

Data access goes through the NestJS API (not directly to Postgres) so this
server has no independent source of truth — it's a read/write facade over
the same Workflow Engine everything else uses.
"""
import os
import httpx
from mcp.server.fastmcp import FastMCP

API_BASE = os.environ.get("ORKESTRA_API_URL", "http://localhost:4000/api/v1")
API_TOKEN = os.environ.get("ORKESTRA_API_TOKEN", "")  # service-account JWT

mcp = FastMCP(
    name="orkestra",
    instructions=(
        "Tools for reading and acting on Orkestra media production data: "
        "productions, workflows, workflow steps, and pending approvals. "
        "Use get_production before generating any production-specific output "
        "so recommendations are grounded in real budget/schedule/genre data."
    ),
)


def _headers() -> dict:
    headers = {"Content-Type": "application/json"}
    if API_TOKEN:
        headers["Authorization"] = f"Bearer {API_TOKEN}"
    return headers


async def _get(path: str) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(f"{API_BASE}{path}", headers=_headers())
        resp.raise_for_status()
        return resp.json()


async def _post(path: str, body: dict) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(f"{API_BASE}{path}", headers=_headers(), json=body)
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
async def get_production(production_id: str) -> dict:
    """Fetch a production's title, description, genre, budget, status, and
    its workflows/tasks/approvals. Call this first before analyzing or
    generating anything for a specific production."""
    return await _get(f"/productions/{production_id}")


@mcp.tool()
async def get_workflow_status(workflow_id: str) -> dict:
    """Fetch a workflow's current state and every step's status/output —
    use this to check what's already been produced by earlier agents
    (e.g. Budget Agent output) before running a downstream agent."""
    return await _get(f"/workflows/{workflow_id}")


@mcp.tool()
async def list_pending_approvals(organization_id: str | None = None) -> list:
    """List approvals currently PENDING across the organization. Useful for
    an agent (e.g. Risk Agent) that needs to know whether a blocking human
    decision is outstanding before recommending further automated action."""
    return await _get("/approvals")


@mcp.tool()
async def list_production_tasks(production_id: str) -> list:
    """List tasks (human- or agent-assigned) for a production, with status
    and priority — grounds Marketing/Analytics agent output in what work
    is actually in flight rather than an assumed ideal state."""
    result = await _get(f"/tasks?productionId={production_id}")
    return result


@mcp.tool()
async def record_workflow_note(workflow_id: str, note: str) -> dict:
    """Append a plain-text note to a workflow's event history — lets an
    agent leave a durable, auditable comment (e.g. Risk Agent flagging a
    concern) distinct from its structured step output."""
    # Recorded as a lightweight domain event via the same event pipeline
    # everything else uses, rather than a separate notes table.
    return await _post(
        f"/workflows/{workflow_id}/notes",
        {"note": note, "source": "mcp-tool"},
    )


@mcp.tool()
async def query_production_intelligence(genre: str = "", budget: float = 0.0) -> dict:
    """Query ClickHouse-backed historical production intelligence and risk patterns.
    Returns historical delay patterns, risk correlations, and empirical benchmarks
    from past production workflows in similar budget brackets and genres.
    Call this tool in the Risk Agent to ground risk assessments in real historical data."""
    params = []
    if genre:
        params.append(f"genre={genre}")
    if budget:
        params.append(f"budget={budget}")
    query_str = f"?{'&'.join(params)}" if params else ""
    return await _get(f"/analytics/production-intelligence{query_str}")


if __name__ == "__main__":
    # Streamable HTTP transport — matches the StreamableHTTPConnectionParams
    # the ADK agents connect with (see adk-agent/agents/*/agent.py).
    mcp.run(transport="streamable-http")
