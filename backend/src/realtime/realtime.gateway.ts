/**
 * گیت‌وی WebSocket (Socket.IO)
 * هر دستگاه موقع اتصال توکن دسترسی می‌فرسته:
 *   io(url + '/realtime', { auth: { token } })
 * اگه توکن معتبر باشه، دستگاه وارد «اتاق» مخصوص کاربرش میشه
 * و هر تغییری که تو بقیه‌ی دستگاه‌های همون کاربر بیفته رو لحظه‌ای می‌گیره.
 * کاربرها هیچ‌وقت رویدادهای همدیگه رو نمی‌بینن.
 */
import { Logger } from '@nestjs/common';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { TokensService } from '../auth/tokens.service';
import { getCorsOrigins } from '../common/cors';
import type { RealtimeEvent } from './realtime.events';

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: getCorsOrigins() },
})
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(private readonly tokens: TokensService) {}

  // وقتی دستگاه جدیدی وصل میشه: هویتش رو چک می‌کنیم و می‌بریمش تو اتاقش
  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token;
      if (typeof token !== 'string') throw new Error('missing token');

      const payload = await this.tokens.verifyAccess(token);
      await client.join(this.roomOf(payload.sub));
    } catch {
      // توکن نامعتبر: اتصال رو همین‌جا قطع می‌کنیم
      this.logger.warn(`اتصال نامعتبر رد شد (${client.id})`);
      client.disconnect(true);
    }
  }

  // فرستادن یک رویداد به همه‌ی دستگاه‌های یک کاربر
  emitToUser(userId: string, event: RealtimeEvent, payload: unknown): void {
    this.server.to(this.roomOf(userId)).emit(event, payload);
  }

  // اسم اتاق هر کاربر
  private roomOf(userId: string): string {
    return `user:${userId}`;
  }
}
