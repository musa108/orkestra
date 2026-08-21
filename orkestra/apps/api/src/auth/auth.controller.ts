import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

const REFRESH_COOKIE = 'orkestra_refresh_token';
const isProd = process.env.NODE_ENV === 'production';

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd, // requires HTTPS in production; allowed over http in local dev
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
}

function meta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Auth endpoints get a tighter rate limit than the app default (spec
  // section 25) — brute-force login/refresh attempts are the main risk here.
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto, meta(req));
    setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, expiresIn: result.expiresIn };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto, meta(req));
    setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, expiresIn: result.expiresIn };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    await this.authService.logout(refreshToken, user?.id, user?.organizationId);
    clearRefreshCookie(res);
    return { success: true, message: 'Logged out.' };
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Refresh token now comes from the httpOnly cookie, never the body —
    // it's never exposed to JS on the client at all (spec section 3:
    // "Do not store refresh tokens in localStorage").
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    const result = await this.authService.refresh(refreshToken, meta(req));
    setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id, user.organizationId);
  }
}
