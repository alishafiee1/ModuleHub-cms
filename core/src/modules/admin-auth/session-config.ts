import type { Application, RequestHandler } from 'express';
import session from 'express-session';
import { loadSystemSettings } from '../system-settings';
import { ensureSessionCsrfToken } from './csrf';

const DEFAULT_SESSION_SECRET = 'modulehub-dev-session-secret-change-me';

/**
 * Resolves session signing secret from env or dev fallback.
 * @returns Session secret string
 */
export function getSessionSecret(): string {
  return process.env.SESSION_SECRET?.trim() || DEFAULT_SESSION_SECRET;
}

/**
 * Creates express-session middleware with TTL from system settings.
 * @returns Session middleware configured for ModuleHub CMS
 */
export function createSessionMiddleware(): RequestHandler {
  const isProduction = process.env.NODE_ENV === 'production';
  return session({
    name: 'modulehub.sid',
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: true,
    proxy: isProduction,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000,
    },
  });
}

/**
 * Patches session cookie maxAge from system settings on each request (lazy TTL refresh).
 * @returns Express middleware
 */
export function createSessionTtlMiddleware(): RequestHandler {
  return (request, _response, next) => {
    void loadSystemSettings()
      .then((settings) => {
        if (request.session.cookie) {
          request.session.cookie.maxAge = settings.sessionTtlHours * 60 * 60 * 1000;
        }
        ensureSessionCsrfToken(request);
        next();
      })
      .catch(next);
  };
}

/**
 * Registers session + TTL middleware on the Express app.
 * @param app - Express application
 */
export function registerSessionMiddleware(app: Application): void {
  app.use(createSessionMiddleware());
  app.use(createSessionTtlMiddleware());
}
