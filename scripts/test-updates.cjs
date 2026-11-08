'use strict';

const assert = require('node:assert/strict');
const { createHash, generateKeyPairSync, sign } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const source = fs.readFileSync(path.join(__dirname, '../shared/update.cjs'), 'utf8')
  .replace("'__YMC_UPDATE_PUBLIC_KEY__'", JSON.stringify(publicKey.export({ type: 'spki', format: 'pem' })));
const archive = Buffer.from('test archive');
const hash = createHash('sha256').update(archive).digest('hex');
const manifest = Buffer.from(JSON.stringify({ version: '0.7.1', sha256: { win32: hash }, notes: 'Проверка' }));
const signature = sign('sha256', manifest, privateKey);
const files = { 'update.json': manifest, 'update.sig': signature, 'YMusic-Customizer-Windows.zip': archive };
const handlers = new Map();
const commands = [];
let relaunches = 0;

const sandbox = {
  require(name) {
    if (name === 'node:child_process') {
      return { execFile(exe, args, options, callback) {
        commands.push({ exe, args, options });
        callback(null, '', '');
      } };
    }
    return require(name);
  },
  module: { exports: {} }, Buffer, AbortSignal,
  process: { platform: 'win32', env: {} },
  setTimeout: callback => callback(),
  fetch: async url => new Response(files[url.split('/').pop()])
};
vm.runInNewContext(source, sandbox);
sandbox.module.exports.attachUpdater(
  { getPath: () => os.tmpdir(), relaunch: () => relaunches++, quit() {} },
  { handle: (name, handler) => handlers.set(name, handler) },
  event => event === 'trusted'
);

async function main() {
  const check = handlers.get('ymc:update:check');
  const install = handlers.get('ymc:update:install');
  assert.ok((await check('outside')).error);
  assert.ok((await install('trusted')).error);
  files['update.json'] = Buffer.from(manifest.toString().replace('0.7.1', '0.9.0'));
  assert.ok((await check('trusted')).error, 'edited manifest must be rejected');
  files['update.json'] = manifest;
  assert.equal((await check('trusted')).available, true);
  assert.ok((await install('outside')).error);
  files['YMusic-Customizer-Windows.zip'] = Buffer.from('replaced archive');
  assert.match((await install('trusted')).error, /Контрольная сумма/);
  assert.equal(commands.length, 0);
  files['YMusic-Customizer-Windows.zip'] = archive;
  assert.equal((await install('trusted')).restarting, true);
  assert.equal(commands.length, 2);
  assert.ok(commands[0].options.env.YMC_UPDATE_ZIP.endsWith('YMusic-Customizer-Windows.zip'));
  assert.ok(commands[1].args.at(-1).endsWith('scripts/install.ps1'));
  assert.equal(relaunches, 1);
  assert.ok((await install('trusted')).error);
  console.log('PASS: signed update, rejected modified manifest and package, IPC permissions, installation dispatch');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
