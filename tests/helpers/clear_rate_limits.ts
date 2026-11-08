import env from '#start/env';
import limiter from '@adonisjs/limiter/services/main';

export default function clearRateLimits() {
  return limiter.clear([env.get('LIMITER_STORE')]);
}
