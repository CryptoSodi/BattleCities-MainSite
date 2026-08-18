const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { loadConfig } = require('./config');
const { PresaleService } = require('./presale-service');
const { PurchaseStore } = require('./store');

const root = path.resolve(__dirname, '..');
const config = loadConfig();
const service = new PresaleService(config, new PurchaseStore(config.ledgerPath));
const MAX_BODY_BYTES = 16 * 1024;
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function corsHeaders(request) {
  const origin = request.headers.origin;
  if (!origin || !config.allowedOrigins.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    Vary: 'Origin',
  };
}

function sendJson(response, status, value, extraHeaders = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });
  response.end(JSON.stringify(value));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('Request body is too large.');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw new Error('Request body must be valid JSON.');
  }
}

async function api(request, response, pathname) {
  const cors = corsHeaders(request);
  if (request.method === 'OPTIONS') {
    response.writeHead(204, cors);
    return response.end();
  }

  try {
    if (pathname === '/api/presale/state' && request.method === 'GET') {
      return sendJson(response, 200, await service.state(), cors);
    }
    if (pathname === '/api/presale/quote' && request.method === 'POST') {
      return sendJson(response, 200, await service.createQuote(await readJson(request)), cors);
    }
    if (pathname === '/api/presale/verify' && request.method === 'POST') {
      return sendJson(response, 200, await service.verifyPurchase(await readJson(request)), cors);
    }
    return sendJson(response, 404, { error: 'API route not found.' }, cors);
  } catch (error) {
    const clientMessage = error.message || 'Presale request failed.';
    const status = /not configured|has ended|sold out|invalid|valid|required|greater|remain|expired|missing|does not match|already/.test(clientMessage.toLowerCase()) ? 400 : 502;
    console.error(request.method, pathname, error);
    return sendJson(response, status, { error: clientMessage }, cors);
  }
}

function resolveStaticPath(pathname) {
  let requested;
  try {
    requested = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  } catch {
    return null;
  }
  const publicPath = requested === '/index.html'
    || requested === '/whitepaper.html'
    || requested === '/output/pdf/battle-cities-whitepaper-v0.4.pdf'
    || requested === '/test.html'
    || ['/css/', '/js/', '/images/'].some(prefix => requested.startsWith(prefix));
  if (!publicPath || requested.split('/').some(segment => segment.startsWith('.'))) {
    return null;
  }
  const filePath = path.resolve(root, `.${requested}`);
  return filePath.startsWith(`${root}${path.sep}`) ? filePath : null;
}

function staticFile(response, pathname) {
  const filePath = resolveStaticPath(pathname);
  if (!filePath) {
    response.writeHead(403);
    return response.end('Forbidden');
  }
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      response.writeHead(404);
      return response.end('Not found');
    }
    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    fs.createReadStream(filePath).pipe(response);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/presale/')) return api(request, response, url.pathname);
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405);
    return response.end('Method not allowed');
  }
  return staticFile(response, url.pathname);
});

if (require.main === module) {
  server.listen(config.port, () => {
    console.log(`BattleCities presale server: http://localhost:${config.port}`);
    console.log(`Solana network: ${config.network}`);
    console.log(`Presale configured: ${service.isConfigured() ? 'yes' : 'no'}`);
  });
}

module.exports = { resolveStaticPath, server };
