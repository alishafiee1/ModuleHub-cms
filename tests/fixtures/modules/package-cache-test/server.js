'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');

const DEFAULT_PORT = 4100;
const MODULE_ROOT = __dirname;

/**
 * Computes SHA256 manifest hash using the same payload format as ModuleHub CMS.
 * @returns {string|null} Hex digest or null when package.json is missing
 */
function computeLocalManifestHash() {
  const packageJsonPath = path.join(MODULE_ROOT, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }
  const content = fs.readFileSync(packageJsonPath, 'utf8');
  const payload = `package.json:${content}`;
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

/**
 * Builds runtime diagnostics for package-cache verification.
 * @returns {Record<string, unknown>} Diagnostic payload
 */
function buildDiagnosticsPayload() {
  const nodeModulesPath = path.join(MODULE_ROOT, 'node_modules');
  let nodeModulesIsSymlink = false;
  let nodeModulesTarget = null;

  if (fs.existsSync(nodeModulesPath)) {
    const stats = fs.lstatSync(nodeModulesPath);
    nodeModulesIsSymlink = stats.isSymbolicLink();
    if (nodeModulesIsSymlink) {
      nodeModulesTarget = fs.readlinkSync(nodeModulesPath);
    }
  }

  let leftPadWorks = false;
  let leftPadSample = null;
  try {
    const leftPad = require('left-pad');
    leftPadSample = leftPad('hi', 5, ' ');
    leftPadWorks = leftPadSample === '   hi';
  } catch {
    leftPadWorks = false;
  }

  return {
    ok: nodeModulesIsSymlink && leftPadWorks,
    nodeModulesIsSymlink,
    nodeModulesTarget,
    leftPadWorks,
    leftPadSample,
    manifestHash: computeLocalManifestHash(),
    port: Number(process.env.PORT) || DEFAULT_PORT,
    moduleDirectory: MODULE_ROOT,
    timestamp: new Date().toISOString(),
  };
}

const app = express();
const listenPort = Number(process.env.PORT) || DEFAULT_PORT;

app.use(express.static(path.join(MODULE_ROOT, 'public')));

app.get('/api/diagnostics', (_request, response) => {
  response.json(buildDiagnosticsPayload());
});

app.get('/', (_request, response) => {
  response.sendFile(path.join(MODULE_ROOT, 'public', 'index.html'));
});

app.listen(listenPort, '127.0.0.1', () => {
  // eslint-disable-next-line no-console -- module bootstrap log
  console.log(`package-cache-test listening on 127.0.0.1:${listenPort}`);
});
