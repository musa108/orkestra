import { ForbiddenException, Injectable } from '@nestjs/common';
import { AgentType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { agentHasCapability } from './agent-capabilities';
import { getTool } from './tool-registry';

/**
 * Enforces spec section 14's flow literally:
 *   Agent -> tool call -> Authorization Service -> capability check -> BLOCK or ALLOW
 * Called by AgentRuntimeService before executing any registered tool on
 * an agent's behalf. Unregistered tool names are rejected outright —
 * there is no "call anything not on the list" path.
 */
@Injectable()
export class ToolAuthorizationService {
  constructor(private audit: AuditService) {}

  async authorize(
    agentType: AgentType,
    toolName: string,
    ctx: { organizationId?: string; workflowId?: string; correlationId?: string },
  ): Promise<{ allowed: boolean; requiresApproval: boolean }> {
    const tool = getTool(toolName);

    if (!tool) {
      await this.audit.log({
        organizationId: ctx.organizationId,
        actorId: agentType,
        actorType: 'AGENT',
        action: 'AGENT_TOOL_DENIED',
        resourceType: 'Tool',
        resourceId: toolName,
        result: 'DENIED',
        reason: 'Tool is not registered.',
        correlationId: ctx.correlationId,
      });
      throw new ForbiddenException(`Tool "${toolName}" is not a registered tool.`);
    }

    const hasCapability = agentHasCapability(agentType, tool.requiredCapability);

    await this.audit.log({
      organizationId: ctx.organizationId,
      actorId: agentType,
      actorType: 'AGENT',
      action: hasCapability ? 'AGENT_TOOL_ALLOWED' : 'AGENT_TOOL_DENIED',
      resourceType: 'Tool',
      resourceId: toolName,
      result: hasCapability ? 'ALLOWED' : 'DENIED',
      reason: hasCapability ? undefined : `${agentType} lacks capability: ${tool.requiredCapability}`,
      metadata: { riskLevel: tool.riskLevel, requiresApproval: tool.requiresApproval },
      correlationId: ctx.correlationId,
    });

    if (!hasCapability) {
      throw new ForbiddenException(
        `${agentType} agent does not have permission to perform this action.`,
      );
    }

    return { allowed: true, requiresApproval: tool.requiresApproval };
  }
}
