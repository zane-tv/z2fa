import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import {
  Camera,
  ChevronRight,
  ClipboardPaste,
  DatabaseBackup,
  ImageUp,
  LayoutGrid,
  Lock,
  LockOpen,
  Moon,
  Pin,
  Plus,
  Search,
  Settings2,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  Zap,
} from 'lucide-react';
import type {
  EncryptedVaultPayload,
  IslandToast,
  Language,
  ParsedEntry,
  ThemeMode,
  TotpSnapshot,
  VaultAccount,
  Z2FABackupFile,
} from './types';
import { TRANSLATIONS } from './lib/i18n';
import { computeTotpSnapshot, getCycleMetrics } from './lib/totp';
import { parseSmartInput } from './lib/parser';
import { decryptVaultAccounts, encryptVaultAccounts } from './lib/cryptoVault';
import { decodeQrFromBlob } from './lib/qr';
import { createDemoAccounts } from './lib/demoAccounts';
import { Z2FALogo } from './components/Z2FALogo';
import { DynamicIslandToast } from './components/DynamicIslandToast';
import { QuickStudio } from './components/QuickStudio';
import { TotpCard } from './components/TotpCard';
import {
  AccountFormModal,
  BackupRestoreModal,
  CameraScannerModal,
  CommandPaletteModal,
  QrShareModal,
  VaultSecurityModal,
} from './components/Modals';

const STORAGE_KEYS = {
  PLAIN_ACCOUNTS: 'z2fa_accounts_v1',
  ENCRYPTED_VAULT: 'z2fa_encrypted_v1',
  INITIALIZED: 'z2fa_initialized_v1',
  THEME: 'z2fa_theme_v2',
  LANG: 'z2fa_lang_v1',
};

type MobileTab = 'vault' | 'quick' | 'settings';

