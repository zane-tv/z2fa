import React from 'react';
import { ShieldCheck } from 'lucide-react';

export interface BrandVisual {
  key: string;
  name: string;
  accentHex: string;
  plateClass: string;
  icon: React.ReactNode;
}

const BRAND_DEFS: Array<{
  match: RegExp;
  key: string;
  name: string;
  accentHex: string;
  plateClass: string;
  svg: React.ReactNode;
}> = [
  {
    match: /google|gmail|youtube/i,
    key: 'google',
    name: 'Google',
    accentHex: '#4285F4',
    plateClass: 'bg-[#fdfcfc] border border-[#ebe8e4] dark:bg-[#22201d] dark:border-[#2f2c28]',
    svg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path
          d="M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.35Z"
          fill="#4285F4"
        />
        <path
          d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.5c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.58A9.99 9.99 0 0 0 12 22Z"
          fill="#34A853"
        />
        <path
          d="M6.41 13.92A6.02 6.02 0 0 1 6.1 12c0-.67.11-1.31.31-1.92V7.5H3.07A9.99 9.99 0 0 0 2 12c0 1.61.39 3.14 1.07 4.5l3.34-2.58Z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 2.98 14.7 2 12 2 8.09 2 4.71 4.24 3.07 7.5l3.34 2.58C7.2 7.72 9.4 5.96 12 5.96Z"
          fill="#EA4335"
        />
      </svg>
    ),
  },
  {
    match: /github/i,
    key: 'github',
    name: 'GitHub',
    accentHex: '#24292F',
    plateClass: 'bg-[#fdfcfc] border border-[#ebe8e4] dark:bg-[#22201d] dark:border-[#2f2c28]',
    svg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#181717] dark:text-[#fdfcfc]" fill="currentColor">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"
        />
      </svg>
    ),
  },
  {
    match: /facebook|meta|fb/i,
    key: 'facebook',
    name: 'Facebook',
    accentHex: '#1877F2',
    plateClass: 'bg-[#1877F2]/10 border border-[#1877F2]/20',
    svg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#1877F2]" fill="currentColor">
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12Z" />
      </svg>
    ),
  },
  {
    match: /binance|bnb/i,
    key: 'binance',
    name: 'Binance',
    accentHex: '#F0B90B',
    plateClass: 'bg-[#F0B90B]/14 border border-[#F0B90B]/30',
    svg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#D99B00] dark:text-[#F3BA2F]" fill="currentColor">
        <path d="M12 3 8.15 6.85l2.2 2.2L12 7.4l1.65 1.65 2.2-2.2L12 3Zm-6.8 6.8L3 12l2.2 2.2L7.4 12 5.2 9.8Zm13.6 0L16.6 12l2.2 2.2L21 12l-2.2-2.2ZM12 9.8 9.8 12l2.2 2.2 2.2-2.2L12 9.8Zm-1.65 5.15-2.2 2.2L12 21l3.85-3.85-2.2-2.2L12 16.6l-1.65-1.65Z" />
      </svg>
    ),
  },
  {
    match: /discord/i,
    key: 'discord',
    name: 'Discord',
    accentHex: '#5865F2',
    plateClass: 'bg-[#5865F2]/10 border border-[#5865F2]/20',
    svg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#5865F2]" fill="currentColor">
        <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.22.17.33.26.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.68 1.19 1.07 1.74.03.01.06.02.09.01 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.04-.02ZM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12Zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12Z" />
      </svg>
    ),
  },
  {
    match: /openai|chatgpt/i,
    key: 'openai',
    name: 'OpenAI',
    accentHex: '#10A37F',
    plateClass: 'bg-[#10A37F]/10 border border-[#10A37F]/22',
    svg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#10A37F]" fill="none" stroke="currentColor" strokeWidth="1.85">
        <circle cx="12" cy="12" r="8.5" strokeOpacity="0.35" />
        <path d="M12 5.5 17.5 8.7v6.6L12 18.5 6.5 15.3V8.7L12 5.5Z" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    match: /telegram/i,
    key: 'telegram',
    name: 'Telegram',
    accentHex: '#26A5E4',
    plateClass: 'bg-[#26A5E4]/10 border border-[#26A5E4]/22',
    svg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#26A5E4]" fill="currentColor">
        <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434Z" />
      </svg>
    ),
  },
  {
    match: /apple|icloud/i,
    key: 'apple',
    name: 'Apple',
    accentHex: '#000000',
    plateClass: 'bg-[#fdfcfc] border border-[#ebe8e4] dark:bg-[#22201d] dark:border-[#2f2c28]',
    svg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#000000] dark:text-[#fdfcfc]" fill="currentColor">
        <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43Zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45Z" />
      </svg>
    ),
  },
  {
    match: /microsoft|outlook|azure|xbox/i,
    key: 'microsoft',
    name: 'Microsoft',
    accentHex: '#00A4EF',
    plateClass: 'bg-[#fdfcfc] border border-[#ebe8e4] dark:bg-[#22201d] dark:border-[#2f2c28]',
    svg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <rect x="3" y="3" width="8.3" height="8.3" rx="1.1" fill="#F25022" />
        <rect x="12.7" y="3" width="8.3" height="8.3" rx="1.1" fill="#7FBA00" />
        <rect x="3" y="12.7" width="8.3" height="8.3" rx="1.1" fill="#00A4EF" />
        <rect x="12.7" y="12.7" width="8.3" height="8.3" rx="1.1" fill="#FFB900" />
      </svg>
    ),
  },
  {
    match: /cloudflare/i,
    key: 'cloudflare',
    name: 'Cloudflare',
    accentHex: '#F6821F',
    plateClass: 'bg-[#F6821F]/12 border border-[#F6821F]/24',
    svg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#F6821F]" fill="currentColor">
        <path d="M16.5 17.5H6.2a3.7 3.7 0 0 1-.4-7.38A5.5 5.5 0 0 1 16.4 8.6a4.5 4.5 0 0 1 .1 8.9Z" />
      </svg>
    ),
  },
  {
    match: /steam|valve/i,
    key: 'steam',
    name: 'Steam',
    accentHex: '#00ADEE',
    plateClass: 'bg-[#00ADEE]/12 border border-[#00ADEE]/24',
    svg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#0088CC] dark:text-[#66C0F4]" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="15.5" cy="8.5" r="3.2" />
        <circle cx="8.5" cy="15.5" r="2.5" />
        <path d="m13.2 10.8-2.9 2.9" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    match: /aws|amazon/i,
    key: 'aws',
    name: 'AWS',
    accentHex: '#FF9900',
    plateClass: 'bg-[#FF9900]/12 border border-[#FF9900]/26',
    svg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#E88300] dark:text-[#FF9900]" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3 4.5 7.2v9.6L12 21l7.5-4.2V7.2L12 3Z" strokeLinejoin="round" />
        <path d="M4.5 7.2 12 11.4l7.5-4.2M12 11.4V21" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    match: /twitter|\bx\b/i,
    key: 'x',
    name: 'X',
    accentHex: '#000000',
    plateClass: 'bg-[#fdfcfc] border border-[#ebe8e4] dark:bg-[#22201d] dark:border-[#2f2c28]',
    svg: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#000000] dark:text-[#fdfcfc]" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    match: /tiktok/i,
    key: 'tiktok',
    name: 'TikTok',
    accentHex: '#FE2C55',
    plateClass: 'bg-[#FE2C55]/10 border border-[#FE2C55]/22',
    svg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#FE2C55]" fill="currentColor">
        <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" />
      </svg>
    ),
  },
  {
    match: /shopee/i,
    key: 'shopee',
    name: 'Shopee',
    accentHex: '#EE4D2D',
    plateClass: 'bg-[#EE4D2D]/10 border border-[#EE4D2D]/22',
    svg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#EE4D2D]" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 8h14l-1.2 12H6.2L5 8Z" strokeLinejoin="round" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
      </svg>
    ),
  },
];

