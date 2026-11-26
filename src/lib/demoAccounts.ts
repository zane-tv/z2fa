import type { VaultAccount } from '../types';

export function createDemoAccounts(): VaultAccount[] {
  const now = Date.now();
  return [
    {
      id: 'demo-google',
      issuer: 'Google',
      label: 'minh.anh@gmail.com',
      secret: 'JBSWY3DPEHPK3PXP',
      digits: 6,
      period: 30,
      algorithm: 'SHA-1',
      pinned: true,
      tags: ['Công việc', 'Cá nhân'],
      isDemo: true,
      createdAt: now - 6000,
    },
    {
      id: 'demo-github',
      issuer: 'GitHub',
      label: '@alex-nguyen',
      secret: 'GEZDGNBVGY3TQOJQGEZDGNBV',
      digits: 6,
      period: 30,
      algorithm: 'SHA-1',
      pinned: true,
      tags: ['Dev', 'Công việc'],
      isDemo: true,
      createdAt: now - 5000,
    },
    {
      id: 'demo-binance',
      issuer: 'Binance',
      label: 'spot.wallet@proton.me',
      secret: 'MFRGGZDFMZTWQ2LKNNWG23Q',
      digits: 6,
      period: 30,
      algorithm: 'SHA-1',
      pinned: false,
      tags: ['Tài chính'],
      isDemo: true,
      createdAt: now - 4000,
    },
    {
      id: 'demo-facebook',
      issuer: 'Facebook',
      label: '10008942105824',
      secret: 'KRSXG5CTMVRXEZLUKN2XAZLS',
      digits: 6,
      period: 30,
      algorithm: 'SHA-1',
      pinned: false,
      tags: ['Mạng xã hội'],
      isDemo: true,
      createdAt: now - 3000,
    },
    {
      id: 'demo-openai',
      issuer: 'OpenAI',
      label: 'team@devlab.vn',
      secret: 'ONSWG4TFOQQHI2LPNZSXK43U',
      digits: 6,
      period: 30,
      algorithm: 'SHA-1',
      pinned: false,
      tags: ['Dev', 'AI'],
      isDemo: true,
      createdAt: now - 2000,
    },
    {
      id: 'demo-discord',
      issuer: 'Discord',
      label: 'nova.studio#2026',
      secret: 'ORSXG5BAMN2W64TFOQ2G643U',
      digits: 6,
      period: 30,
      algorithm: 'SHA-1',
      pinned: false,
      tags: ['Mạng xã hội'],
      isDemo: true,
      createdAt: now - 1000,
    },
  ];
}

export const SAMPLE_BULK_INPUT = `Google | minh.khoa@gmail.com | JBSWY3DPEHPK3PXP
10009482716352|PassDemo@2026|KRSXG5CTMVRXEZLUKN2XAZLS|ads.meta@devlab.vn
otpauth://totp/GitHub:alex-nguyen?secret=GEZDGNBVGY3TQOJQGEZDGNBV&issuer=GitHub`;
