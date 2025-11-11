// generate-keys.js
const crypto = require('crypto');

console.log('\n🔐 Vista Security Keys - کپی کن و در .env.local قرار بده:\n');
console.log('─'.repeat(70));
console.log(`JWT_SECRET=${crypto.randomBytes(64).toString('hex')}`);
console.log(`ENCRYPTION_KEY=${crypto.randomBytes(32).toString('base64').slice(0, 32)}`);
console.log(`CSRF_SECRET=${crypto.randomBytes(64).toString('hex')}`);
console.log('─'.repeat(70));
console.log('\n✅ حالا این خط‌ها رو کپی کن!\n');
