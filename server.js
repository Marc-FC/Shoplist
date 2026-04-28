import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env.local explicitly
const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '.env.local');
dotenv.config({ path: envPath });
console.log('Loading env from:', envPath);
console.log('ANTHROPIC_API_KEY available:', !!process.env.ANTHROPIC_API_KEY);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Importar el handler de readLabel
const readLabelModule = await import('./api/readLabel.js');
const readLabelHandler = readLabelModule.default;

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Express-like methods for compatibility
  res.status = function(code) {
    res.statusCode = code;
    return this;
  };
  res.json = function(data) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
    return this;
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/readLabel') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        req.body = JSON.parse(body);
        console.log('Request received, processing...');
        await readLabelHandler(req, res);
      } catch (error) {
        console.error('Server error:', error.message, error.stack);
        if (!res.headersSent) {
          res.status(500).json({ error: error.message || 'Internal server error' });
        }
      }
    });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

server.listen(PORT, () => {
  console.log(`✅ API Server running on http://localhost:${PORT}`);
  console.log(`   Endpoint: POST http://localhost:${PORT}/api/readLabel`);
});
