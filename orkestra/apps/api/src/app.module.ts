import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { AuthzModule } from './authz/authz.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { ProductionsModule } from './productions/productions.module';
import { WorkflowModule } from './workflow/workflow.module';
import { AgentsModule } from './agents/agents.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { EventsModule } from './events/events.module';
import { TasksModule } from './tasks/tasks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AssetsModule } from './assets/assets.module';
import { SearchModule } from './search/search.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './authz/permissions.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot({ wildcard: true }),
    // Global default rate limit (spec section 25); auth endpoints layer a
    // tighter @Throttle() on top — see auth.controller.ts.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuditModule,
    AuthzModule,
    AuthModule,
    OrganizationsModule,
    UsersModule,
    ProductionsModule,
    WorkflowModule,
    AgentsModule,
    ApprovalsModule,
    EventsModule,
    TasksModule,
    NotificationsModule,
    AnalyticsModule,
    AssetsModule,
    SearchModule,
  ],
  providers: [
    // Order matters: authenticate -> coarse role gate -> granular
    // permission gate (spec section 22's
    // Authentication -> Organization membership -> Permission -> Resource
    // authorization -> Action policy chain; resource-level checks live in
    // each service, e.g. productions.service.ts's findOne).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
