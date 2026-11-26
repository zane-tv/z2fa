export type TotpAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-512';

export interface VaultAccount {
  id: string;
  issuer: string;
  label: string;
  secret: string;
  digits: 6 | 8;
  period: number;
  algorithm: TotpAlgorithm;
  pinned?: boolean;
  tags?: string[];
  isDemo?: boolean;
  createdAt: number;
}

export interface ParsedEntry {
  id: string;
  issuer: string;
  label: string;
  secret: string;
  digits: 6 | 8;
  period: number;
  algorithm: TotpAlgorithm;
  rawLine?: string;
}

export interface TotpSnapshot {
  code: string;
  nextCode: string;
  remainingMs: number;
  remainingSec: number;
  progress: number; // 1.0 -> 0.0
  cycleIndex: number;
}

export interface EncryptedVaultPayload {
  version: 1;
  encrypted: true;
  salt: string;
  iv: string;
  ciphertext: string;
  updatedAt: number;
}

export interface Z2FABackupFile {
  app: 'Z2FA';
  version: 1;
  exportedAt: string;
  encrypted: boolean;
  accounts?: VaultAccount[];
  vault?: EncryptedVaultPayload;
}

export type Language = 'vi' | 'en';
export type ThemeMode = 'dark' | 'light';

export interface IslandToast {
  id: string;
  title: string;
  subtitle?: string;
  code?: string;
  variant: 'copied' | 'smart-next' | 'info' | 'warning' | 'error';
}