const FALLBACK_COLORS = [
  { hex: '#0447ff', plate: 'bg-[#0447ff]/10 border border-[#0447ff]/20', text: 'text-[#0447ff]' },
  { hex: '#10B981', plate: 'bg-[#10B981]/12 border border-[#10B981]/24', text: 'text-[#059669]' },
  { hex: '#ff4704', plate: 'bg-[#ff4704]/10 border border-[#ff4704]/22', text: 'text-[#ff4704]' },
  { hex: '#8B5CF6', plate: 'bg-[#8B5CF6]/10 border border-[#8B5CF6]/22', text: 'text-[#7C3AED]' },
];

export function resolveBrandVisual(issuer: string, label = ''): BrandVisual {
  const combined = `${issuer} ${label}`.trim();

  for (const def of BRAND_DEFS) {
    if (def.match.test(combined)) {
      return {
        key: def.key,
        name: def.name,
        accentHex: def.accentHex,
        plateClass: def.plateClass,
        icon: def.svg,
      };
    }
  }

  const cleanName = (issuer || label || 'Z').trim();
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = (hash * 31 + cleanName.charCodeAt(i)) >>> 0;
  }
  const fb = FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
  const initials = cleanName
    .split(/[\s._@-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  return {
    key: 'custom',
    name: cleanName,
    accentHex: fb.hex,
    plateClass: fb.plate,
    icon: initials ? (
      <span className={`font-mono-tabular text-[11px] font-semibold tracking-tight ${fb.text}`}>
        {initials}
      </span>
    ) : (
      <ShieldCheck className={`h-[18px] w-[18px] ${fb.text}`} />
    ),
  };
}
