import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BookmarkCheck,
  BookmarkPlus,
  Camera,
  Check,
  ClipboardPaste,
  Copy,
  ImageUp,
  Wand2,
  X,
} from 'lucide-react';
import type { ParsedEntry, TotpSnapshot, VaultAccount } from '../types';
import type { TranslationDict } from '../lib/i18n';
import { parseSmartInput } from '../lib/parser';
import { computeTotpSnapshot, getCycleMetrics } from '../lib/totp';
import { resolveBrandVisual } from '../lib/brands';
import { SAMPLE_BULK_INPUT } from '../lib/demoAccounts';
import { OdometerCode } from './OdometerCode';
import { CircularTimerBadge } from './PerimeterCountdown';

interface QuickStudioProps {
  inputValue: string;
  onInputChange: (val: string) => void;
  nowMs: number;
  savedSecretsSet: Set<string>;
  t: TranslationDict;
  onSmartCopyEntry: (label: string, snapshot: TotpSnapshot) => void;
  onSaveEntryToVault: (entry: ParsedEntry) => void;
  onSaveAllToVault: (entries: ParsedEntry[]) => void;
  onCopyTextDirect: (text: string, title: string, subtitle?: string) => void;
  onUploadQrFile: (file: File) => void;
  onOpenCamera: () => void;
}

