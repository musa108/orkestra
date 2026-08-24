"""
Orkestra ADK agents — real google-adk Agent (LlmAgent) instances, one per
role from the Constitution's agent contract, each backed by Gemini and
each with access to the Orkestra MCP server (../mcp-server) as a toolset.

This replaces the raw-Gemini-SDK-only path in the NestJS backend
(GeminiAiProvider) for anyone running AI_PROVIDER=adk: the NestJS Workflow
Engine calls this service's HTTP API instead of calling Gemini directly,
so reasoning goes through actual Agent Builder / ADK infrastructure
(multi-agent delegation, tool-calling, session state) rather than a bare
generateContent() call.

Constructor field names below (`model`, `instruction`, `tools`,
`output_schema`, `output_key`, `sub_agents`) were verified against the
installed google-adk package in this build's sandbox, not guessed from
docs — see services/adk-agent/README.md for how that was checked.
"""
import os
from typing import Optional

from pydantic import BaseModel, Field
from google.adk.agents import Agent
from google.adk.tools.mcp_tool.mcp_toolset import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StreamableHTTPConnectionParams

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
MCP_SERVER_URL = os.environ.get("MCP_SERVER_URL", "http://localhost:8080/mcp")

# Shared MCP toolset — every agent gets read access to real production/
# workflow/approval data via the same tools defined in mcp-server/server.py,
# rather than relying purely on whatever's stuffed into the prompt.
orkestra_toolset = McpToolset(
    connection_params=StreamableHTTPConnectionParams(url=MCP_SERVER_URL),
)


# ── Structured output schemas (mirror NestJS BaseAgent.outputSchema) ────

class ScriptOutput(BaseModel):
    scene_list: list[str] = Field(description="Scenes extracted from the brief/script")
    characters: list[str]
    locations: list[str]
    estimated_complexity: str = Field(description="low | medium | high")
    suggested_shooting_order: list[str]


class BudgetOutput(BaseModel):
    budget_estimate: float
    department_costs: list[str]
    contingency: float
    cost_summary: str


class ScheduleOutput(BaseModel):
    production_calendar: list[str]
    resource_allocation: list[str]
    timeline: str
    conflicts_detected: list[str]


class RiskEvidence(BaseModel):
    factor: str = Field(description="Risk factor identifier, e.g. schedule_compression, budget_variance")
    source: str = Field(description="Evidence data source, e.g. clickhouse, workflow_status, brief")
    finding: str = Field(description="Empirical finding or historical pattern observation")


class RiskOutput(BaseModel):
    riskLevel: str = Field(description="LOW | MEDIUM | HIGH | CRITICAL")
    summary: str = Field(description="Executive summary of production risk profile")
    contributingFactors: list[str] = Field(description="Key contributing risk factors")
    evidence: list[RiskEvidence] = Field(description="Data-grounded evidence from ClickHouse intelligence or upstream steps")
    recommendation: str = Field(description="Actionable production recommendation")
    expectedImpact: str = Field(description="Expected operational impact of the recommendation")
    affectedWorkflowSteps: list[str] = Field(description="List of affected workflow steps")


class MarketingOutput(BaseModel):
    campaign_plan: str
    social_content_outline: list[str]
    launch_timeline: str
    distribution_checklist: list[str]


class AnalyticsOutput(BaseModel):
    project_health: str
    agent_utilization: list[str]
    workflow_duration: float
    confidence_trend: list[str]
    success_rate: float


class DirectorOutput(BaseModel):
    task_assignments: list[str]
    workflow_decision: str
    escalations: list[str]


# ── Agent definitions ────────────────────────────────────────────────
# Instructions carry over the identity/goal/constraints from the NestJS
# BaseAgent subclasses verbatim, so behavior is defined once conceptually
# even though it now has two possible execution paths (Mock/Gemini in
# NestJS, or this ADK path).

script_agent = Agent(
    name="script_agent",
    model=GEMINI_MODEL,
    instruction=(
        "You are the Script Agent. Goal: extract scenes, characters, locations, "
        "complexity, and a suggested shooting order from the supplied script or "
        "production brief. Constraint: base output only on the supplied text — "
        "use the get_production tool to fetch the real brief if you only have a "
        "production_id, never invent scenes not implied by the source material."
    ),
    tools=[orkestra_toolset],
    output_schema=ScriptOutput,
    output_key="script_output",
)

