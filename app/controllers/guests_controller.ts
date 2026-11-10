import { randomUUID } from 'node:crypto';
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http';
import redis from '@adonisjs/redis/services/main';
import env from '#start/env';

@inject()
export default class GuestsController {
  async store({ response }: HttpContext) {
    const guestToken = randomUUID();
    const ttlSeconds = env.get('GUEST_SESSION_TTL_SECONDS', 86400);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await redis.set(`guest-session:${guestToken}`, '1', 'EX', ttlSeconds);

    return response.created({
      guest_token: guestToken,
      expires_at: expiresAt.toISOString(),
    });
  }
}
