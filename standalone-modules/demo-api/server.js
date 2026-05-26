const express = require('express');
const app = express();
app.get('/', (_req, res) => res.json({ module: 'demo-api', status: 'ok' }));
app.get('/health', (_req, res) => res.json({ healthy: true }));
app.listen(3000, () => console.log('demo-api on 3000'));
