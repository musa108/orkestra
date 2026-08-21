import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { SessionService } from './session.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'change-me-in-production',
        // Short-lived by default per the auth spec (was 1h) — refresh
        // tokens (7-30d, see SessionService) carry the long-lived trust
        // now, not the access token.
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') ?? '15m' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, SessionService],
  controllers: [AuthController],
  exports: [AuthService, SessionService],
})
export class AuthModule {}
