import limiter from '@adonisjs/limiter/services/main';

// Limit login attempts per IP address.
export const loginThrottle = limiter.define('auth-login', () => {
  return limiter.allowRequests(10).every('1 minute');
});

// Limit registrations per IP address.
export const registrationThrottle = limiter.define('auth-registration', () => {
  return limiter.allowRequests(10).every('1 minute');
});
