import type { TotpAlgorithm, TotpSnapshot } from '../types';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const keyCache = new Map<string, Promise<CryptoKey>>();

export function cleanBase32(raw: string): string {
  return raw
    .trim()
    .replace(/[\s\-_]/g, '')
    .replace(/=+$/g, '')
    .toUpperCase();
}

export function isValidBase32(raw: string, minLen = 8): boolean {
  const cleaned = cleanBase32(raw);
  if (cleaned.length < minLen) return false;
  for (let i = 0; i < cleaned.length; i++) {
    if (BASE32_ALPHABET.indexOf(cleaned[i]) === -1) return false;
  }
  return true;
}

export function base32ToBytes(raw: string): Uint8Array {
  const cleaned = cleanBase32(raw);
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) {
      throw new Error(`Invalid Base32 character: ${cleaned[i]}`);
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

export function bytesToBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let result = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return result;
}

function getHmacKey(secret: string, algorithm: TotpAlgorithm): Promise<CryptoKey> {
  const cleaned = cleanBase32(secret);
  const cacheId = `${algorithm}:${cleaned}`;
  const cached = keyCache.get(cacheId);
  if (cached) return cached;

  const keyBytes = base32ToBytes(cleaned);
  // Ensure non-empty key buffer (Web Crypto requires >0 length)
  const safeBytes = keyBytes.length > 0 ? keyBytes : new Uint8Array([0]);
  const buf = safeBytes.buffer.slice(
    safeBytes.byteOffset,
    safeBytes.byteOffset + safeBytes.byteLength
  ) as ArrayBuffer;

  const promise = crypto.subtle.importKey(
    'raw',
    buf,
    { name: 'HMAC', hash: { name: algorithm } },
    false,
    ['sign']
  );

  keyCache.set(cacheId, promise);
  return promise;
}

export async function generateHotp(
  secret: string,
  counter: number,
  digits: 6 | 8 = 6,
  algorithm: TotpAlgorithm = 'SHA-1'
): Promise<string> {
  const key = await getHmacKey(secret, algorithm);
  const counterBuf = new ArrayBuffer(8);
  const view = new DataView(counterBuf);

  const high = Math.floor(counter / 0x100000000);
  const low = counter >>> 0;
  view.setUint32(0, high, false);
  view.setUint32(4, low, false);

  const signature = await crypto.subtle.sign('HMAC', key, counterBuf);
  const hmac = new Uint8Array(signature);
  const offset = hmac[hmac.length - 1] & 0x0f;

  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const mod = digits === 8 ? 100_000_000 : 1_000_000;
  return (binary % mod).toString().padStart(digits, '0');
}

export function getCycleMetrics(nowMs: number, period = 30) {
  const periodMs = period * 1000;
  const cycleIndex = Math.floor(nowMs / periodMs);
  const elapsedMs = nowMs % periodMs;
  const remainingMs = periodMs - elapsedMs;
  const remainingSec = Math.ceil(remainingMs / 1000);
  const progress = Math.max(0, Math.min(1, remainingMs / periodMs));
  return { cycleIndex, remainingMs, remainingSec, progress };
}

export async function computeTotpSnapshot(
  secret: string,
  nowMs: number,
  period = 30,
  digits: 6 | 8 = 6,
  algorithm: TotpAlgorithm = 'SHA-1'
): Promise<TotpSnapshot> {
  const { cycleIndex, remainingMs, remainingSec, progress } = getCycleMetrics(nowMs, period);
  const [code, nextCode] = await Promise.all([
    generateHotp(secret, cycleIndex, digits, algorithm),
    generateHotp(secret, cycleIndex + 1, digits, algorithm),
  ]);

  return {
    code,
    nextCode,
    remainingMs,
    remainingSec,
    progress,
    cycleIndex,
  };
}
