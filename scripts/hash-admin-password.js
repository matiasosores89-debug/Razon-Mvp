const { randomBytes, scryptSync } = require("node:crypto");

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Uso: npm run admin:password -- "UnaContraseñaDeAlMenos8Caracteres"');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);
console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt.toString("hex")}:${hash.toString("hex")}`);
