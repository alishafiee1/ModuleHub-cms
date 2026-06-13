import type { Application } from 'express';
import type TestAgent from 'supertest/lib/agent';
import { createAgentWithCsrf } from './admin-test-agent';

/**
 * Creates a supertest agent with CSRF for tests that disable dev Super Admin bypass.
 * @param app - Express application under test
 * @returns Agent and CSRF token header value
 */
export async function createModuleManagerTestAgent(app: Application): Promise<{
  agent: TestAgent;
  csrfToken: string;
}> {
  return createAgentWithCsrf(app);
}

/**
 * Authenticates Module Manager scope for one module via POST /admin/module/:id/auth.
 * @param agent - Supertest agent with session cookie
 * @param csrfToken - CSRF token for mutating requests
 * @param moduleId - Target module id
 * @param password - Module management password
 */
export async function authenticateModuleOnAgent(
  agent: TestAgent,
  csrfToken: string,
  moduleId: string,
  password: string,
): Promise<void> {
  const authResponse = await agent
    .post(`/admin/module/${moduleId}/auth`)
    .set('X-CSRF-Token', csrfToken)
    .send({ password });
  if (authResponse.status !== 200) {
    throw new Error(
      `Module auth failed (${authResponse.status}): ${authResponse.body?.error ?? 'unknown'}`,
    );
  }
}
