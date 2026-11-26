import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import jsQR from 'jsqr';
import {
  Camera,
  Check,
  Copy,
  Download,
  KeyRound,
  Lock,
  Search,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import type { TotpAlgorithm, TotpSnapshot, VaultAccount } from '../types';
import type { TranslationDict } from '../lib/i18n';
import { cleanBase32, isValidBase32 } from '../lib/totp';
import { toOtpAuthUri } from '../lib/parser';
import { generateQrDataUrl } from '../lib/qr';
import { resolveBrandVisual } from '../lib/brands';

const ModalShell: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  maxWidth?: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, maxWidth = 'max-w-md', children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, y: 48, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 36, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 440, damping: 34 }}
            className={`whisper-shadow relative z-10 max-h-[90dvh] w-full ${maxWidth} overflow-y-auto rounded-t-[28px] border-t border-[#ebe8e4] bg-[#fdfcfc] px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-[24px] sm:border sm:p-7 dark:border-[#292623] dark:bg-[#151412]`}
          >
            {/* Mobile Sheet Drag Handle */}
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#ebe8e4] sm:hidden dark:bg-[#2f2c28]" />

            <div className="flex items-center justify-between gap-3 border-b border-[#ebe8e4] pb-3.5 sm:pb-4 dark:border-[#292623]">
              <h3 className="font-editorial-display text-[22px] sm:text-[24px] leading-[1.15] text-[#000000] dark:text-[#fdfcfc]">
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e5e5] bg-[#fdfcfc] text-[#777169] transition-colors hover:border-[#000000] hover:text-[#000000] dark:border-[#2f2c28] dark:bg-[#11100f] dark:hover:text-[#fdfcfc]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 sm:mt-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* 1. Add / Edit Account Modal */
export const AccountFormModal: React.FC<{
  open: boolean;
  editing: VaultAccount | null;
  t: TranslationDict;
  onClose: () => void;
  onSubmit: (data: Omit<VaultAccount, 'id' | 'createdAt'>, existingId?: string) => void;
}> = ({ open, editing, t, onClose, onSubmit }) => {
  const [issuer, setIssuer] = useState('');
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [digits, setDigits] = useState<6 | 8>(6);
  const [period, setPeriod] = useState(30);
  const [algorithm, setAlgorithm] = useState<TotpAlgorithm>('SHA-1');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing) {
      setIssuer(editing.issuer);
      setLabel(editing.label);
      setSecret(editing.secret);
      setTagsText((editing.tags || []).join(', '));
      setDigits(editing.digits);
      setPeriod(editing.period);
      setAlgorithm(editing.algorithm);
    } else {
      setIssuer('');
      setLabel('');
      setSecret('');
      setTagsText('');
      setDigits(6);
      setPeriod(30);
      setAlgorithm('SHA-1');
    }
    setError('');
  }, [editing, open]);

  const brand = resolveBrandVisual(issuer || 'Z2FA', label);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = cleanBase32(secret);
    if (!isValidBase32(cleaned, 8)) {
      setError('Secret Key chưa đúng định dạng Base32 (A-Z, 2-7, tối thiểu 8 ký tự).');
      return;
    }

    const tags = tagsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onSubmit(
      {
        issuer: issuer.trim() || 'Account',
        label: label.trim() || issuer.trim() || '2FA',
        secret: cleaned,
        digits,
        period: Math.max(10, Math.min(300, Number(period) || 30)),
        algorithm,
        pinned: editing?.pinned ?? false,
        tags,
        isDemo: false,
      },
      editing?.id
    );
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={editing ? t.editModalTitle : t.addModalTitle}
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex items-center gap-3 rounded-[16px] bg-[#f5f3f1] p-3.5 dark:bg-[#1f1d1b]">
          <div className={`flex h-10 w-10 items-center justify-center rounded-[12px] ${brand.plateClass}`}>
            {brand.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-[#000000] dark:text-[#fdfcfc]">
              {issuer.trim() || 'Tên dịch vụ'}
            </p>
            <p className="truncate text-[12px] text-[#777169] dark:text-[#a59f97]">
              {label.trim() || 'account@example.com'}
            </p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#44403b] dark:text-[#a59f97]">
            {t.issuerLabel}
          </label>
          <input
            type="text"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder="Google, GitHub, Binance, Facebook..."
            className="inset-hairline w-full rounded-[6px] border border-[#ebe8e4] bg-[#fdfcfc] px-3.5 py-2.5 text-[14px] text-[#000000] placeholder:text-[#a59f97] focus:border-[#000000] focus:outline-none dark:border-[#292623] dark:bg-[#11100f] dark:text-[#fdfcfc]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#44403b] dark:text-[#a59f97]">
            {t.accountNameLabel}
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="you@gmail.com"
            className="inset-hairline w-full rounded-[6px] border border-[#ebe8e4] bg-[#fdfcfc] px-3.5 py-2.5 text-[14px] text-[#000000] placeholder:text-[#a59f97] focus:border-[#000000] focus:outline-none dark:border-[#292623] dark:bg-[#11100f] dark:text-[#fdfcfc]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#44403b] dark:text-[#a59f97]">
            {t.secretKeyLabel}
          </label>
          <input
            type="text"
            value={secret}
            onChange={(e) => {
              setSecret(e.target.value);
              setError('');
            }}
            placeholder="JBSWY3DPEHPK3PXP"
            required
            className="font-mono-tabular inset-hairline w-full rounded-[6px] border border-[#ebe8e4] bg-[#fdfcfc] px-3.5 py-2.5 text-[13px] uppercase text-[#000000] placeholder:text-[#a59f97] focus:border-[#000000] focus:outline-none dark:border-[#292623] dark:bg-[#11100f] dark:text-[#fdfcfc]"
          />
          {error && <p className="mt-1 text-[12px] text-[#44403b]">{error}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#44403b] dark:text-[#a59f97]">
            {t.tagsLabel}
          </label>
          <input
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="Công việc, Cá nhân, Tài chính"
            className="inset-hairline w-full rounded-[6px] border border-[#ebe8e4] bg-[#fdfcfc] px-3.5 py-2.5 text-[14px] text-[#000000] placeholder:text-[#a59f97] focus:border-[#000000] focus:outline-none dark:border-[#292623] dark:bg-[#11100f] dark:text-[#fdfcfc]"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-[13px] font-medium text-[#44403b] underline underline-offset-4 hover:text-[#000000] dark:text-[#a59f97] dark:hover:text-[#fdfcfc]"
        >
          {t.advancedOptions}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-3 gap-2.5 rounded-[14px] bg-[#f5f3f1] p-3.5 dark:bg-[#1f1d1b]">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#777169]">Digits</label>
              <select
                value={digits}
                onChange={(e) => setDigits(Number(e.target.value) === 8 ? 8 : 6)}
                className="w-full rounded-[6px] border border-[#ebe8e4] bg-[#fdfcfc] px-2.5 py-1.5 text-[12px] text-[#000000] dark:border-[#292623] dark:bg-[#11100f] dark:text-[#fdfcfc]"
              >
                <option value={6}>6 số</option>
                <option value={8}>8 số</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#777169]">Chu kỳ (s)</label>
              <input
                type="number"
                min={10}
                max={300}
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="w-full rounded-[6px] border border-[#ebe8e4] bg-[#fdfcfc] px-2.5 py-1.5 text-[12px] text-[#000000] dark:border-[#292623] dark:bg-[#11100f] dark:text-[#fdfcfc]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#777169]">Thuật toán</label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as TotpAlgorithm)}
                className="w-full rounded-[6px] border border-[#ebe8e4] bg-[#fdfcfc] px-2.5 py-1.5 text-[12px] text-[#000000] dark:border-[#292623] dark:bg-[#11100f] dark:text-[#fdfcfc]"
              >
                <option value="SHA-1">SHA-1</option>
                <option value="SHA-256">SHA-256</option>
                <option value="SHA-512">SHA-512</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#e5e5e5] bg-[#fdfcfc] px-4 py-2 text-[14px] font-medium text-[#000000] hover:bg-[#f5f3f1] dark:border-[#2f2c28] dark:bg-[#11100f] dark:text-[#fdfcfc]"
          >
            {t.cancelBtn}
          </button>
          <button
            type="submit"
            className="rounded-full border border-[#000000] bg-[#000000] px-5 py-2 text-[14px] font-medium text-[#fdfcfc] hover:opacity-85 active:scale-97 dark:border-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#000000]"
          >
            {t.saveChangesBtn}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* 2. QR Code Share Modal */
export const QrShareModal: React.FC<{
  account: VaultAccount | null;
  t: TranslationDict;
  onClose: () => void;
  onCopyUri: (uri: string) => void;
}> = ({ account, t, onClose, onCopyUri }) => {
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!account) {
      setQrUrl('');
      return;
    }
    const uri = toOtpAuthUri(account);
    generateQrDataUrl(uri).then(setQrUrl);
  }, [account]);

  if (!account) return null;
  const uri = toOtpAuthUri(account);

  return (
    <ModalShell open={Boolean(account)} onClose={onClose} title={t.qrModalTitle} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <p className="text-[13px] leading-relaxed text-[#777169] dark:text-[#a59f97]">
          {t.qrModalDesc}
        </p>

        <div className="mt-5 rounded-[20px] border border-[#ebe8e4] bg-[#fdfcfc] p-3.5">
          {qrUrl ? (
            <img src={qrUrl} alt="2FA QR Code" className="h-52 w-52 rounded-[12px]" />
          ) : (
            <div className="h-52 w-52 animate-pulse rounded-[12px] bg-[#f5f3f1]" />
          )}
        </div>

        <p className="mt-3.5 text-[15px] font-medium text-[#000000] dark:text-[#fdfcfc]">
          {account.issuer}
        </p>
        <p className="text-[13px] text-[#777169] dark:text-[#a59f97]">{account.label}</p>

        <button
          type="button"
          onClick={() => {
            onCopyUri(uri);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#000000] bg-[#000000] px-5 py-2.5 text-[14px] font-medium text-[#fdfcfc] transition-opacity hover:opacity-85 dark:border-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#000000]"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span>{t.copyUriBtn}</span>
        </button>
      </div>
    </ModalShell>
  );
};

/* 3. Live Camera QR Scanner Modal */
export const CameraScannerModal: React.FC<{
  open: boolean;
  t: TranslationDict;
  onClose: () => void;
  onDecoded: (rawText: string) => void;
}> = ({ open, t, onClose, onDecoded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camError, setCamError] = useState('');

  useEffect(() => {
    if (!open) return;
    setCamError('');
    let stream: MediaStream | null = null;
    let rafId = 0;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((mediaStream) => {
        stream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }

        const tick = () => {
          const video = videoRef.current;
          if (video && video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qr = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: 'attemptBoth',
            });
            if (qr && qr.data) {
              onDecoded(qr.data);
              onClose();
              return;
            }
          }
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      })
      .catch(() => {
        setCamError(t.cameraPermissionError);
      });

    return () => {
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, [open, onClose, onDecoded, t.cameraPermissionError]);

  return (
    <ModalShell open={open} onClose={onClose} title={t.cameraModalTitle}>
      <p className="text-[13px] text-[#777169] dark:text-[#a59f97]">{t.cameraModalDesc}</p>

      {camError ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-[20px] bg-[#f5f3f1] p-6 text-center dark:bg-[#1f1d1b]">
          <Camera className="h-7 w-7 text-[#44403b] dark:text-[#a59f97]" />
          <p className="text-[13px] text-[#44403b] dark:text-[#fdfcfc]">{camError}</p>
        </div>
      ) : (
        <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-[20px] border border-[#ebe8e4] bg-[#000000]">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-8 rounded-[18px] border border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.38)]">
            <motion.div
              animate={{ y: ['4%', '92%', '4%'] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="h-px w-full bg-[#fdfcfc]"
            />
          </div>
        </div>
      )}
    </ModalShell>
  );
};

/* 4. AES-256 Vault Security Modal */
export const VaultSecurityModal: React.FC<{
  open: boolean;
  hasPassword: boolean;
  t: TranslationDict;
  onClose: () => void;
  onEnablePassword: (pwd: string) => Promise<void>;
  onRemovePassword: () => void;
}> = ({ open, hasPassword, t, onClose, onEnablePassword, onRemovePassword }) => {
  const [pwd, setPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPwd('');
    setConfirmPwd('');
    setErr('');
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 4 || pwd !== confirmPwd) {
      setErr(t.passwordMismatchError);
      return;
    }
    setBusy(true);
    try {
      await onEnablePassword(pwd);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell open={open} onClose={onClose} title={t.securityModalTitle}>
      <div className="flex items-start gap-3 rounded-[16px] bg-[#f5f3f1] p-4 dark:bg-[#1f1d1b]">
        <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#000000] dark:text-[#fdfcfc]" />
        <p className="text-[13px] leading-relaxed text-[#777169] dark:text-[#a59f97]">
          {t.securityModalDesc}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#44403b] dark:text-[#a59f97]">
            {t.newPasswordLabel}
          </label>
          <input
            type="password"
            value={pwd}
            onChange={(e) => {
              setPwd(e.target.value);
              setErr('');
            }}
            placeholder="••••••••"
            className="inset-hairline w-full rounded-[6px] border border-[#ebe8e4] bg-[#fdfcfc] px-3.5 py-2.5 text-[14px] text-[#000000] focus:border-[#000000] focus:outline-none dark:border-[#292623] dark:bg-[#11100f] dark:text-[#fdfcfc]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#44403b] dark:text-[#a59f97]">
            {t.confirmPasswordLabel}
          </label>
          <input
            type="password"
            value={confirmPwd}
            onChange={(e) => {
              setConfirmPwd(e.target.value);
              setErr('');
            }}
            placeholder="••••••••"
            className="inset-hairline w-full rounded-[6px] border border-[#ebe8e4] bg-[#fdfcfc] px-3.5 py-2.5 text-[14px] text-[#000000] focus:border-[#000000] focus:outline-none dark:border-[#292623] dark:bg-[#11100f] dark:text-[#fdfcfc]"
          />
        </div>

        {err && <p className="text-[12px] text-[#44403b]">{err}</p>}

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#000000] bg-[#000000] px-5 py-2.5 text-[14px] font-medium text-[#fdfcfc] hover:opacity-85 active:scale-98 dark:border-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#000000]"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>{t.enableEncryptionBtn}</span>
          </button>

          {hasPassword && (
            <button
              type="button"
              onClick={() => {
                onRemovePassword();
                onClose();
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#e5e5e5] bg-[#fdfcfc] px-4 py-2 text-[13px] font-medium text-[#44403b] hover:border-[#000000] hover:text-[#000000] dark:border-[#2f2c28] dark:bg-[#11100f] dark:text-[#fdfcfc]"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>{t.removeEncryptionBtn}</span>
            </button>
          )}
        </div>
      </form>
    </ModalShell>
  );
};

/* 5. Backup & Restore Modal */
export const BackupRestoreModal: React.FC<{
  open: boolean;
  t: TranslationDict;
  accountCount: number;
  onClose: () => void;
  onExportJson: () => void;
  onImportJsonFile: (file: File) => void;
}> = ({ open, t, accountCount, onClose, onExportJson, onImportJsonFile }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <ModalShell open={open} onClose={onClose} title={t.backupModalTitle}>
      <div className="space-y-4">
        <div className="rounded-[20px] bg-[#f5f3f1] p-5 dark:bg-[#1f1d1b]">
          <h4 className="text-[15px] font-medium text-[#000000] dark:text-[#fdfcfc]">
            {t.backupExportTitle} ({accountCount})
          </h4>
          <p className="mt-1 text-[13px] text-[#777169] dark:text-[#a59f97]">{t.backupExportDesc}</p>
          <button
            type="button"
            onClick={onExportJson}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#000000] bg-[#000000] px-4 py-2 text-[13px] font-medium text-[#fdfcfc] transition-opacity hover:opacity-85 active:scale-97 dark:border-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#000000]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t.exportDownloadBtn}</span>
          </button>
        </div>

        <div className="rounded-[20px] bg-[#f5f3f1] p-5 dark:bg-[#1f1d1b]">
          <h4 className="text-[15px] font-medium text-[#000000] dark:text-[#fdfcfc]">
            {t.backupImportTitle}
          </h4>
          <p className="mt-1 text-[13px] text-[#777169] dark:text-[#a59f97]">{t.backupImportDesc}</p>
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                onImportJsonFile(f);
                onClose();
              }
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-[#fdfcfc] px-4 py-2 text-[13px] font-medium text-[#000000] transition-colors hover:border-[#000000] dark:border-[#2f2c28] dark:bg-[#11100f] dark:text-[#fdfcfc]"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>{t.importSelectFileBtn}</span>
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

/* 6. Command Palette (Cmd+K / Ctrl+K) Instant Jump & Copy */
export const CommandPaletteModal: React.FC<{
  open: boolean;
  accounts: VaultAccount[];
  snapshots: Record<string, TotpSnapshot>;
  t: TranslationDict;
  onClose: () => void;
  onSmartCopy: (account: VaultAccount, snap: TotpSnapshot) => void;
}> = ({ open, accounts, snapshots, t, onClose, onSmartCopy }) => {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const filtered = accounts.filter((acc) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      acc.issuer.toLowerCase().includes(q) ||
      acc.label.toLowerCase().includes(q) ||
      (acc.tags || []).some((tg) => tg.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === 'Enter' && filtered[selectedIdx]) {
      e.preventDefault();
      const target = filtered[selectedIdx];
      const snap = snapshots[target.id];
      if (snap) {
        onSmartCopy(target, snap);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/35 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ type: 'spring', stiffness: 460, damping: 32 }}
            onKeyDown={handleKeyDown}
            className="whisper-shadow relative z-10 w-full max-w-lg overflow-hidden rounded-[20px] border border-[#ebe8e4] bg-[#fdfcfc] dark:border-[#292623] dark:bg-[#151412]"
          >
            <div className="flex items-center gap-3 border-b border-[#ebe8e4] px-4 py-3.5 dark:border-[#292623]">
              <Search className="h-4 w-4 text-[#777169]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="flex-1 bg-transparent text-[14px] text-[#000000] placeholder:text-[#a59f97] focus:outline-none dark:text-[#fdfcfc]"
              />
              <kbd className="font-mono-tabular rounded-full border border-[#ebe8e4] bg-[#f5f3f1] px-2 py-0.5 text-[10px] text-[#777169] dark:border-[#292623] dark:bg-[#1f1d1b]">
                ESC
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-[#777169]">{t.noSearchMatchTitle}</p>
              ) : (
                filtered.map((acc, idx) => {
                  const brand = resolveBrandVisual(acc.issuer, acc.label);
                  const snap = snapshots[acc.id];
                  const active = idx === selectedIdx;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onMouseEnter={() => setSelectedIdx(idx)}
                      onClick={() => {
                        if (snap) {
                          onSmartCopy(acc, snap);
                          onClose();
                        }
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded-[14px] px-3 py-2.5 text-left transition-colors ${
                        active
                          ? 'bg-[#f5f3f1] text-[#000000] dark:bg-[#22201d] dark:text-[#fdfcfc]'
                          : 'text-[#44403b] hover:bg-[#f5f3f1]/60 dark:text-[#a59f97]'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] ${brand.plateClass}`}>
                          {brand.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-[#000000] dark:text-[#fdfcfc]">
                            {acc.issuer}
                          </p>
                          <p className="truncate text-[12px] text-[#777169]">{acc.label}</p>
                        </div>
                      </div>

                      {snap && (
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono-tabular text-[14px] font-medium text-[#000000] dark:text-[#fdfcfc]">
                            {snap.code.slice(0, 3)} {snap.code.slice(3)}
                          </span>
                          <span className="font-mono-tabular text-[11px] text-[#a59f97]">
                            {snap.remainingSec}s
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
