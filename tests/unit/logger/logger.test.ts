import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import request from 'supertest';
import express from 'express';
import { resetCmsLoggerForTests } from '../../../core/src/modules/logger';

describe('request logging middleware', () => {
  let tempRoot: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-log-'));
    process.env.MODULEHUB_APP_ROOT = tempRoot;
    resetCmsLoggerForTests();
    jest.resetModules();
    await fs.ensureDir(path.join(tempRoot, 'storage', 'logs'));
  });

  afterEach(async () => {
    process.env.MODULEHUB_APP_ROOT = previousAppRoot;
    resetCmsLoggerForTests();
    await fs.remove(tempRoot);
  });

  it('writes log entry with method, path, and status', async () => {
    const { requestLoggingMiddleware: loggingMiddleware } = await import(
      '../../../core/src/modules/logger/request-logging-middleware'
    );

    const app = express();
    app.use(loggingMiddleware);
    app.get('/test-path', (_request, response) => {
      response.status(204).end();
    });

    await request(app).get('/test-path').expect(204);

    await new Promise((resolve) => setTimeout(resolve, 150));

    const logDir = path.join(tempRoot, 'storage', 'logs');
    const files = await fs.readdir(logDir);
    const logFile = files.find((name) => name.startsWith('cms-') && name.endsWith('.log'));
    expect(logFile).toBeDefined();

    const content = await fs.readFile(path.join(logDir, logFile as string), 'utf8');
    const lastLine = content.trim().split('\n').pop() ?? '';
    const entry = JSON.parse(lastLine) as {
      message: string;
      method: string;
      path: string;
      status: number;
    };

    expect(entry.message).toBe('http_request');
    expect(entry.method).toBe('GET');
    expect(entry.path).toBe('/test-path');
    expect(entry.status).toBe(204);
  });
});
