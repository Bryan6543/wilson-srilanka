// scrypt password hashing (Node built-in, memory-hard). Format:
//   scrypt:<N>:<r>:<p>:<salt base64url>:<hash base64url>  (no "$", so .env expansion cannot mangle it)
// Relative imports only — also used by scripts/hash-password.ts.
import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

const scrypt = (password: string, salt: Buffer, keylen: number, opts: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCb(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))),
  );

const PARAMS = { N: 2 ** 15, r: 8, p: 1 };
const KEYLEN = 64;
const maxmem = 128 * PARAMS.N * PARAMS.r * 2;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, { ...PARAMS, maxmem });
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64url"), key.toString("base64url")].join(":");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts as [string, string, string, string, string, string];
  const N = Number(n);
  const R = Number(r);
  const P = Number(p);
  if (![N, R, P].every((x) => Number.isInteger(x) && x > 0) || N > 2 ** 20) return false;
  const expected = Buffer.from(hashB64, "base64url");
  const key = await scrypt(password, Buffer.from(saltB64, "base64url"), expected.length, {
    N,
    r: R,
    p: P,
    maxmem: 128 * N * R * 2,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}