export const QuickStudio: React.FC<QuickStudioProps> = ({
  inputValue,
  onInputChange,
  nowMs,
  savedSecretsSet,
  t,
  onSmartCopyEntry,
  onSaveEntryToVault,
  onSaveAllToVault,
  onCopyTextDirect,
  onUploadQrFile,
  onOpenCamera,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customSingleIssuer, setCustomSingleIssuer] = useState('');
  const [customSingleLabel, setCustomSingleLabel] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const parsedEntries = useMemo(() => parseSmartInput(inputValue), [inputValue]);

  const singleSecretKey = parsedEntries.length === 1 ? parsedEntries[0].secret : '';
  useEffect(() => {
    if (parsedEntries.length === 1) {
      setCustomSingleIssuer(parsedEntries[0].issuer === 'Quick 2FA' ? '' : parsedEntries[0].issuer);
      setCustomSingleLabel(
        parsedEntries[0].label === 'Mã lấy nhanh' ? '' : parsedEntries[0].label
      );
    }
  }, [singleSecretKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const globalCycle = Math.floor(nowMs / 30000);
  const [codeMap, setCodeMap] = useState<Record<string, { code: string; nextCode: string; cycle: number }>>({});

  useEffect(() => {
    let cancelled = false;
    if (parsedEntries.length === 0) {
      setCodeMap({});
      return;
    }

    Promise.all(
      parsedEntries.map(async (entry) => {
        const snap = await computeTotpSnapshot(
          entry.secret,
          nowMs,
          entry.period,
          entry.digits,
          entry.algorithm
        );
        return [
          entry.id,
          { code: snap.code, nextCode: snap.nextCode, cycle: snap.cycleIndex },
        ] as const;
      })
    ).then((pairs) => {
      if (!cancelled) {
        setCodeMap(Object.fromEntries(pairs));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [parsedEntries, globalCycle]); // eslint-disable-line react-hooks/exhaustive-deps

  const getLiveSnapshot = (entry: ParsedEntry): TotpSnapshot | undefined => {
    const pair = codeMap[entry.id];
    if (!pair) return undefined;
    const metrics = getCycleMetrics(nowMs, entry.period);
    return {
      code: pair.code,
      nextCode: pair.nextCode,
      ...metrics,
    };
  };

  const handlePasteButton = async () => {
    try {
      if (navigator.clipboard?.read) {
        try {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            const imgType = item.types.find((tp) => tp.startsWith('image/'));
            if (imgType) {
              const blob = await item.getType(imgType);
              onUploadQrFile(new File([blob], 'clipboard-qr.png', { type: imgType }));
              return;
            }
          }
        } catch {
          // Fallback to readText
        }
      }
      const text = await navigator.clipboard.readText();
      if (text) onInputChange(text);
    } catch {
      // Clipboard blocked
    }
  };

  const triggerRowCopied = (id: string) => {
    setCopiedId(id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 1500);
  };

  const handleCopyAllBulk = () => {
    const lines = parsedEntries
      .map((entry) => {
        const snap = getLiveSnapshot(entry);
        const activeCode = snap ? (snap.remainingMs <= 2200 ? snap.nextCode : snap.code) : '------';
        return `${entry.issuer !== 'Quick 2FA' ? `${entry.issuer} - ` : ''}${entry.label}: ${activeCode}`;
      })
      .join('\n');
    onCopyTextDirect(lines, t.copiedTitle, `${parsedEntries.length} mã 2FA`);
  };

  const lineCount = Math.min(5, Math.max(2, inputValue.split('\n').length));

  return (
    <section className="relative overflow-hidden rounded-[24px] bg-[#f5f3f1] p-6 sm:p-8 dark:bg-[#191816]">
      {/* Decorative Product Sphere Artwork (Violet Spark #0447ff + Ember Orange #ff4704 — non-interactive) */}
      <motion.div
        aria-hidden="true"
        animate={{
          scale: [1, 1.06, 1],
          rotate: [0, 8, 0],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="product-sphere-orb pointer-events-none absolute -top-20 -right-16 h-60 w-60 rounded-full opacity-45 blur-2xl"
      />

      {/* Editorial Header Row */}
      <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ebe8e4] bg-[#fdfcfc] px-3 py-1 text-[11px] font-medium text-[#44403b] dark:border-[#292623] dark:bg-[#11100f] dark:text-[#a59f97]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff4704]" />
            <span>{t.quickStudioBadge}</span>
          </div>

          <h1 className="font-editorial-display mt-3 text-[24px] leading-[1.15] text-[#000000] sm:text-[36px] dark:text-[#fdfcfc]">
            {t.quickStudioTitle}
          </h1>

          <p className="mt-2 text-[14px] leading-[1.55] text-[#777169] sm:text-[15px] dark:text-[#a59f97]">
            {t.quickStudioDesc}
          </p>
        </div>

        {/* 9999px Outline & Filled Pill Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePasteButton}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-[#fdfcfc] px-3.5 py-1.5 text-[13px] font-medium text-[#000000] transition-all hover:bg-[#ebe8e4]/60 active:scale-97 dark:border-[#2f2c28] dark:bg-[#11100f] dark:text-[#fdfcfc] dark:hover:bg-[#262421]"
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
            <span>{t.pasteClipboardBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-[#fdfcfc] px-3.5 py-1.5 text-[13px] font-medium text-[#000000] transition-all hover:bg-[#ebe8e4]/60 active:scale-97 dark:border-[#2f2c28] dark:bg-[#11100f] dark:text-[#fdfcfc] dark:hover:bg-[#262421]"
          >
            <ImageUp className="h-3.5 w-3.5" />
            <span>{t.uploadQrBtn}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadQrFile(file);
              e.target.value = '';
            }}
          />

          <button
            type="button"
            onClick={onOpenCamera}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-[#fdfcfc] px-3.5 py-1.5 text-[13px] font-medium text-[#000000] transition-all hover:bg-[#ebe8e4]/60 active:scale-97 dark:border-[#2f2c28] dark:bg-[#11100f] dark:text-[#fdfcfc] dark:hover:bg-[#262421]"
          >
            <Camera className="h-3.5 w-3.5" />
            <span>{t.scanCameraBtn}</span>
          </button>

          {!inputValue.trim() ? (
            <button
              type="button"
              onClick={() => onInputChange(SAMPLE_BULK_INPUT)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#000000] bg-[#000000] px-4 py-1.5 text-[13px] font-medium text-[#fdfcfc] transition-opacity hover:opacity-85 active:scale-97 dark:border-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#000000]"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>{t.sampleSecretBtn}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onInputChange('')}
              className="inline-flex items-center gap-1 rounded-full border border-[#e5e5e5] bg-[#fdfcfc] px-3.5 py-1.5 text-[13px] font-medium text-[#44403b] transition-colors hover:border-[#000000] hover:text-[#000000] active:scale-97 dark:border-[#2f2c28] dark:bg-[#11100f] dark:text-[#fdfcfc]"
            >
              <X className="h-3.5 w-3.5" />
              <span>{t.clearBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* Geist Mono Input Area (6px crisp Bauhaus input radius on Eggshell surface) */}
      <div className="relative z-10 mt-5">
        <textarea
          rows={lineCount}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={t.quickInputPlaceholder}
          spellCheck={false}
          className="font-mono-tabular inset-hairline w-full resize-none rounded-[10px] sm:rounded-[8px] border border-[#ebe8e4] bg-[#fdfcfc] px-4 py-3.5 text-[16px] sm:text-[13px] leading-[1.6] text-[#000000] placeholder:font-sans placeholder:text-[14px] placeholder:text-[#a59f97] transition-colors focus:border-[#000000] focus:outline-none dark:border-[#292623] dark:bg-[#11100f] dark:text-[#fdfcfc] dark:placeholder:text-[#777169] dark:focus:border-[#fdfcfc]"
        />
      </div>

      {/* Live Decoded Results */}
      <AnimatePresence mode="wait">
        {inputValue.trim() && parsedEntries.length === 0 && (
          <motion.div
            key="invalid-hint"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="relative z-10 mt-3 rounded-[10px] border border-[#ebe8e4] bg-[#fdfcfc] px-4 py-2.5 text-[13px] text-[#777169] dark:border-[#292623] dark:bg-[#11100f] dark:text-[#a59f97]"
          >
            {t.invalidInputHint}
          </motion.div>
        )}

        {/* SINGLE SECRET ELEVATED WHITE CARD */}
        {parsedEntries.length === 1 && (() => {
          const entry = parsedEntries[0];
          const snap = getLiveSnapshot(entry);
          const effectiveIssuer = customSingleIssuer.trim() || entry.issuer;
          const effectiveLabel = customSingleLabel.trim() || entry.label;
          const brand = resolveBrandVisual(effectiveIssuer, effectiveLabel);
          const alreadySaved = savedSecretsSet.has(entry.secret);
          const remainingSec = snap?.remainingSec ?? 30;
          const progress = snap?.progress ?? 1;

          return (
            <motion.div
              key={`single-${entry.secret}`}
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="whisper-shadow relative z-10 mt-5 overflow-hidden rounded-[20px] bg-[#fdfcfc] p-5 sm:p-6 dark:bg-[#11100f]"
            >
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                {/* Left: Live Giant Odometer + Click to Copy */}
                <div
                  onClick={() => {
                    if (!snap) return;
                    onSmartCopyEntry(effectiveIssuer || effectiveLabel, snap);
                    triggerRowCopied(entry.id);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && snap) {
                      e.preventDefault();
                      onSmartCopyEntry(effectiveIssuer || effectiveLabel, snap);
                      triggerRowCopied(entry.id);
                    }
                  }}
                  className="group flex cursor-pointer flex-wrap items-center gap-4 rounded-xl transition-transform active:scale-[0.99]"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-[12px] ${brand.plateClass}`}>
                    {brand.icon}
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <OdometerCode
                        code={snap?.code ?? '000000'}
                        remainingSec={remainingSec}
                        size="lg"
                      />
                      <span
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
                          copiedId === entry.id
                            ? 'border-[#000000] bg-[#000000] text-[#fdfcfc] dark:border-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#000000]'
                            : 'border-[#e5e5e5] bg-[#fdfcfc] text-[#000000] group-hover:border-[#000000] group-hover:bg-[#000000] group-hover:text-[#fdfcfc] dark:border-[#2f2c28] dark:bg-[#191816] dark:text-[#fdfcfc]'
                        }`}
                      >
                        {copiedId === entry.id ? (
                          <Check className="h-4 w-4 stroke-[2.2]" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <CircularTimerBadge progress={progress} remainingSec={remainingSec} />
                      {remainingSec <= 5 && snap && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#ebe8e4] bg-[#f5f3f1] px-2.5 py-0.5 text-[11px] text-[#44403b] dark:border-[#292623] dark:bg-[#191816] dark:text-[#fdfcfc]">
                          <ArrowRight className="h-3 w-3 text-[#777169]" />
                          {t.nextCodeLabel}:{' '}
                          <span className="font-mono-tabular font-medium text-[#000000] dark:text-[#fdfcfc]">
                            {snap.nextCode.slice(0, 3)} {snap.nextCode.slice(3)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Crisp 6px Inputs + Black Filled Pill CTA */}
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={customSingleIssuer}
                      onChange={(e) => setCustomSingleIssuer(e.target.value)}
                      placeholder="Tên hãng (VD: Google)"
                      className="w-36 rounded-[6px] border border-[#ebe8e4] bg-[#f5f3f1] px-3 py-2 text-[13px] text-[#000000] placeholder:text-[#a59f97] focus:border-[#000000] focus:bg-[#fdfcfc] focus:outline-none dark:border-[#292623] dark:bg-[#191816] dark:text-[#fdfcfc]"
                    />
                    <input
                      type="text"
                      value={customSingleLabel}
                      onChange={(e) => setCustomSingleLabel(e.target.value)}
                      placeholder="Tài khoản / Email"
                      className="w-44 rounded-[6px] border border-[#ebe8e4] bg-[#f5f3f1] px-3 py-2 text-[13px] text-[#000000] placeholder:text-[#a59f97] focus:border-[#000000] focus:bg-[#fdfcfc] focus:outline-none dark:border-[#292623] dark:bg-[#191816] dark:text-[#fdfcfc]"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={alreadySaved}
                    onClick={() =>
                      onSaveEntryToVault({
                        ...entry,
                        issuer: customSingleIssuer.trim() || entry.issuer || 'Tài khoản',
                        label: customSingleLabel.trim() || entry.label || '2FA',
                      })
                    }
                    className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-[14px] font-medium transition-all ${
                      alreadySaved
                        ? 'cursor-default border border-[#ebe8e4] bg-[#f5f3f1] text-[#777169] dark:border-[#292623] dark:bg-[#191816] dark:text-[#a59f97]'
                        : 'border border-[#000000] bg-[#000000] text-[#fdfcfc] hover:opacity-85 active:scale-97 dark:border-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#000000]'
                    }`}
                  >
                    {alreadySaved ? (
                      <>
                        <BookmarkCheck className="h-4 w-4" />
                        <span>{t.savedBadge}</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="h-4 w-4" />
                        <span>{t.saveToVaultBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* BULK MULTI-LINE LIVE STREAM */}
        {parsedEntries.length > 1 && (
          <motion.div
            key="bulk-results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="relative z-10 mt-5 space-y-3 border-t border-[#ebe8e4] pt-5 dark:border-[#292623]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 text-[13px] font-medium text-[#44403b] dark:text-[#a59f97]">
                <span className="h-2 w-2 rounded-full bg-[#0447ff]" />
                <span>{t.quickResultCount(parsedEntries.length)}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAllBulk}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-[#fdfcfc] px-3.5 py-1.5 text-[13px] font-medium text-[#000000] transition-colors hover:bg-[#ebe8e4]/70 dark:border-[#2f2c28] dark:bg-[#11100f] dark:text-[#fdfcfc]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{t.copyAllBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSaveAllToVault(parsedEntries)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#000000] bg-[#000000] px-4 py-1.5 text-[13px] font-medium text-[#fdfcfc] transition-opacity hover:opacity-85 active:scale-97 dark:border-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#000000]"
                >
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  <span>{t.saveAllBtn}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {parsedEntries.map((entry) => {
                const snap = getLiveSnapshot(entry);
                const brand = resolveBrandVisual(entry.issuer, entry.label);
                const isSaved = savedSecretsSet.has(entry.secret);
                const remainingSec = snap?.remainingSec ?? 30;
                const progress = snap?.progress ?? 1;

                return (
                  <div
                    key={entry.id}
                    onClick={() => {
                      if (!snap) return;
                      onSmartCopyEntry(`${entry.issuer} (${entry.label})`, snap);
                      triggerRowCopied(entry.id);
                    }}
                    className="group flex cursor-pointer items-center justify-between gap-3 rounded-[16px] border border-[#ebe8e4] bg-[#fdfcfc] px-4 py-3 transition-all hover:border-[#000000]/35 dark:border-[#292623] dark:bg-[#11100f] dark:hover:border-[#fdfcfc]/30"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] ${brand.plateClass}`}>
                        {brand.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-[#000000] dark:text-[#fdfcfc]">
                          {entry.issuer}
                        </p>
                        <p className="truncate text-[12px] text-[#777169] dark:text-[#a59f97]">
                          {entry.label}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-2.5">
                      <OdometerCode
                        code={snap?.code ?? '000000'}
                        remainingSec={remainingSec}
                        size="sm"
                      />
                      <CircularTimerBadge progress={progress} remainingSec={remainingSec} />

                      <button
                        type="button"
                        disabled={isSaved}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSaveEntryToVault(entry);
                        }}
                        title={isSaved ? t.savedBadge : t.saveToVaultBtn}
                        className={`rounded-full p-1.5 transition-colors ${
                          isSaved
                            ? 'text-[#000000] dark:text-[#fdfcfc]'
                            : 'text-[#a59f97] hover:bg-[#ebe8e4] hover:text-[#000000] dark:hover:bg-[#262421] dark:hover:text-[#fdfcfc]'
                        }`}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="h-4 w-4" />
                        ) : (
                          <BookmarkPlus className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export type { VaultAccount };
