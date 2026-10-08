import "server-only";
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// scrypt with the OWASP-recommended cost (N=2^17, r=8, p=1): memory-hard, built into Node.
const COST = 2 ** 17;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const PREFIX = "scrypt";

function deriveKey(password: string, salt: Buffer, options: ScryptOptions, keyLength: number): Promise<Buffer> {
  // maxmem must cover 128 * N * r bytes (128 MiB with the defaults above).
  const maxmem = 256 * (options.N ?? COST) * (options.r ?? BLOCK_SIZE);
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, keyLength, { ...options, maxmem }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/** Hashes a password as "scrypt$N$r$p$salt$key" (base64), so the cost can be raised later. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt, { N: COST, r: BLOCK_SIZE, p: PARALLELIZATION }, KEY_LENGTH);
  return [PREFIX, COST, BLOCK_SIZE, PARALLELIZATION, salt.toString("base64"), key.toString("base64")].join("$");
}

/** Checks a password against a stored hash in constant time. A malformed hash never matches. */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [prefix, cost, blockSize, parallelization, salt, key] = storedHash.split("$");
  if (prefix !== PREFIX || !salt || !key) return false;

  const expected = Buffer.from(key, "base64");
  const options = { N: Number(cost), r: Number(blockSize), p: Number(parallelization) };
  if (!Number.isInteger(options.N) || !Number.isInteger(options.r) || !Number.isInteger(options.p)) return false;

  const actual = await deriveKey(password, Buffer.from(salt, "base64"), options, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

let dummyHash: Promise<string> | undefined;

/**
 * Spends the same time as a real check when the email does not exist, so response times do not
 * reveal which emails have an account.
 */
export async function verifyPasswordAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword("dummy-password-for-timing");
  await verifyPassword(password, await dummyHash);
  return false;
}