export const App: React.FC = () => {
  /* Theme (Defaults to Light #fdfcfc Eggshell per DESIGN.md) & Language */
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    return saved === 'en' ? 'en' : 'vi';
  });

  const [mobileTab, setMobileTab] = useState<MobileTab>('quick');

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
  }, [lang]);

  /* Vault State */
  const [encryptedPayload, setEncryptedPayload] = useState<EncryptedVaultPayload | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_VAULT);
      return raw ? (JSON.parse(raw) as EncryptedVaultPayload) : null;
    } catch {
      return null;
    }
  });

  const [sessionPassword, setSessionPassword] = useState<string | null>(null);
  const [isVaultLocked, setIsVaultLocked] = useState<boolean>(() => {
    return Boolean(localStorage.getItem(STORAGE_KEYS.ENCRYPTED_VAULT));
  });

  const [accounts, setAccounts] = useState<VaultAccount[]>(() => {
    if (localStorage.getItem(STORAGE_KEYS.ENCRYPTED_VAULT)) {
      return [];
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PLAIN_ACCOUNTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
      if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
        const demos = createDemoAccounts();
        localStorage.setItem(STORAGE_KEYS.INITIALIZED, '1');
        localStorage.setItem(STORAGE_KEYS.PLAIN_ACCOUNTS, JSON.stringify(demos));
        return demos;
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    if (isVaultLocked) return;

    if (sessionPassword) {
      encryptVaultAccounts(accounts, sessionPassword).then((payload) => {
        setEncryptedPayload(payload);
        localStorage.setItem(STORAGE_KEYS.ENCRYPTED_VAULT, JSON.stringify(payload));
        localStorage.removeItem(STORAGE_KEYS.PLAIN_ACCOUNTS);
      });
    } else if (!encryptedPayload) {
      localStorage.setItem(STORAGE_KEYS.PLAIN_ACCOUNTS, JSON.stringify(accounts));
    }
  }, [accounts, sessionPassword, isVaultLocked, encryptedPayload]);

  /* Smooth Clock Ticker (80ms) */
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 80);
    return () => window.clearInterval(id);
  }, []);

  const [codePairs, setCodePairs] = useState<
    Record<string, { code: string; nextCode: string; cycleIndex: number }>
  >({});

  const cycleSignature = useMemo(() => {
    return accounts
      .map(
        (a) =>
          `${a.id}:${a.secret}:${a.period}:${a.digits}:${a.algorithm}:${Math.floor(nowMs / (a.period * 1000))}`
      )
      .join('|');
  }, [accounts, nowMs]);

  useEffect(() => {
    let cancelled = false;
    if (accounts.length === 0) {
      setCodePairs({});
      return;
    }

    Promise.all(
      accounts.map(async (acc) => {
        const snap = await computeTotpSnapshot(
          acc.secret,
          nowMs,
          acc.period,
          acc.digits,
          acc.algorithm
        );
        return [
          acc.id,
          { code: snap.code, nextCode: snap.nextCode, cycleIndex: snap.cycleIndex },
        ] as const;
      })
    ).then((entries) => {
      if (!cancelled) {
        setCodePairs(Object.fromEntries(entries));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [cycleSignature]); // eslint-disable-line react-hooks/exhaustive-deps

  const liveSnapshots = useMemo(() => {
    const map: Record<string, TotpSnapshot> = {};
    for (const acc of accounts) {
      const pair = codePairs[acc.id];
      if (!pair) continue;
      const metrics = getCycleMetrics(nowMs, acc.period);
      map[acc.id] = {
        code: pair.code,
        nextCode: pair.nextCode,
        ...metrics,
      };
    }
    return map;
  }, [accounts, codePairs, nowMs]);

  /* Dynamic Island Notification */
  const [toast, setToast] = useState<IslandToast | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((next: Omit<IslandToast, 'id'>, duration = 2600) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ ...next, id: `${Date.now()}-${Math.random()}` });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  const performSmartCopy = useCallback(
    (displayName: string, snap: TotpSnapshot) => {
      const isNearExpiry = snap.remainingMs <= 2200;
      const targetCode = isNearExpiry ? snap.nextCode : snap.code;

      navigator.clipboard?.writeText(targetCode).catch(() => {});

      showToast(
        {
          title: isNearExpiry ? t.smartNextCopiedTitle : t.copiedTitle,
          subtitle: t.copiedSubtitle(displayName),
          code: targetCode,
          variant: isNearExpiry ? 'smart-next' : 'copied',
        },
        isNearExpiry ? 3200 : 2400
      );
    },
    [showToast, t]
  );

  const copyPlainText = useCallback(
    (text: string, title: string, subtitle?: string) => {
      navigator.clipboard?.writeText(text).catch(() => {});
      showToast({ title, subtitle, variant: 'copied' });
    },
    [showToast]
  );

  /* Quick Studio & Vault Filters */
  const [quickInput, setQuickInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string>('__ALL__');

  /* Modals */
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<VaultAccount | null>(null);
  const [qrAccount, setQrAccount] = useState<VaultAccount | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const [unlockPwd, setUnlockPwd] = useState('');
  const [unlockErr, setUnlockErr] = useState('');

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragDepthRef = useRef(0);

  const handleDecodedQrContent = useCallback(
    async (rawQrData: string) => {
      const parsed = parseSmartInput(rawQrData);
      if (parsed.length === 0) {
        showToast({ title: t.qrFailedToast, variant: 'warning' });
        return;
      }

      setQuickInput(rawQrData);
      setMobileTab('quick');
      showToast({
        title: t.qrDecodedToast(parsed.length),
        subtitle: parsed[0].issuer ? `${parsed[0].issuer} (${parsed[0].label})` : undefined,
        variant: 'info',
      });

      if (parsed.length === 1) {
        const entry = parsed[0];
        const snap = await computeTotpSnapshot(
          entry.secret,
          Date.now(),
          entry.period,
          entry.digits,
          entry.algorithm
        );
        performSmartCopy(entry.issuer || entry.label, snap);
      }
    },
    [performSmartCopy, showToast, t]
  );

  const handleQrImageBlob = useCallback(
    async (blob: Blob) => {
      try {
        const decoded = await decodeQrFromBlob(blob);
        if (!decoded) {
          showToast({ title: t.qrFailedToast, variant: 'warning' });
          return;
        }
        await handleDecodedQrContent(decoded);
      } catch {
        showToast({ title: t.qrFailedToast, variant: 'error' });
      }
    },
    [handleDecodedQrContent, showToast, t]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!isVaultLocked) setCmdOpen((v) => !v);
      }
    };

    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) handleQrImageBlob(file);
          return;
        }
      }

      const activeEl = document.activeElement;
      const isTypingField =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl as HTMLElement | null)?.isContentEditable;

      if (!isTypingField) {
        const text = e.clipboardData?.getData('text/plain');
        if (text && parseSmartInput(text).length > 0) {
          e.preventDefault();
          setQuickInput(text);
          setMobileTab('quick');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('paste', onPaste);
    };
  }, [handleQrImageBlob, isVaultLocked]);

  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        dragDepthRef.current += 1;
        setIsDraggingFile(true);
      }
    };
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
    };
    const onDragLeave = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) setIsDraggingFile(false);
      }
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragDepthRef.current = 0;
      setIsDraggingFile(false);
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith('image/')) {
        handleQrImageBlob(file);
      }
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [handleQrImageBlob]);

  const savedSecretsSet = useMemo(
    () => new Set(accounts.map((a) => a.secret)),
    [accounts]
  );

  const handleSaveEntryToVault = useCallback(
    (entry: ParsedEntry) => {
      if (isVaultLocked) {
        showToast({ title: t.vaultLockedTitle, variant: 'warning' });
        return;
      }
      setAccounts((prev) => {
        if (prev.some((a) => a.secret === entry.secret)) return prev;
        const created: VaultAccount = {
          id: crypto.randomUUID ? crypto.randomUUID() : `acc-${Date.now()}`,
          issuer: entry.issuer === 'Quick 2FA' ? 'Account' : entry.issuer,
          label: entry.label,
          secret: entry.secret,
          digits: entry.digits,
          period: entry.period,
          algorithm: entry.algorithm,
          pinned: false,
          tags: [],
          createdAt: Date.now(),
        };
        return [created, ...prev];
      });
      showToast({ title: t.savedToast(entry.issuer || entry.label), variant: 'copied' });
    },
    [isVaultLocked, showToast, t]
  );

  const handleSaveAllToVault = useCallback(
    (entries: ParsedEntry[]) => {
      if (isVaultLocked) {
        showToast({ title: t.vaultLockedTitle, variant: 'warning' });
        return;
      }
      let addedCount = 0;
      setAccounts((prev) => {
        const existing = new Set(prev.map((a) => a.secret));
        const toAdd: VaultAccount[] = [];
        for (const entry of entries) {
          if (existing.has(entry.secret)) continue;
          existing.add(entry.secret);
          addedCount++;
          toAdd.push({
            id: crypto.randomUUID ? crypto.randomUUID() : `acc-${Date.now()}-${addedCount}`,
            issuer: entry.issuer === 'Quick 2FA' ? 'Account' : entry.issuer,
            label: entry.label,
            secret: entry.secret,
            digits: entry.digits,
            period: entry.period,
            algorithm: entry.algorithm,
            pinned: false,
            tags: [],
            createdAt: Date.now() + addedCount,
          });
        }
        return [...toAdd, ...prev];
      });
      showToast({ title: t.savedBulkToast(addedCount), variant: 'copied' });
    },
    [isVaultLocked, showToast, t]
  );

  const handleUpsertAccount = (
    data: Omit<VaultAccount, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === existingId ? { ...acc, ...data, isDemo: false } : acc))
      );
      showToast({ title: t.savedToast(data.issuer), variant: 'copied' });
    } else {
      const nextAcc: VaultAccount = {
        ...data,
        id: crypto.randomUUID ? crypto.randomUUID() : `acc-${Date.now()}`,
        createdAt: Date.now(),
      };
      setAccounts((prev) => [nextAcc, ...prev]);
      showToast({ title: t.savedToast(data.issuer), variant: 'copied' });
    }
  };

  const handleTogglePin = useCallback((id: string) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, pinned: !acc.pinned } : acc))
    );
  }, []);

  const handleDeleteAccount = useCallback(
    (account: VaultAccount) => {
      setAccounts((prev) => prev.filter((a) => a.id !== account.id));
      showToast({ title: t.deletedToast(account.issuer), variant: 'info' });
    },
    [showToast, t]
  );

  const hasDemoCards = useMemo(() => accounts.some((a) => a.isDemo), [accounts]);

  const handleLoadDemos = () => {
    const demos = createDemoAccounts();
    setAccounts((prev) => {
      const secrets = new Set(prev.map((a) => a.secret));
      return [...prev, ...demos.filter((d) => !secrets.has(d.secret))];
    });
  };

  const handleClearDemos = () => {
    setAccounts((prev) => prev.filter((a) => !a.isDemo));
  };

  const handleEnablePassword = async (pwd: string) => {
    const payload = await encryptVaultAccounts(accounts, pwd);
    setEncryptedPayload(payload);
    setSessionPassword(pwd);
    setIsVaultLocked(false);
    localStorage.setItem(STORAGE_KEYS.ENCRYPTED_VAULT, JSON.stringify(payload));
    localStorage.removeItem(STORAGE_KEYS.PLAIN_ACCOUNTS);
    showToast({ title: 'Đã bật mã hóa kho AES-256-GCM', variant: 'copied' });
  };

  const handleRemovePassword = () => {
    setSessionPassword(null);
    setEncryptedPayload(null);
    setIsVaultLocked(false);
    localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_VAULT);
    localStorage.setItem(STORAGE_KEYS.PLAIN_ACCOUNTS, JSON.stringify(accounts));
    showToast({ title: 'Đã gỡ mật khẩu kho', variant: 'info' });
  };

  const handleLockNow = () => {
    if (!encryptedPayload) {
      setSecurityOpen(true);
      return;
    }
    setAccounts([]);
    setSessionPassword(null);
    setIsVaultLocked(true);
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encryptedPayload) return;
    try {
      const decrypted = await decryptVaultAccounts(encryptedPayload, unlockPwd);
      setAccounts(decrypted);
      setSessionPassword(unlockPwd);
      setIsVaultLocked(false);
      setUnlockPwd('');
      setUnlockErr('');
    } catch {
      setUnlockErr(t.wrongPasswordError);
    }
  };

  const handleResetLockedVault = () => {
    if (!window.confirm('Xóa toàn bộ kho đã mã hóa trên trình duyệt này để tạo mới?')) return;
    localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_VAULT);
    setEncryptedPayload(null);
    setSessionPassword(null);
    setIsVaultLocked(false);
    setAccounts([]);
  };

  const handleExportJson = () => {
    const backup: Z2FABackupFile = {
      app: 'Z2FA',
      version: 1,
      exportedAt: new Date().toISOString(),
      encrypted: false,
      accounts,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `z2fa-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJsonFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<Z2FABackupFile> | VaultAccount[];
      const importedList = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.accounts)
          ? parsed.accounts
          : [];

      if (importedList.length === 0) {
        showToast({ title: 'File Backup không có tài khoản hợp lệ', variant: 'warning' });
        return;
      }

      let count = 0;
      setAccounts((prev) => {
        const secrets = new Set(prev.map((a) => a.secret));
        const merged = [...prev];
        for (const item of importedList) {
          if (item?.secret && !secrets.has(item.secret)) {
            secrets.add(item.secret);
            count++;
            merged.push({
              id: item.id || crypto.randomUUID(),
              issuer: item.issuer || 'Account',
              label: item.label || '2FA',
              secret: item.secret,
              digits: item.digits === 8 ? 8 : 6,
              period: item.period || 30,
              algorithm: item.algorithm || 'SHA-1',
              pinned: Boolean(item.pinned),
              tags: Array.isArray(item.tags) ? item.tags : [],
              isDemo: false,
              createdAt: item.createdAt || Date.now(),
            });
          }
        }
        return merged;
      });
      showToast({ title: t.importSuccessToast(count), variant: 'copied' });
    } catch {
      showToast({ title: 'Không thể đọc file Backup JSON', variant: 'error' });
    }
  };

  const handleMobileInstantPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setQuickInput(text);
        setMobileTab('quick');
        return;
      }
    } catch {
      // Fallback to switching tab
    }
    setMobileTab('quick');
  };

  const allTags = useMemo(() => {
    const set = new Set<string>();
    accounts.forEach((acc) => (acc.tags || []).forEach((tg) => set.add(tg)));
    return Array.from(set);
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return accounts
      .filter((acc) => {
        if (activeTag === '__PINNED__' && !acc.pinned) return false;
        if (
          activeTag !== '__ALL__' &&
          activeTag !== '__PINNED__' &&
          !(acc.tags || []).includes(activeTag)
        ) {
          return false;
        }
        if (!q) return true;
        return (
          acc.issuer.toLowerCase().includes(q) ||
          acc.label.toLowerCase().includes(q) ||
          (acc.tags || []).some((tg) => tg.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
        return b.createdAt - a.createdAt;
      });
  }, [accounts, activeTag, searchQuery]);

  /* Reusable Vault Section Content */
  const renderVaultSection = () => (
    <section className="space-y-4 sm:space-y-6">
      {/* Mobile App Quick-Paste Shortcut Banner (Visible on Mobile Vault Tab) */}
      <div className="flex items-center justify-between gap-2 rounded-[16px] border border-[#ebe8e4] bg-[#f5f3f1] p-2.5 pl-3.5 md:hidden dark:border-[#292623] dark:bg-[#191816]">
        <button
          type="button"
          onClick={() => setMobileTab('quick')}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <Zap className="h-4 w-4 flex-shrink-0 text-[#ff4704]" />
          <span className="truncate text-[13px] text-[#777169] dark:text-[#a59f97]">
            {lang === 'vi' ? 'Dán Secret / UID|PASS|2FA lấy mã ngay...' : 'Paste Secret / QR for instant code...'}
          </span>
        </button>
        <button
          type="button"
          onClick={handleMobileInstantPaste}
          className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-[#000000] px-3 py-1.5 text-[12px] font-medium text-[#fdfcfc] active:scale-95 dark:bg-[#fdfcfc] dark:text-[#000000]"
        >
          <ClipboardPaste className="h-3.5 w-3.5" />
          <span>{t.pasteClipboardBtn}</span>
        </button>
      </div>

      {/* Desktop Section Header (Compact on Mobile since Top App Bar already frames it) */}
      <div className="hidden justify-between gap-4 md:flex md:items-end">
        <div>
          <div className="flex items-baseline gap-3">
            <h2 className="font-editorial-display text-[32px] leading-[1.13] text-[#000000] sm:text-[36px] dark:text-[#fdfcfc]">
              {t.vaultTitle}
            </h2>
            {!isVaultLocked && (
              <span className="font-mono-tabular rounded-full border border-[#ebe8e4] bg-[#f5f3f1] px-2.5 py-0.5 text-[12px] text-[#777169] dark:border-[#292623] dark:bg-[#191816] dark:text-[#a59f97]">
                {accounts.length}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[14px] text-[#777169] sm:text-[15px] dark:text-[#a59f97]">
            {t.vaultSubtitle}
          </p>
        </div>

        {!isVaultLocked && (
          <div className="flex flex-wrap items-center gap-2">
            {hasDemoCards ? (
              <button
                type="button"
                onClick={handleClearDemos}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-[#fdfcfc] px-4 py-2 text-[14px] font-medium text-[#000000] transition-colors hover:bg-[#f5f3f1] dark:border-[#2f2c28] dark:bg-[#191816] dark:text-[#fdfcfc]"
              >
                <Trash2 className="h-3.5 w-3.5 text-[#777169]" />
                <span>{t.clearDemoBtn}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLoadDemos}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-[#fdfcfc] px-4 py-2 text-[14px] font-medium text-[#000000] transition-colors hover:bg-[#f5f3f1] dark:border-[#2f2c28] dark:bg-[#191816] dark:text-[#fdfcfc]"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#777169]" />
                <span>{t.loadDemoBtn}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setEditingAccount(null);
                setAccountModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#000000] bg-[#000000] px-5 py-2 text-[14px] font-medium text-[#fdfcfc] transition-opacity hover:opacity-85 active:scale-97 dark:border-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#000000]"
            >
              <Plus className="h-4 w-4" />
              <span>{t.addAccountBtn}</span>
            </button>
          </div>
        )}
      </div>

      {/* LOCKED VAULT PANEL */}
      {isVaultLocked ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md rounded-[24px] bg-[#f5f3f1] p-6 sm:p-8 text-center dark:bg-[#191816]"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#ebe8e4] text-[#000000] dark:bg-[#262421] dark:text-[#fdfcfc]">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="font-editorial-display mt-4 text-[26px] leading-[1.15] text-[#000000] dark:text-[#fdfcfc]">
            {t.vaultLockedTitle}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[#777169] dark:text-[#a59f97]">
            {t.vaultLockedDesc}
          </p>

          <form onSubmit={handleUnlockSubmit} className="mt-6 space-y-3">
            <input
              type="password"
              value={unlockPwd}
              onChange={(e) => {
                setUnlockPwd(e.target.value);
                setUnlockErr('');
              }}
              placeholder={t.enterPasswordPlaceholder}
              className="inset-hairline w-full rounded-[8px] border border-[#ebe8e4] bg-[#fdfcfc] px-4 py-2.5 text-center text-[16px] sm:text-[14px] text-[#000000] focus:border-[#000000] focus:outline-none dark:border-[#292623] dark:bg-[#11100f] dark:text-[#fdfcfc]"
            />
            {unlockErr && <p className="text-[12px] text-[#44403b]">{unlockErr}</p>}
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#000000] bg-[#000000] px-5 py-2.5 text-[14px] font-medium text-[#fdfcfc] hover:opacity-85 active:scale-98 dark:border-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#000000]"
            >
              <LockOpen className="h-4 w-4" />
              <span>{t.unlockAction}</span>
            </button>
          </form>

          <button
            type="button"
            onClick={handleResetLockedVault}
            className="mt-4 text-[12px] text-[#a59f97] underline-offset-4 hover:text-[#000000] hover:underline dark:hover:text-[#fdfcfc]"
          >
            {t.resetVaultWarning}
          </button>
        </motion.div>
      ) : (
        <>
          {/* App Search + Horizontal Swipeable Tab Pills */}
          {accounts.length > 0 && (
            <div className="flex flex-col gap-3 sm:flex-row-reverse sm:items-center sm:justify-between">
              {/* App Search Input (16px on mobile so iOS never zooms) */}
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#a59f97]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="inset-hairline w-full rounded-full sm:rounded-[8px] border border-[#ebe8e4] bg-[#fdfcfc] py-2.5 sm:py-2 pr-8 pl-10 text-[16px] sm:text-[13px] text-[#000000] placeholder:text-[14px] placeholder:text-[#a59f97] focus:border-[#000000] focus:outline-none dark:border-[#292623] dark:bg-[#191816] dark:text-[#fdfcfc]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-[#a59f97] hover:text-[#000000] dark:hover:text-[#fdfcfc]"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Horizontal Swipeable Category Pills */}
              <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                {[
                  { id: '__ALL__', label: t.allTags, dotColor: '#ff4704' },
                  ...(accounts.some((a) => a.pinned)
                    ? [{ id: '__PINNED__', label: t.pinnedTag, icon: true, dotColor: '#0447ff' }]
                    : []),
                  ...allTags.map((tg, i) => ({
                    id: tg,
                    label: tg,
                    dotColor: i % 2 === 0 ? '#0447ff' : '#ff4704',
                  })),
                ].map((tab) => {
                  const active = activeTag === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTag(tab.id)}
                      className={`inline-flex flex-shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                        active
                          ? 'border-[#000000] bg-[#fdfcfc] text-[#000000] dark:border-[#fdfcfc] dark:bg-[#191816] dark:text-[#fdfcfc]'
                          : 'border-[#ebe8e4] bg-[#fdfcfc] text-[#777169] hover:border-[#a59f97] hover:text-[#000000] dark:border-[#292623] dark:bg-[#11100f] dark:text-[#a59f97] dark:hover:text-[#fdfcfc]'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="activeTabDot"
                          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: tab.dotColor }}
                        />
                      )}
                      <span className="flex items-center gap-1">
                        {'icon' in tab && tab.icon && <Pin className="h-3 w-3" />}
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vault Grid */}
          {accounts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center rounded-[24px] bg-[#f5f3f1] px-6 py-14 text-center dark:bg-[#191816]"
            >
              <Z2FALogo size={48} showWordmark={false} />
              <h3 className="font-editorial-display mt-5 text-[26px] leading-[1.15] text-[#000000] dark:text-[#fdfcfc]">
                {t.emptyVaultTitle}
              </h3>
              <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[#777169] dark:text-[#a59f97]">
                {t.emptyVaultDesc}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleLoadDemos}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-[#fdfcfc] px-4 py-2 text-[14px] font-medium text-[#000000] hover:bg-[#ebe8e4]/60 dark:border-[#2f2c28] dark:bg-[#11100f] dark:text-[#fdfcfc]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{t.loadDemoBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAccount(null);
                    setAccountModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#000000] bg-[#000000] px-5 py-2 text-[14px] font-medium text-[#fdfcfc] hover:opacity-85 dark:border-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#000000]"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t.addAccountBtn}</span>
                </button>
              </div>
            </motion.div>
          ) : filteredAccounts.length === 0 ? (
            <div className="rounded-[20px] bg-[#f5f3f1] py-12 text-center dark:bg-[#191816]">
              <p className="text-[15px] font-medium text-[#000000] dark:text-[#fdfcfc]">
                {t.noSearchMatchTitle}
              </p>
              <p className="mt-1 text-[13px] text-[#777169] dark:text-[#a59f97]">
                {t.noSearchMatchDesc}
              </p>
            </div>
          ) : (
            <LayoutGroup>
              <motion.div
                layout
                className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
              >
                <AnimatePresence mode="popLayout">
                  {filteredAccounts.map((acc) => (
                    <TotpCard
                      key={acc.id}
                      account={acc}
                      snapshot={liveSnapshots[acc.id]}
                      t={t}
                      onSmartCopy={(account, snap) =>
                        performSmartCopy(`${account.issuer} (${account.label})`, snap)
                      }
                      onTogglePin={handleTogglePin}
                      onShowQr={setQrAccount}
                      onEdit={(account) => {
                        setEditingAccount(account);
                        setAccountModalOpen(true);
                      }}
                      onDelete={handleDeleteAccount}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </LayoutGroup>
          )}
        </>
      )}
    </section>
  );

  /* Native Mobile Settings / Security / Backup Tab (< md) */
  const renderMobileSettingsTab = () => (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 md:hidden"
    >
      <div className="rounded-[22px] bg-[#f5f3f1] p-5 dark:bg-[#191816]">
        <h2 className="font-editorial-display text-[28px] leading-[1.15] text-[#000000] dark:text-[#fdfcfc]">
          {lang === 'vi' ? 'Bảo mật & Dữ liệu' : 'Security & Data'}
        </h2>
        <p className="mt-1 text-[13px] text-[#777169] dark:text-[#a59f97]">
          {t.vaultSubtitle}
        </p>

        <div className="mt-5 divide-y divide-[#ebe8e4] overflow-hidden rounded-[16px] border border-[#ebe8e4] bg-[#fdfcfc] dark:divide-[#292623] dark:border-[#292623] dark:bg-[#11100f]">
          <button
            type="button"
            onClick={() => setSecurityOpen(true)}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-[#f5f3f1] dark:active:bg-[#191816]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#0447ff]/10 text-[#0447ff]">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-[#000000] dark:text-[#fdfcfc]">
                  {t.setupLockBtn} (AES-256)
                </p>
                <p className="text-[12px] text-[#777169]">
                  {encryptedPayload
                    ? lang === 'vi'
                      ? 'Đang bật bảo vệ mật khẩu'
                      : 'Password protection active'
                    : lang === 'vi'
                      ? 'Chưa đặt mật khẩu kho'
                      : 'Unlocked quick access'}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#a59f97]" />
          </button>

          {encryptedPayload && !isVaultLocked && (
            <button
              type="button"
              onClick={() => {
                handleLockNow();
                setMobileTab('vault');
              }}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-[#f5f3f1] dark:active:bg-[#191816]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#ff4704]/10 text-[#ff4704]">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-[#000000] dark:text-[#fdfcfc]">
                    {t.lockVaultBtn}
                  </p>
                  <p className="text-[12px] text-[#777169]">
                    {lang === 'vi' ? 'Khóa ngay phiên làm việc hiện tại' : 'Lock current session immediately'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#a59f97]" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setBackupOpen(true)}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-[#f5f3f1] dark:active:bg-[#191816]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#10B981]/12 text-[#059669]">
                <DatabaseBackup className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-[#000000] dark:text-[#fdfcfc]">
                  {t.backupBtn}
                </p>
                <p className="text-[12px] text-[#777169]">
                  {lang === 'vi' ? `${accounts.length} tài khoản trong kho` : `${accounts.length} saved accounts`}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#a59f97]" />
          </button>

          <button
            type="button"
            onClick={hasDemoCards ? handleClearDemos : handleLoadDemos}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-[#f5f3f1] dark:active:bg-[#191816]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F59E0B]/12 text-[#D97706]">
                {hasDemoCards ? <Trash2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-[14px] font-medium text-[#000000] dark:text-[#fdfcfc]">
                  {hasDemoCards ? t.clearDemoBtn : t.loadDemoBtn}
                </p>
                <p className="text-[12px] text-[#777169]">
                  {lang === 'vi' ? 'Quản lý các thẻ trải nghiệm mẫu' : 'Manage sample demo cards'}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#a59f97]" />
          </button>
        </div>
      </div>
    </motion.section>
  );

  return (
    <div className="relative min-h-[100dvh] bg-[var(--surface-canvas)] pb-28 md:pb-24">
      {/* Dynamic Island Notification */}
      <DynamicIslandToast toast={toast} onDismiss={() => setToast(null)} />

      {/* Full-Window Drag & Drop QR Overlay */}
      <AnimatePresence>
        {isDraggingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#fdfcfc]/90 p-6 backdrop-blur-md dark:bg-[#11100f]/90"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              className="flex max-w-md flex-col items-center rounded-[24px] border border-[#000000] bg-[#f5f3f1] px-10 py-12 text-center dark:border-[#fdfcfc] dark:bg-[#191816]"
            >
              <div className="product-sphere-orb flex h-16 w-16 items-center justify-center rounded-full">
                <ImageUp className="h-7 w-7 text-[#000000]" />
              </div>
              <h3 className="font-editorial-display mt-5 text-[28px] leading-[1.13] text-[#000000] dark:text-[#fdfcfc]">
                {t.dropOverlayTitle}
              </h3>
              <p className="mt-2 text-[13px] text-[#777169] dark:text-[#a59f97]">
                {t.dropOverlayDesc}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation Bar (Sticky Frosted App Header on Mobile, Editorial Bar on Desktop) */}
      <header className="sticky top-0 z-30 border-b border-[#ebe8e4] bg-[#fdfcfc]/88 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:static md:bg-transparent md:backdrop-blur-none dark:border-[#292623] dark:bg-[#11100f]/88 md:dark:bg-transparent">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-2.5 sm:px-10 sm:py-3.5 lg:px-16">
          <Z2FALogo size={34} subtitle={t.subtitle} />

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {!isVaultLocked && (
              <button
                type="button"
                onClick={() => setCmdOpen(true)}
                aria-label="Quick search"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e5e5] bg-[#fdfcfc] text-[#44403b] md:hidden dark:border-[#2f2c28] dark:bg-[#191816] dark:text-[#fdfcfc]"
              >
                <Search className="h-4 w-4" />
              </button>
            )}

            {!isVaultLocked && (
              <button
                type="button"
                onClick={() => setCmdOpen(true)}
                className="hidden items-center gap-2.5 rounded-full border border-[#e5e5e5] bg-[#fdfcfc] px-3.5 py-1.5 text-[13px] text-[#777169] transition-colors hover:border-[#000000] hover:text-[#000000] md:inline-flex dark:border-[#2f2c28] dark:bg-[#191816] dark:text-[#a59f97] dark:hover:text-[#fdfcfc]"
              >
                <Search className="h-3.5 w-3.5 text-[#777169]" />
                <span>{t.searchPlaceholder}</span>
                <kbd className="font-mono-tabular rounded-full border border-[#ebe8e4] bg-[#f5f3f1] px-2 py-0.2 text-[10px] text-[#777169] dark:border-[#292623] dark:bg-[#11100f]">
                  ⌘K
                </kbd>
              </button>
            )}

            {!isVaultLocked && (
              <button
                type="button"
                onClick={encryptedPayload ? handleLockNow : () => setSecurityOpen(true)}
                title={encryptedPayload ? t.lockVaultBtn : t.setupLockBtn}
                className="hidden items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-[#fdfcfc] px-3.5 py-1.5 text-[13px] font-medium text-[#000000] transition-colors hover:bg-[#f5f3f1] md:inline-flex dark:border-[#2f2c28] dark:bg-[#191816] dark:text-[#fdfcfc]"
              >
                {encryptedPayload ? (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    <span>{t.lockVaultBtn}</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-3.5 w-3.5 text-[#777169]" />
                    <span>{t.setupLockBtn}</span>
                  </>
                )}
              </button>
            )}

            {encryptedPayload && !isVaultLocked && (
              <button
                type="button"
                onClick={() => setSecurityOpen(true)}
                title="Cài đặt mã hóa"
                className="hidden rounded-full border border-[#e5e5e5] bg-[#fdfcfc] p-2 text-[#000000] hover:bg-[#f5f3f1] md:inline-flex dark:border-[#2f2c28] dark:bg-[#191816] dark:text-[#fdfcfc]"
              >
                <Shield className="h-3.5 w-3.5" />
              </button>
            )}

            {!isVaultLocked && (
              <button
                type="button"
                onClick={() => setBackupOpen(true)}
                title={t.backupBtn}
                className="hidden items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-[#fdfcfc] px-3.5 py-1.5 text-[13px] font-medium text-[#000000] transition-colors hover:bg-[#f5f3f1] md:inline-flex dark:border-[#2f2c28] dark:bg-[#191816] dark:text-[#fdfcfc]"
              >
                <DatabaseBackup className="h-3.5 w-3.5 text-[#777169]" />
                <span className="hidden lg:inline">{t.backupBtn}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setLang((l) => (l === 'vi' ? 'en' : 'vi'))}
              className="font-mono-tabular flex h-9 items-center justify-center rounded-full border border-[#e5e5e5] bg-[#fdfcfc] px-3 text-[12px] font-medium text-[#000000] transition-colors hover:bg-[#f5f3f1] dark:border-[#2f2c28] dark:bg-[#191816] dark:text-[#fdfcfc]"
            >
              {lang.toUpperCase()}
            </button>

            <button
              type="button"
              onClick={() => setTheme((th) => (th === 'dark' ? 'light' : 'dark'))}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e5e5] bg-[#fdfcfc] text-[#000000] transition-colors hover:bg-[#f5f3f1] dark:border-[#2f2c28] dark:bg-[#191816] dark:text-[#fdfcfc]"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4 text-[#44403b]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container: Tabbed Native App View on Mobile (< md), Unified Editorial Workspace on Desktop (>= md) */}
      <main className="mx-auto max-w-[1280px] px-4 pt-4 sm:px-10 sm:pt-10 lg:px-16">
        {/* DESKTOP UNIFIED WORKSPACE (>= md) */}
        <div className="hidden md:block">
          <QuickStudio
            inputValue={quickInput}
            onInputChange={setQuickInput}
            nowMs={nowMs}
            savedSecretsSet={savedSecretsSet}
            t={t}
            onSmartCopyEntry={performSmartCopy}
            onSaveEntryToVault={handleSaveEntryToVault}
            onSaveAllToVault={handleSaveAllToVault}
            onCopyTextDirect={copyPlainText}
            onUploadQrFile={handleQrImageBlob}
            onOpenCamera={() => setCameraOpen(true)}
          />

          <hr className="my-12 border-t border-[#ebe8e4] sm:my-14 dark:border-[#292623]" />

          {renderVaultSection()}
        </div>

        {/* MOBILE APP TABBED SHELL (< md) */}
        <div className="md:hidden">
          {mobileTab === 'vault' && renderVaultSection()}

          {mobileTab === 'quick' && (
            <motion.div
              key="mobile-quick"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <QuickStudio
                inputValue={quickInput}
                onInputChange={setQuickInput}
                nowMs={nowMs}
                savedSecretsSet={savedSecretsSet}
                t={t}
                onSmartCopyEntry={performSmartCopy}
                onSaveEntryToVault={handleSaveEntryToVault}
                onSaveAllToVault={handleSaveAllToVault}
                onCopyTextDirect={copyPlainText}
                onUploadQrFile={handleQrImageBlob}
                onOpenCamera={() => setCameraOpen(true)}
              />
            </motion.div>
          )}

          {mobileTab === 'settings' && renderMobileSettingsTab()}
        </div>
      </main>

      {/* Native Mobile Bottom Tab Bar (< md, Thumb-Zone Navigation + Safe Area Inset) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ebe8e4] bg-[#fdfcfc]/92 px-3 pt-2 pb-[max(0.55rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden dark:border-[#292623] dark:bg-[#11100f]/92"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-center">
          {/* Tab 1 (Default): Quick Studio */}
          <button
            type="button"
            onClick={() => setMobileTab('quick')}
            className={`flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors ${
              mobileTab === 'quick'
                ? 'text-[#000000] dark:text-[#fdfcfc]'
                : 'text-[#a59f97]'
            }`}
          >
            <Zap className="h-5 w-5" />
            <span>{lang === 'vi' ? 'Lấy nhanh' : 'Instant'}</span>
          </button>

          {/* Tab 2: Vault */}
          <button
            type="button"
            onClick={() => setMobileTab('vault')}
            className={`relative flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors ${
              mobileTab === 'vault'
                ? 'text-[#000000] dark:text-[#fdfcfc]'
                : 'text-[#a59f97]'
            }`}
          >
            <LayoutGrid className="h-5 w-5" />
            <span>{lang === 'vi' ? 'Kho 2FA' : 'Vault'}</span>
          </button>

          {/* Center Primary Action Pill (+ Add Account) */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                setEditingAccount(null);
                setAccountModalOpen(true);
              }}
              aria-label={t.addAccountBtn}
              className="whisper-shadow -mt-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#000000] bg-[#000000] text-[#fdfcfc] transition-transform active:scale-92 dark:border-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#000000]"
            >
              <Plus className="h-5 w-5 stroke-[2.4]" />
            </button>
          </div>

          {/* Action 4: Scan Camera QR */}
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium text-[#a59f97] active:text-[#000000] dark:active:text-[#fdfcfc]"
          >
            <Camera className="h-5 w-5" />
            <span>{lang === 'vi' ? 'Quét QR' : 'Scan QR'}</span>
          </button>

          {/* Tab 5: Settings / Security / Backup */}
          <button
            type="button"
            onClick={() => setMobileTab('settings')}
            className={`flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors ${
              mobileTab === 'settings'
                ? 'text-[#000000] dark:text-[#fdfcfc]'
                : 'text-[#a59f97]'
            }`}
          >
            <Settings2 className="h-5 w-5" />
            <span>{lang === 'vi' ? 'Tiện ích' : 'Tools'}</span>
          </button>
        </div>
      </nav>

      {/* Modals & Bottom Sheets */}
      <AccountFormModal
        open={accountModalOpen}
        editing={editingAccount}
        t={t}
        onClose={() => setAccountModalOpen(false)}
        onSubmit={handleUpsertAccount}
      />

      <QrShareModal
        account={qrAccount}
        t={t}
        onClose={() => setQrAccount(null)}
        onCopyUri={(uri) => copyPlainText(uri, t.copiedTitle, 'otpauth:// URI')}
      />

      <CameraScannerModal
        open={cameraOpen}
        t={t}
        onClose={() => setCameraOpen(false)}
        onDecoded={handleDecodedQrContent}
      />

      <VaultSecurityModal
        open={securityOpen}
        hasPassword={Boolean(encryptedPayload)}
        t={t}
        onClose={() => setSecurityOpen(false)}
        onEnablePassword={handleEnablePassword}
        onRemovePassword={handleRemovePassword}
      />

      <BackupRestoreModal
        open={backupOpen}
        t={t}
        accountCount={accounts.length}
        onClose={() => setBackupOpen(false)}
        onExportJson={handleExportJson}
        onImportJsonFile={handleImportJsonFile}
      />

      <CommandPaletteModal
        open={cmdOpen}
        accounts={filteredAccounts.length > 0 ? filteredAccounts : accounts}
        snapshots={liveSnapshots}
        t={t}
        onClose={() => setCmdOpen(false)}
        onSmartCopy={(account, snap) =>
          performSmartCopy(`${account.issuer} (${account.label})`, snap)
        }
      />
    </div>
  );
};

export default App;
