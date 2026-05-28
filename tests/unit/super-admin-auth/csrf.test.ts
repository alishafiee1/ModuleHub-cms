import { generateCsrfToken, isValidCsrfRequest } from '../../../core/src/modules/admin-auth/csrf';

describe('super-admin-auth csrf', () => {
  it('rejects POST when CSRF token is missing', () => {
    const request = {
      method: 'POST',
      session: { csrfToken: generateCsrfToken() },
      get: () => undefined,
      body: {},
    } as never;

    expect(isValidCsrfRequest(request)).toBe(false);
  });

  it('accepts POST when header token matches session token', () => {
    const token = generateCsrfToken();
    const request = {
      method: 'POST',
      session: { csrfToken: token },
      get: (headerName: string) => (headerName.toLowerCase() === 'x-csrf-token' ? token : undefined),
      body: {},
    } as never;

    expect(isValidCsrfRequest(request)).toBe(true);
  });

  it('accepts POST when body csrfToken matches session token', () => {
    const token = generateCsrfToken();
    const request = {
      method: 'POST',
      session: { csrfToken: token },
      get: () => undefined,
      body: { csrfToken: token },
    } as never;

    expect(isValidCsrfRequest(request)).toBe(true);
  });
});
