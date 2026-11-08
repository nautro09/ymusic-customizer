'use strict';

const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { trackData, activityFor } = require('./ymc-discord-activity.cjs');

const ID = /^\d{15,22}$/;
const MAX_FRAME = 1024 * 1024;
const OFF = { discordRpc: false, discordClientId: '', discordShowPaused: false, discordShowAlbum: false };

function settings(value) {
  if (typeof value?.discordRpc !== 'boolean' || typeof value.discordShowPaused !== 'boolean' ||
      typeof value.discordClientId !== 'string') return null;
  const discordClientId = value.discordClientId.trim();
  if ((value.discordRpc || discordClientId) && !ID.test(discordClientId)) return null;
  return { discordClientId, discordRpc: value.discordRpc, discordShowPaused: value.discordShowPaused,
    discordShowAlbum: value.discordShowAlbum === true };
}

function frame(opcode, body) {
  const bytes = Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body));
  const header = Buffer.alloc(8);
  header.writeUInt32LE(opcode);
  header.writeUInt32LE(bytes.length, 4);
  return Buffer.concat([header, bytes]);
}

function socketPaths() {
  const prefixes = new Set([process.env.XDG_RUNTIME_DIR, process.env.TMPDIR, process.env.TMP,
    process.env.TEMP, os.tmpdir(), '/tmp'].filter(value => value && path.isAbsolute(value)).map(p => path.resolve(p)));
  return [...prefixes].flatMap(prefix => Array.from({ length: 10 }, (_, i) => path.join(prefix, `discord-ipc-${i}`)))
    .filter(name => {
      try {
        const stat = fs.statSync(name);
        return stat.isSocket() && stat.uid === process.getuid();
      } catch { return false; }
    });
}

class DiscordPresence {
  constructor(configFile) {
    this.configFile = configFile;
    this.config = OFF;
    try { this.config = settings(JSON.parse(fs.readFileSync(configFile, 'utf8'))) || OFF; }
    catch { /* First launch or an invalid config. */ }
    this.status = this.config.discordRpc ? 'connecting' : 'off';
    this.socket = null;
    this.track = null;
    this.sent = undefined;
    this.nextRetry = 0;
  }

  state() { return { config: this.config, discord: this.status }; }

  configure(value) {
    const config = settings(value);
    if (!config) return { ok: false };
    const pending = `${this.configFile}.${randomUUID()}.tmp`;
    try {
      fs.writeFileSync(pending, JSON.stringify(config), { mode: 0o600, flag: 'wx' });
      fs.renameSync(pending, this.configFile);
    } finally {
      fs.rmSync(pending, { force: true });
    }
    if (this.config.discordClientId !== config.discordClientId || !config.discordRpc) this.close();
    this.config = config;
    this.nextRetry = 0;
    if (config.discordRpc) this.tick();
    else this.status = 'off';
    return { ok: true, discord: this.status };
  }

  report(value) {
    const next = trackData(value);
    const old = this.track;
    if (next && old && next.title === old.title && next.artist === old.artist && next.url === old.url && next.playing === old.playing &&
        next.start && old.start && Math.abs(next.start - old.start) < 4000 && Math.abs(next.end - old.end) < 4000) {
      next.start = old.start;
      next.end = old.end;
    }
    this.track = next;
    this.update();
  }

  tick() {
    if (!this.config.discordRpc) return;
    if (this.socket) { this.update(); return; }
    if (Date.now() < this.nextRetry) return;
    this.nextRetry = Date.now() + 12_000;
    this.connect(socketPaths());
  }

  connect(paths) {
    const socketPath = paths.shift();
    if (!socketPath) { this.status = 'no-discord'; return; }
    const socket = net.createConnection(socketPath);
    this.socket = socket;
    this.status = 'connecting';
    this.sent = undefined;
    let buffer = Buffer.alloc(0);
    let connected = false;
    let rejected = false;
    const timeout = setTimeout(() => socket.destroy(), 4000).unref();
    socket.once('connect', () => {
      connected = true;
      socket.write(frame(0, { v: 1, client_id: this.config.discordClientId }));
    });
    socket.on('data', chunk => {
      if (this.socket !== socket) return;
      buffer = Buffer.concat([buffer, chunk]);
      while (buffer.length >= 8) {
        const opcode = buffer.readUInt32LE(0);
        const size = buffer.readUInt32LE(4);
        if (size > MAX_FRAME) { socket.destroy(); return; }
        if (buffer.length < size + 8) return;
        const body = buffer.subarray(8, 8 + size);
        buffer = buffer.subarray(8 + size);
        if (opcode === 3) { socket.write(frame(4, body)); continue; }
        if (opcode === 2) { rejected = this.status !== 'connected'; socket.destroy(); return; }
        if (opcode !== 1) continue;
        let message;
        try { message = JSON.parse(body); } catch { socket.destroy(); return; }
        if (message?.cmd === 'DISPATCH' && message.evt === 'READY') {
          clearTimeout(timeout);
          this.status = 'connected';
          this.update();
        } else if (message?.evt === 'ERROR') {
          rejected = true;
          socket.destroy();
          return;
        }
      }
    });
    socket.on('error', () => {});
    socket.once('close', () => {
      clearTimeout(timeout);
      if (this.socket !== socket) return;
      this.socket = null;
      this.nextRetry = Date.now() + 12_000;
      if (rejected) this.status = 'error';
      else if (!connected && paths.length) this.connect(paths);
      else this.status = 'no-discord';
    });
  }

  update() {
    if (this.status !== 'connected' || !this.socket || !this.config.discordRpc) return;
    const activity = activityFor(this.track, {
      showPaused: this.config.discordShowPaused,
      showAlbum: this.config.discordShowAlbum
    });
    const key = JSON.stringify(activity);
    if (key === this.sent || (this.sent === undefined && !activity)) return;
    this.sent = key;
    this.socket.write(frame(1, { cmd: 'SET_ACTIVITY', nonce: randomUUID(), args: { pid: process.pid, activity } }));
  }

  close() {
    const socket = this.socket;
    const clear = this.status === 'connected' && this.sent !== undefined && this.sent !== 'null';
    this.socket = null;
    this.sent = undefined;
    this.status = 'off';
    if (!socket) return;
    if (clear && socket.writable) {
      socket.end(frame(1, { cmd: 'SET_ACTIVITY', nonce: randomUUID(), args: { pid: process.pid, activity: null } }));
      setTimeout(() => socket.destroy(), 250).unref();
    } else socket.destroy();
  }
}

module.exports = { DiscordPresence };
