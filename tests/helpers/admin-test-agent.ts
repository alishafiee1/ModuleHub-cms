import type { Application } from 'express';
import type TestAgent from 'supertest/lib/agent';

/**
 * Creates a supertest agent and loads a CSRF token for mutating admin requests.
 * @param app - Express application under test
 * @returns Agent and CSRF token header value
 */
export async function createAgentWithCsrf(app: Application): Promise<{
  agent: TestAgent;
  csrfToken: string;
}> {
  const supertest = (await import('supertest')).default;
  const agent = supertest.agent(app);
  const csrfResponse = await agent.get('/api/auth/csrf-token');
  return {
    agent,
    csrfToken: csrfResponse.body.csrfToken as string,
  };
}

/**
 * Performs Super Admin login on an agent that already has a CSRF token.
 * @param agent - Supertest agent with session cookie
 * @param csrfToken - CSRF token for POST /admin/login
 * @param username - Admin username
 * @param password - Admin password
 */
export async function loginSuperAdminOnAgent(
  agent: TestAgent,
  csrfToken: string,
  username: string,
  password: string,
): Promise<void> {
  const loginResponse = await agent
    .post('/admin/login')
    .set('X-CSRF-Token', csrfToken)
    .send({ username, password });
  if (loginResponse.status !== 200) {
    throw new Error(`Login failed (${loginResponse.status}): ${loginResponse.body?.error ?? 'unknown'}`);
  }
}
