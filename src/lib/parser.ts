import type { ParsedEntry, TotpAlgorithm, VaultAccount } from '../types';
import { bytesToBase32, cleanBase32, isValidBase32 } from './totp';

function makeId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `z2fa-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeAlgorithm(raw?: string | null): TotpAlgorithm {
  const upper = (raw || 'SHA1').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (upper === 'SHA256') return 'SHA-256';
  if (upper === 'SHA512') return 'SHA-512';
  return 'SHA-1';
}

/**
 * Parse standard otpauth://totp/Issuer:Label?secret=...&issuer=...
 */
export function parseOtpAuthUri(uri: string): ParsedEntry | null {
  try {
    const trimmed = uri.trim();
    if (!trimmed.toLowerCase().startsWith('otpauth://')) return null;

    const url = new URL(trimmed);
    const type = url.hostname.toLowerCase();
    if (type !== 'totp' && type !== 'hotp') return null;

    const secretParam = url.searchParams.get('secret');
    if (!secretParam || !isValidBase32(secretParam, 8)) return null;

    const rawPath = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
    let pathIssuer = '';
    let label = rawPath;

    if (rawPath.includes(':')) {
      const idx = rawPath.indexOf(':');
      pathIssuer = rawPath.slice(0, idx).trim();
      label = rawPath.slice(idx + 1).trim();
    }

    const issuer = (url.searchParams.get('issuer') || pathIssuer || inferIssuerFromLabel(label) || 'Tài khoản').trim();
    const digitsRaw = Number(url.searchParams.get('digits') || 6);
    const digits: 6 | 8 = digitsRaw === 8 ? 8 : 6;
    const periodRaw = Number(url.searchParams.get('period') || 30);
    const period = periodRaw > 0 && periodRaw <= 300 ? periodRaw : 30;
    const algorithm = normalizeAlgorithm(url.searchParams.get('algorithm'));

    return {
      id: makeId(),
      issuer,
      label: label || issuer,
      secret: cleanBase32(secretParam),
      digits,
      period,
      algorithm,
      rawLine: trimmed,
    };
  } catch {
    return null;
  }
}

/**
 * Decode Google Authenticator Export QR: otpauth-migration://offline?data=...
 * Minimal zero-dependency Protobuf wire decoder for MigrationPayload.
 */
export function parseGoogleMigrationUri(uri: string): ParsedEntry[] {
  try {
    const trimmed = uri.trim();
    if (!trimmed.toLowerCase().startsWith('otpauth-migration://')) return [];

    const url = new URL(trimmed);
    const dataB64 = url.searchParams.get('data');
    if (!dataB64) return [];

    const normalizedB64 = dataB64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = normalizedB64.length % 4 === 0 ? '' : '='.repeat(4 - (normalizedB64.length % 4));
    const binStr = atob(normalizedB64 + pad);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);

    const entries: ParsedEntry[] = [];
    let pos = 0;

    const readVarint = (buf: Uint8Array, start: number): [number, number] => {
      let result = 0;
      let shift = 0;
      let idx = start;
      while (idx < buf.length) {
        const b = buf[idx++];
        result |= (b & 0x7f) << shift;
        if ((b & 0x80) === 0) break;
        shift += 7;
      }
      return [result >>> 0, idx];
    };

    while (pos < bytes.length) {
      const [tag, nextPos] = readVarint(bytes, pos);
      pos = nextPos;
      const fieldNo = tag >>> 3;
      const wireType = tag & 0x07;

      if (wireType === 2) {
        const [len, contentPos] = readVarint(bytes, pos);
        const sub = bytes.subarray(contentPos, contentPos + len);
        pos = contentPos + len;

        if (fieldNo === 1) {
          // OtpParameters submessage
          let sPos = 0;
          let secretBytes: Uint8Array | null = null;
          let name = '';
          let issuer = '';
          let algoEnum = 1;
          let digitsEnum = 1;
          let otpType = 2; // 2 = TOTP

          while (sPos < sub.length) {
            const [sTag, sNext] = readVarint(sub, sPos);
            sPos = sNext;
            const sField = sTag >>> 3;
            const sWire = sTag & 0x07;

            if (sWire === 2) {
              const [sLen, sDataPos] = readVarint(sub, sPos);
              const sBytes = sub.subarray(sDataPos, sDataPos + sLen);
              sPos = sDataPos + sLen;

              if (sField === 1) {
                secretBytes = sBytes;
              } else if (sField === 2) {
                name = new TextDecoder().decode(sBytes);
              } else if (sField === 3) {
                issuer = new TextDecoder().decode(sBytes);
              }
            } else if (sWire === 0) {
              const [val, sValNext] = readVarint(sub, sPos);
              sPos = sValNext;
              if (sField === 4) algoEnum = val;
              else if (sField === 5) digitsEnum = val;
              else if (sField === 6) otpType = val;
            } else {
              break;
            }
          }

          if (secretBytes && secretBytes.length > 0 && otpType !== 1) {
            const secret = bytesToBase32(secretBytes);
            let label = name;
            let parsedIssuer = issuer;
            if (name.includes(':') && !parsedIssuer) {
              const idx = name.indexOf(':');
              parsedIssuer = name.slice(0, idx).trim();
              label = name.slice(idx + 1).trim();
            }
            const algorithm: TotpAlgorithm =
              algoEnum === 2 ? 'SHA-256' : algoEnum === 3 ? 'SHA-512' : 'SHA-1';
            const digits: 6 | 8 = digitsEnum === 2 ? 8 : 6;

            entries.push({
              id: makeId(),
              issuer: parsedIssuer || inferIssuerFromLabel(label) || 'Authenticator',
              label: label || parsedIssuer || 'Account',
              secret,
              digits,
              period: 30,
              algorithm,
            });
          }
        }
      } else if (wireType === 0) {
        const [, afterVar] = readVarint(bytes, pos);
        pos = afterVar;
      } else {
        break;
      }
    }

    return entries;
  } catch {
    return [];
  }
}

const KNOWN_BRANDS = [
  'google',
  'gmail',
  'facebook',
  'github',
  'discord',
  'binance',
  'steam',
  'telegram',
  'tiktok',
  'apple',
  'microsoft',
  'outlook',
  'aws',
  'amazon',
  'cloudflare',
  'twitter',
  'instagram',
  'shopee',
  'openai',
  'chatgpt',
  'claude',
  'notion',
  'slack',
  'coinbase',
  'bitwarden',
  'paypal',
  'stripe',
  'linkedin',
  'dropbox',
  'riot',
  'epic',
];

function inferIssuerFromLabel(text: string): string {
  const lower = text.toLowerCase();
  if (lower.endsWith('@gmail.com')) return 'Google';
  if (lower.endsWith('@outlook.com') || lower.endsWith('@hotmail.com')) return 'Microsoft';
  if (lower.endsWith('@icloud.com')) return 'Apple';
  if (/^(1000\d{8,14}|615\d{8,14})$/.test(text.trim())) return 'Facebook';
  if (lower.includes('meta') || lower.includes('fb')) return 'Facebook';

  for (const brand of KNOWN_BRANDS) {
    if (lower.includes(brand)) {
      if (brand === 'gmail') return 'Google';
      if (brand === 'outlook') return 'Microsoft';
      if (brand === 'chatgpt') return 'OpenAI';
      if (brand === 'aws') return 'AWS';
      return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  }
  return '';
}

function looksLikeBase32SecretCandidate(token: string): boolean {
  const trimmed = token.trim();
  if (!trimmed) return false;
  // Reject emails, URLs, pure numeric UIDs
  if (trimmed.includes('@') || trimmed.includes('http://') || trimmed.includes('https://')) {
    return false;
  }
  const cleaned = cleanBase32(trimmed);
  if (/^\d+$/.test(cleaned)) return false;
  // Typical TOTP Base32 secrets are 16..64 chars (allow >= 12 for structured lines, >= 8 if single token)
  if (!isValidBase32(cleaned, 12)) return false;
  return true;
}

/**
 * Smartly parse 1 or multiple lines:
 * - otpauth:// URIs
 * - otpauth-migration:// URIs
 * - Structured lines: UID|PASS|2FA_SECRET|EMAIL, Service: email | SECRET, etc.
 * - Single or spaced Base32 secrets: "JBSW Y3DP EHPK 3PXP"
 */
export function parseSmartInput(input: string): ParsedEntry[] {
  const results: ParsedEntry[] = [];
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];

    // 1. Check otpauth-migration:// anywhere on line
    const migMatch = line.match(/otpauth-migration:\/\/[^\s"']+/i);
    if (migMatch) {
      const migrated = parseGoogleMigrationUri(migMatch[0]);
      if (migrated.length > 0) {
        results.push(...migrated);
        continue;
      }
    }

    // 2. Check otpauth:// anywhere on line
    const otpMatch = line.match(/otpauth:\/\/[^\s"']+/i);
    if (otpMatch) {
      const parsed = parseOtpAuthUri(otpMatch[0]);
      if (parsed) {
        results.push(parsed);
        continue;
      }
    }

    // 3. Check if the entire line itself is a raw/spaced Base32 secret (e.g. "jbsw y3dp ehpk 3pxp")
    if (!/[|:;,\t]/.test(line) && isValidBase32(line, 10) && !/^\d+$/.test(cleanBase32(line))) {
      results.push({
        id: makeId(),
        issuer: 'Quick 2FA',
        label: lines.length > 1 ? `Mã nhanh #${lineIdx + 1}` : 'Mã lấy nhanh',
        secret: cleanBase32(line),
        digits: 6,
        period: 30,
        algorithm: 'SHA-1',
        rawLine: line,
      });
      continue;
    }

    // 4. Structured delimited line: UID|PASS|2FA_SECRET|MAIL or Label: SECRET
    const parts = line
      .split(/[|\t;]+/)
      .flatMap((chunk) => (chunk.includes('|') ? [chunk] : chunk.split(/\s*:\s*|\s*,\s*/)))
      .map((s) => s.trim())
      .filter(Boolean);

    // Pick best Base32 candidate (prefer length 16..64 with mix of letters/2-7)
    let secretIdx = -1;
    let bestScore = -1;

    parts.forEach((part, idx) => {
      if (!looksLikeBase32SecretCandidate(part)) return;
      const cleaned = cleanBase32(part);
      let score = 10;
      if (cleaned.length >= 16 && cleaned.length <= 64) score += 20;
      if (cleaned.length % 8 === 0 || cleaned.length === 16 || cleaned.length === 32) score += 15;
      if (/[2-7]/.test(cleaned)) score += 12;
      // Avoid common English words / simple passwords without 2-7 unless uppercase/spaced
      if (part === part.toUpperCase()) score += 8;
      if (score > bestScore) {
        bestScore = score;
        secretIdx = idx;
      }
    });

    if (secretIdx !== -1) {
      const secret = cleanBase32(parts[secretIdx]);
      const otherParts = parts.filter((_, i) => i !== secretIdx);

      // Identify email, UID, or service name among other parts
      const emailPart = otherParts.find((p) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p));
      const uidPart = otherParts.find((p) => /^\d{6,20}$/.test(p));
      const brandPart = otherParts.find((p) => inferIssuerFromLabel(p) !== '' && p !== emailPart && p !== uidPart);

      const label = emailPart || uidPart || otherParts[0] || `Tài khoản #${lineIdx + 1}`;
      const issuer =
        (brandPart ? inferIssuerFromLabel(brandPart) || brandPart : '') ||
        inferIssuerFromLabel(label) ||
        (uidPart ? 'Account' : 'Quick 2FA');

      results.push({
        id: makeId(),
        issuer,
        label,
        secret,
        digits: 6,
        period: 30,
        algorithm: 'SHA-1',
        rawLine: line,
      });
    }
  }

  return results;
}

export function toOtpAuthUri(account: Pick<VaultAccount, 'issuer' | 'label' | 'secret' | 'digits' | 'period' | 'algorithm'>): string {
  const issuer = account.issuer.trim() || 'Z2FA';
  const label = account.label.trim() || 'Account';
  const path = encodeURIComponent(`${issuer}:${label}`).replace(/%3A/gi, ':');
  const params = new URLSearchParams({
    secret: cleanBase32(account.secret),
    issuer,
    algorithm: account.algorithm.replace('-', ''),
    digits: String(account.digits),
    period: String(account.period),
  });
  return `otpauth://totp/${path}?${params.toString()}`;
}
