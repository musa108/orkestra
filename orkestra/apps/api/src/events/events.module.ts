import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventBusService } from './event-bus.service';
import { WorkflowGateway } from './workflow.gateway';
import { ClickHouseService } from './clickhouse.service';

@Global()
@Module({
  imports: [
    // Same secret/config as AuthModule's JwtModule — kept as a separate
    // registration (rather than importing AuthModule) to avoid a
    // cross-module dependency that isn't otherwise needed here.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'change-me-in-production',
      }),
    }),
  ],
  providers: [EventBusService, WorkflowGateway, ClickHouseService],
  exports: [EventBusService, WorkflowGateway, ClickHouseService],
})
export class EventsModule {}
