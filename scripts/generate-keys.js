#!/usr/bin/env node
/* eslint-disable no-console */

const crypto = require('crypto');

function generateHex(bytes) {
  return crypto.randomBytes(bytes).toString('hex');
}

function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
}

console.log('🔐 Vista Security Keys\n');
console.log(`JWT_SECRET=${generateHex(64)}`);
console.log(`ENCRYPTION_KEY=${generateEncryptionKey()}`);
console.log(`CSRF_SECRET=${generateHex(64)}`);

