/**
 * گارد احراز هویت
 * هر مسیری که این گارد رو داشته باشه فقط با توکن دسترسی معتبر باز میشه.
 * توکن باید تو هدر Authorization به شکل «Bearer <token>» بیاد.
 */
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokensService } from '../tokens.service';
import type { AuthenticatedRequest } from '../auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokensService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Missing access token');

    // اگه توکن خراب یا منقضی باشه، همین‌جا ۴۰۱ برمی‌گرده
    const payload = await this.tokens.verifyAccess(token);
    request.user = { id: payload.sub };
    return true;
  }

  // جدا کردن توکن از هدر Authorization
  private extractToken(request: AuthenticatedRequest): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' && token ? token : null;
  }
}
