import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Copy, MoreHorizontal, Pencil, Pin, QrCode, Trash2 } from 'lucide-react';
import type { TotpSnapshot, VaultAccount } from '../types';
import type { TranslationDict } from '../lib/i18n';
import { resolveBrandVisual } from '../lib/brands';
import { OdometerCode } from './OdometerCode';
import { CircularTimerBadge, PerimeterCountdown } from './PerimeterCountdown';

interface TotpCardProps {
  account: VaultAccount;
  snapshot: TotpSnapshot | undefined;
  t: TranslationDict;
  onSmartCopy: (account: VaultAccount, snapshot: TotpSnapshot) => void;
  onTogglePin: (id: string) => void;
  onShowQr: (account: VaultAccount) => void;
  onEdit: (account: VaultAccount) => void;
  onDelete: (account: VaultAccount) => void;
}

export const TotpCard: React.FC<TotpCardProps> = React.memo(
  ({ account, snapshot, t, onSmartCopy, onTogglePin, onShowQr, onEdit, onDelete }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [copiedState, setCopiedState] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [ripple, setRipple] = useState<{ x: number; y: number; key: number } | null>(null);
    const copyTimerRef = useRef<number | null>(null);

    const brand = resolveBrandVisual(account.issuer, account.label);

    const code = snapshot?.code ?? '000000';
    const nextCode = snapshot?.nextCode ?? '000000';
    const remainingSec = snapshot?.remainingSec ?? 30;
    const progress = snapshot?.progress ?? 1;
    const showNextPreview = remainingSec <= 5;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
      el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
    };

    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!snapshot) return;
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
        return;
      }
      const el = cardRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        setRipple({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          key: Date.now(),
        });
      }

      navigator.vibrate?.(12);
      onSmartCopy(account, snapshot);
      setCopiedState(true);
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopiedState(false), 1600);
    };

    const formatSpaced = (raw: string) => {
      const half = Math.ceil(raw.length / 2);
      return `${raw.slice(0, half)} ${raw.slice(half)}`;
    };

    return (
      <motion.article
        ref={cardRef}
        layout
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.16 } }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.985 }}
        transition={{
          layout: { type: 'spring', stiffness: 400, damping: 34 },
          opacity: { duration: 0.2 },
          y: { type: 'spring', stiffness: 420, damping: 30 },
        }}
        onMouseMove={handleMouseMove}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && snapshot) {
            e.preventDefault();
            onSmartCopy(account, snapshot);
            setCopiedState(true);
            if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
            copyTimerRef.current = window.setTimeout(() => setCopiedState(false), 1600);
          }
        }}
        className="group relative cursor-pointer overflow-hidden rounded-[20px] bg-[#f5f3f1] p-4 sm:p-6 transition-colors duration-200 hover:bg-[#fdfcfc] hover:shadow-[rgba(0,0,0,0.4)_0px_0px_1px_0px,rgba(0,0,0,0.04)_0px_1px_1px_0px,rgba(0,0,0,0.04)_0px_2px_4px_0px] focus-visible:ring-1 focus-visible:ring-[#000000] focus-visible:outline-none dark:bg-[#191816] dark:hover:bg-[#1f1d1b]"
      >
        {/* Colorful Perimeter Countdown Border */}
        <PerimeterCountdown progress={progress} remainingSec={remainingSec} radius={19.25} />

        {/* Warm Paper Radial Spotlight */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(280px circle at var(--spot-x, 50%) var(--spot-y, 50%), var(--spotlight-color), transparent 75%)',
          }}
        />

        {/* Subtle Tap Ripple */}
        <AnimatePresence>
          {ripple && (
            <motion.span
              key={ripple.key}
              initial={{ scale: 0.1, opacity: 0.12 }}
              animate={{ scale: 2.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={() => setRipple(null)}
              className="pointer-events-none absolute h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#000000] dark:bg-[#fdfcfc]"
              style={{ left: ripple.x, top: ripple.y }}
            />
          )}
        </AnimatePresence>

        {/* Top Row: Colorful Brand Badge, Account Info & Responsive Actions */}
        <div className="relative z-20 flex items-start justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-11 w-11 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-[12px] transition-transform duration-200 group-hover:scale-[1.04] ${brand.plateClass}`}
            >
              {brand.icon}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-[15px] font-medium tracking-[0.01em] text-[#000000] dark:text-[#fdfcfc]">
                  {account.issuer || 'Account'}
                </h3>
                {account.pinned && (
                  <Pin className="h-3 w-3 flex-shrink-0 fill-[#000000] text-[#000000] dark:fill-[#fdfcfc] dark:text-[#fdfcfc]" />
                )}
                {account.isDemo && (
                  <span className="rounded-full border border-[#ebe8e4] bg-[#fdfcfc] px-2 py-0.2 text-[10px] font-medium text-[#777169] dark:border-[#292623] dark:bg-[#11100f] dark:text-[#a59f97]">
                    Demo
                  </span>
                )}
              </div>
              <p className="truncate text-[13px] text-[#777169] dark:text-[#a59f97]">
                {account.label}
              </p>
            </div>
          </div>

          {/* Desktop Hover Action Pill Toolbar */}
          <div
            className="hidden sm:flex items-center gap-0.5 rounded-full border border-transparent px-1 py-0.5 opacity-0 transition-all duration-200 group-hover:border-[#ebe8e4] group-hover:bg-[#fdfcfc] group-hover:opacity-100 dark:group-hover:border-[#292623] dark:group-hover:bg-[#11100f]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onTogglePin(account.id)}
              title={t.pinnedTag}
              className={`rounded-full p-1.5 transition-colors ${
                account.pinned
                  ? 'text-[#000000] dark:text-[#fdfcfc]'
                  : 'text-[#a59f97] hover:bg-[#ebe8e4]/70 hover:text-[#000000] dark:hover:bg-[#262421] dark:hover:text-[#fdfcfc]'
              }`}
            >
              <Pin className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onShowQr(account)}
              title="QR"
              className="rounded-full p-1.5 text-[#a59f97] transition-colors hover:bg-[#ebe8e4]/70 hover:text-[#000000] dark:hover:bg-[#262421] dark:hover:text-[#fdfcfc]"
            >
              <QrCode className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(account)}
              title="Edit"
              className="rounded-full p-1.5 text-[#a59f97] transition-colors hover:bg-[#ebe8e4]/70 hover:text-[#000000] dark:hover:bg-[#262421] dark:hover:text-[#fdfcfc]"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(account)}
              title="Delete"
              className="rounded-full p-1.5 text-[#a59f97] transition-colors hover:bg-[#000000] hover:text-[#fdfcfc] dark:hover:bg-[#fdfcfc] dark:hover:text-[#000000]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Mobile App Clean 40x40 Touch Menu Trigger */}
          <div className="relative sm:hidden" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label="Card options"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ebe8e4] bg-[#fdfcfc] text-[#44403b] active:scale-95 dark:border-[#292623] dark:bg-[#11100f] dark:text-[#fdfcfc]"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="whisper-shadow absolute top-10 right-0 z-30 flex items-center gap-1 rounded-full border border-[#ebe8e4] bg-[#fdfcfc] p-1 dark:border-[#292623] dark:bg-[#151412]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onTogglePin(account.id);
                      setMobileMenuOpen(false);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[#000000] active:bg-[#ebe8e4] dark:text-[#fdfcfc]"
                  >
                    <Pin className={`h-4 w-4 ${account.pinned ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onShowQr(account);
                      setMobileMenuOpen(false);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[#000000] active:bg-[#ebe8e4] dark:text-[#fdfcfc]"
                  >
                    <QrCode className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onEdit(account);
                      setMobileMenuOpen(false);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[#000000] active:bg-[#ebe8e4] dark:text-[#fdfcfc]"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(account);
                      setMobileMenuOpen(false);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[#ff4704] active:bg-[#ff4704]/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center Row: Odometer Digits + 40px Touch Copy Pill */}
        <div className="relative z-20 mt-3.5 sm:mt-5 flex items-center justify-between gap-2">
          <OdometerCode code={code} remainingSec={remainingSec} size="md" />

          <motion.div
            animate={copiedState ? { scale: [0.9, 1.06, 1] } : { scale: 1 }}
            transition={{ duration: 0.25 }}
            className={`flex h-10 w-10 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
              copiedState
                ? 'border-[#000000] bg-[#000000] text-[#fdfcfc] dark:border-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#000000]'
                : 'border-[#e5e5e5] bg-[#fdfcfc] text-[#44403b] group-hover:border-[#000000] group-hover:bg-[#000000] group-hover:text-[#fdfcfc] dark:border-[#2f2c28] dark:bg-[#11100f] dark:text-[#a59f97] dark:group-hover:border-[#fdfcfc] dark:group-hover:bg-[#fdfcfc] dark:group-hover:text-[#000000]'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {copiedState ? (
                <motion.span
                  key="checked"
                  initial={{ scale: 0.4, rotate: -25, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 520, damping: 24 }}
                >
                  <Check className="h-4 w-4 stroke-[2.2]" />
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ duration: 0.14 }}
                >
                  <Copy className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Bottom Hairline + Tag Pills & Colorful Timer */}
        <div className="relative z-20 mt-3.5 sm:mt-5 flex min-h-[28px] items-center justify-between gap-2 border-t border-[#ebe8e4] pt-3 dark:border-[#292623]">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {showNextPreview ? (
                <motion.div
                  key="next-preview"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#ebe8e4] bg-[#fdfcfc] px-2.5 py-0.5 text-[11px] text-[#44403b] dark:border-[#292623] dark:bg-[#11100f] dark:text-[#fdfcfc]"
                >
                  <ArrowRight className="h-3 w-3 text-[#777169]" />
                  <span className="text-[#777169]">{t.nextCodeLabel}:</span>
                  <span className="font-mono-tabular font-medium text-[#000000] dark:text-[#fdfcfc]">
                    {formatSpaced(nextCode)}
                  </span>
                </motion.div>
              ) : account.tags && account.tags.length > 0 ? (
                <motion.div
                  key="tags"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 overflow-hidden"
                >
                  {account.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="truncate rounded-full border border-[#ebe8e4] bg-[#fdfcfc] px-2.5 py-0.5 text-[11px] font-normal text-[#777169] dark:border-[#292623] dark:bg-[#11100f] dark:text-[#a59f97]"
                    >
                      {tag}
                    </span>
                  ))}
                </motion.div>
              ) : (
                <motion.span
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] text-[#a59f97]"
                >
                  {t.clickToCopy}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <CircularTimerBadge progress={progress} remainingSec={remainingSec} />
        </div>
      </motion.article>
    );
  }
);

TotpCard.displayName = 'TotpCard';