budget_agent = Agent(
    name="budget_agent",
    model=GEMINI_MODEL,
    instruction=(
        "You are the Budget Agent. Goal: produce a budget estimate, per-department "
        "costs, a risk-adjusted contingency, and a cost summary. Constraint: flag "
        "any estimate with high variance instead of asserting false precision. "
        "Use get_production to ground the estimate in the production's actual "
        "stated budget and genre rather than a generic assumption."
    ),
    tools=[orkestra_toolset],
    output_schema=BudgetOutput,
    output_key="budget_output",
)

schedule_agent = Agent(
    name="schedule_agent",
    model=GEMINI_MODEL,
    instruction=(
        "You are the Schedule Agent. Goal: produce a production calendar, "
        "resource allocation, timeline, and conflict detection. Constraint: "
        "surface scheduling conflicts explicitly rather than silently "
        "resolving them. Use get_workflow_status to see what upstream agents "
        "(e.g. Script Agent) have already produced before building the schedule."
    ),
    tools=[orkestra_toolset],
    output_schema=ScheduleOutput,
    output_key="schedule_output",
)

risk_agent = Agent(
    name="risk_agent",
    model=GEMINI_MODEL,
    instruction=(
        "You are the Risk Agent. Goal: detect budget variances, schedule conflicts, "
        "missing approvals, and logistical risks; produce a structured risk assessment and policy recommendations. "
        "Reasoning Flow: Always use the query_production_intelligence tool (via MCP) to inspect ClickHouse "
        "historical patterns for the production's genre and budget, and use get_workflow_status to inspect upstream outputs. "
        "Constraint: Never invent statistics. Base findings on real MCP data. If historical ClickHouse data is limited, "
        "state that explicitly in evidence. Pair every risk with an actionable recommendation and affected steps."
    ),
    tools=[orkestra_toolset],
    output_schema=RiskOutput,
    output_key="risk_output",
)

marketing_agent = Agent(
    name="marketing_agent",
    model=GEMINI_MODEL,
    instruction=(
        "You are the Marketing Agent. Goal: produce a campaign plan, social "
        "content outline, launch timeline, and distribution checklist. "
        "Constraint: tie every recommendation back to the production's actual "
        "genre and target audience — use get_production to fetch these rather "
        "than assuming."
    ),
    tools=[orkestra_toolset],
    output_schema=MarketingOutput,
    output_key="marketing_output",
)

analytics_agent = Agent(
    name="analytics_agent",
    model=GEMINI_MODEL,
    instruction=(
        "You are the Analytics Agent. Goal: summarize project health, agent "
        "utilization, workflow duration, confidence trends, and success rate. "
        "Constraint: report only on metrics actually present in the supplied "
        "execution history — use get_workflow_status to pull the real step "
        "history rather than estimating."
    ),
    tools=[orkestra_toolset],
    output_schema=AnalyticsOutput,
    output_key="analytics_output",
)

# Director coordinates the five specialists via ADK's native sub_agent
# delegation (LlmAgent transfer-to-agent), which is the real ADK mechanism
# for "Director never calls specialists directly" — the Director issues a
# transfer, ADK's runtime hands control to the sub-agent, and control
# returns when that sub-agent finishes. This mirrors the event-driven
# delegation in the NestJS Workflow Engine at the orchestration-pattern
# level, using ADK's own primitive for it rather than reimplementing one.
director_agent = Agent(
    name="director_agent",
    model=GEMINI_MODEL,
    instruction=(
        "You are the Director Agent. Goal: interpret production goals, "
        "delegate work to the right specialist sub-agent, track progress, "
        "resolve conflicts, and escalate failures. Constraint: never fabricate "
        "a specialist's output yourself — transfer to script_agent, "
        "budget_agent, schedule_agent, risk_agent, marketing_agent, or "
        "analytics_agent for anything in their domain. Use get_production "
        "first to ground your plan in the real production brief."
    ),
    tools=[orkestra_toolset],
    sub_agents=[script_agent, budget_agent, schedule_agent, risk_agent, marketing_agent, analytics_agent],
    output_schema=DirectorOutput,
    output_key="director_output",
)

AGENT_REGISTRY: dict[str, Agent] = {
    "DIRECTOR": director_agent,
    "SCRIPT": script_agent,
    "BUDGET": budget_agent,
    "SCHEDULE": schedule_agent,
    "RISK": risk_agent,
    "MARKETING": marketing_agent,
    "ANALYTICS": analytics_agent,
}
