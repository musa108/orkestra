import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { DomainEventPayload } from './event-types';

// Domain event name -> camelCase wire event name (deliberate transform,
// documented in event-types.ts).
function toWireEventName(type: string): string {
  return type.charAt(0).toLowerCase() + type.slice(1);
}

interface AuthedSocket extends Socket {
  data: { userId: string; organizationId: string };
}

/**
 * Previously this gateway accepted every connection with no auth check at
 * all — anyone who could reach the WebSocket endpoint could join any
 * workflow room by ID and watch its live event stream. Fixed: the same
 * JWT used for REST calls is now required in the Socket.IO handshake
 * (`auth.token`), verified on connect, and workflow membership is
 * scoped so a client can only join rooms for workflows belonging to
 * productions in their own organization.
 */
@WebSocketGateway({
  namespace: '/workflow',
  cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' },
})
export class WorkflowGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.emit('connectionError', { message: 'Missing auth token.' });
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwt.verify(token);
      (client as AuthedSocket).data = {
        userId: payload.sub,
        organizationId: payload.organizationId,
      };
      client.emit('connected', { socketId: client.id });
    } catch {
      client.emit('connectionError', { message: 'Invalid or expired token.' });
      client.disconnect(true);
    }
  }

  handleDisconnect() {}

  @SubscribeMessage('joinWorkflow')
  async joinWorkflow(client: AuthedSocket, workflowId: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { production: { select: { organizationId: true } } },
    });

    if (!workflow || workflow.production.organizationId !== client.data?.organizationId) {
      client.emit('connectionError', { message: 'Workflow not found or access denied.' });
      return;
    }

    client.join(`workflow:${workflowId}`);
  }

  @SubscribeMessage('leaveWorkflow')
  leaveWorkflow(client: Socket, workflowId: string) {
    client.leave(`workflow:${workflowId}`);
  }

  @OnEvent('*')
  broadcast(event: DomainEventPayload) {
    // this.server is null before Socket.IO attaches (e.g. in test / CLI contexts)
    if (!this.server) return;
    const wireEvent = toWireEventName(event.type);
    if (event.workflowId) {
      this.server.to(`workflow:${event.workflowId}`).emit(wireEvent, event);
    } else {
      this.server.emit(wireEvent, event);
    }
  }
}
