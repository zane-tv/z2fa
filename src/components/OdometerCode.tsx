import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface OdometerDigitProps {
  digit: string;
  index: number;
  reduced: boolean;
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const OdometerDigit: React.FC<OdometerDigitProps> = React.memo(({ digit, index, reduced }) => {
  const numeric = Number.isNaN(Number(digit)) ? 0 : Number(digit);

  return (
    <span
      className="relative inline-block overflow-hidden align-bottom"
      style={{ height: '1.16em', lineHeight: '1.16em', width: '0.61em' }}
    >
      <motion.span
        className="flex flex-col items-center will-change-transform"
        animate={{ y: `${-numeric * 10}%` }}
        transition={
          reduced
            ? { duration: 0 }
            : {
                type: 'spring',
                stiffness: 390,
                damping: 31,
                mass: 0.72,
                delay: index * 0.022,
              }
        }
      >
        {DIGITS.map((d) => (
          <span
            key={d}
            className="flex items-center justify-center select-none"
            style={{ height: '1.16em', lineHeight: '1.16em' }}
          >
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
});

OdometerDigit.displayName = 'OdometerDigit';

interface OdometerCodeProps {
  code: string;
  remainingSec: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const OdometerCode: React.FC<OdometerCodeProps> = ({
  code,
  remainingSec,
  size = 'md',
  className = '',
}) => {
  const prefersReduced = useReducedMotion() ?? false;
  const half = Math.ceil(code.length / 2);
  const firstGroup = code.slice(0, half).split('');
  const secondGroup = code.slice(half).split('');

  const toneClass =
    remainingSec <= 4
      ? 'text-[#44403b] dark:text-[#ebe8e4]'
      : 'text-[#000000] dark:text-[#fdfcfc]';

  const sizeClass =
    size === 'lg'
      ? 'text-[2.25rem] sm:text-[2.65rem] font-normal tracking-[-0.03em]'
      : size === 'sm'
        ? 'text-[1.25rem] font-normal tracking-[-0.02em]'
        : 'text-[1.95rem] sm:text-[2.1rem] font-normal tracking-[-0.025em]';

  return (
    <div
      className={`font-mono-tabular inline-flex items-center transition-colors duration-300 ${sizeClass} ${toneClass} ${className}`}
      aria-label={`Mã 2FA ${code.slice(0, half)} ${code.slice(half)}`}
    >
      <span className="inline-flex items-center">
        {firstGroup.map((char, idx) => (
          <OdometerDigit key={`g1-${idx}`} digit={char} index={idx} reduced={prefersReduced} />
        ))}
      </span>

      {/* Product Spark Dot: quiet Ash normally, Ember Orange #ff4704 pulse when <= 5s */}
      <motion.span
        className="mx-2.5 inline-block h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor: remainingSec <= 5 ? '#ff4704' : '#a59f97',
        }}
        animate={
          remainingSec <= 5
            ? { scale: [1, 1.45, 1], opacity: [0.6, 1, 0.6] }
            : { scale: 1, opacity: 0.55 }
        }
        transition={
          remainingSec <= 5
            ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.2 }
        }
      />

      <span className="inline-flex items-center">
        {secondGroup.map((char, idx) => (
          <OdometerDigit
            key={`g2-${idx}`}
            digit={char}
            index={half + idx}
            reduced={prefersReduced}
          />
        ))}
      </span>
    </div>
  );
};
