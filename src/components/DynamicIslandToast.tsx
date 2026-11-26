import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, Info } from 'lucide-react';
import type { IslandToast } from '../types';

interface DynamicIslandToastProps {
  toast: IslandToast | null;
  onDismiss: () => void;
}

export const DynamicIslandToast: React.FC<DynamicIslandToastProps> = ({ toast, onDismiss }) => {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center px-4">
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 460,
              damping: 32,
              mass: 0.75,
            }}
            onClick={onDismiss}
            className="whisper-shadow pointer-events-auto flex max-w-md cursor-pointer items-center gap-3 rounded-full border border-[#000000] bg-[#000000] px-4 py-2 text-[#fdfcfc] dark:border-[#2f2c28] dark:bg-[#fdfcfc] dark:text-[#000000]"
          >
            {/* Status Circle (Audio-Sphere miniature orb on smart-next, crisp Ink/Eggshell otherwise) */}
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 520, damping: 22 }}
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                toast.variant === 'smart-next'
                  ? 'product-sphere-orb bg-[#fdfcfc] text-[#000000]'
                  : 'bg-[#fdfcfc] text-[#000000] dark:bg-[#000000] dark:text-[#fdfcfc]'
              }`}
            >
              {toast.variant === 'error' || toast.variant === 'warning' ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : toast.variant === 'info' ? (
                <Info className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              )}
            </motion.div>

            {/* Editorial Copy */}
            <div className="min-w-0 flex-1 pr-1">
              <p className="truncate text-[13px] font-medium tracking-[0.01em]">
                {toast.title}
              </p>
              {toast.subtitle && (
                <p className="truncate text-[11px] text-[#a59f97] dark:text-[#777169]">
                  {toast.subtitle}
                </p>
              )}
            </div>

            {/* Geist Mono Code Pill */}
            {toast.code && (
              <span className="font-mono-tabular flex-shrink-0 rounded-full border border-white/20 bg-white/12 px-2.5 py-0.5 text-[12px] tracking-wider text-[#fdfcfc] dark:border-black/15 dark:bg-black/8 dark:text-[#000000]">
                {toast.code.slice(0, Math.ceil(toast.code.length / 2))}{' '}
                {toast.code.slice(Math.ceil(toast.code.length / 2))}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
