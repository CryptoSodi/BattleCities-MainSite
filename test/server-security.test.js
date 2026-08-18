const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { resolveStaticPath, server } = require('../server/server');

test('static server exposes website assets but not backend or secret files', () => {
  assert.equal(path.basename(resolveStaticPath('/')), 'index.html');
  assert.equal(path.basename(resolveStaticPath('/css/style.css')), 'style.css');
  assert.equal(resolveStaticPath('/.env'), null);
  assert.equal(resolveStaticPath('/server/config.js'), null);
  assert.equal(resolveStaticPath('/css/%2e%2e/.env'), null);
  assert.equal(resolveStaticPath('/node_modules/@solana/web3.js/lib/index.js'), null);
});

test('API serves live state while protected files remain unreachable', async () => {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    const { port } = server.address();
    const stateResponse = await fetch(`http://127.0.0.1:${port}/api/presale/state`);
    const state = await stateResponse.json();
    assert.equal(stateResponse.status, 200);
    assert.equal(state.network, 'mainnet-beta');
    assert.equal(state.targetUsd, '3025');

    const secretResponse = await fetch(`http://127.0.0.1:${port}/.env`);
    assert.notEqual(secretResponse.status, 200);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
