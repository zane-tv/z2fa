import React, { useId } from 'react';
import { motion } from 'framer-motion';

interface Z2FALogoProps {
  size?: number;
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
}

export const Z2FALogo: React.FC<Z2FALogoProps> = ({
  size = 36,
  showWordmark = true,
  subtitle,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');

  return (
    <motion.div
      className={`group inline-flex items-center gap-2.5 select-none ${className}`}
      whileHover="hover"
      initial="rest"
      animate="rest"
    >
      <motion.div
        className="relative flex-shrink-0"
        style={{ width: size, height: size }}
        variants={{
          rest: { scale: 1 },
          hover: {
            scale: 1.04,
            transition: { type: 'spring', stiffness: 420, damping: 24 },
          },
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="whisper-shadow rounded-[10px]"
          aria-label="Z2FA Logo"
        >
          <defs>
            <radialGradient id={`v-${uid}`} cx="24%" cy="22%" r="62%">
              <stop offset="0%" stopColor="#0447ff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0447ff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`o-${uid}`} cx="78%" cy="78%" r="62%">
              <stop offset="0%" stopColor="#ff4704" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#ff4704" stopOpacity="0" />
            </radialGradient>
            <clipPath id={`clip-${uid}`}>
              <rect x="2" y="2" width="60" height="60" rx="15" />
            </clipPath>
          </defs>

          {/* Bauhaus Eggshell Plate */}
          <rect x="2" y="2" width="60" height="60" rx="15" fill="#fdfcfc" />
          <rect x="2" y="2" width="60" height="60" rx="15" fill={`url(#v-${uid})`} />
          <rect x="2" y="2" width="60" height="60" rx="15" fill={`url(#o-${uid})`} />

          <g clipPath={`url(#clip-${uid})`}>
            {/* Factor 1: Pure Ink Upper Z-Plane */}
            <motion.path
              d="M17 17.5C17 16.6716 17.6716 16 18.5 16H45.2C46.5364 16 47.2057 17.6157 46.2607 18.5607L24.1213 40.7C23.5587 41.2626 22.7956 41.5787 22 41.5787H17.8C16.9091 41.5787 16.4629 40.5016 17.0929 39.8716L35.4 21.5H18.5C17.6716 21.5 17 20.8284 17 20V17.5Z"
              fill="#000000"
              variants={{
                rest: { x: 0, y: 0 },
                hover: {
                  x: 1,
                  y: -1,
                  transition: { type: 'spring', stiffness: 400, damping: 24 },
                },
              }}
            />

            {/* Factor 2: Warm Graphite Lower Z-Plane */}
            <motion.path
              d="M47 46.5C47 47.3284 46.3284 48 45.5 48H18.8C17.4636 48 16.7943 46.3843 17.7393 45.4393L39.8787 23.3C40.4413 22.7374 41.2044 22.4213 42 22.4213H46.2C47.0909 22.4213 47.5371 23.4984 46.9071 24.1284L28.6 42.5H45.5C46.3284 42.5 47 43.1716 47 44V46.5Z"
              fill="#44403b"
              variants={{
                rest: { x: 0, y: 0 },
                hover: {
                  x: -1,
                  y: 1,
                  transition: { type: 'spring', stiffness: 400, damping: 24 },
                },
              }}
            />

            {/* Product-Icon Spark Node (Violet -> Ember Orange) */}
            <motion.circle
              cx="32"
              cy="32"
              r="2.15"
              fill="#ff4704"
              variants={{
                rest: { scale: 1 },
                hover: {
                  scale: 1.35,
                  fill: '#0447ff',
                  transition: { type: 'spring', stiffness: 460, damping: 18 },
                },
              }}
            />
          </g>

          <rect
            x="2.5"
            y="2.5"
            width="59"
            height="59"
            rx="14.5"
            stroke="#ebe8e4"
            strokeWidth="1"
          />
        </svg>
      </motion.div>

      {showWordmark && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-semibold tracking-[-0.025em] text-[#000000] dark:text-[#fdfcfc]">
              Z2FA
            </span>
            <span className="font-mono-tabular rounded-full border border-[#ebe8e4] bg-[#f5f3f1] px-2 py-0.5 text-[10px] tracking-wide text-[#777169] dark:border-[#292623] dark:bg-[#191816] dark:text-[#a59f97]">
              STUDIO
            </span>
          </div>
          {subtitle && (
            <span className="mt-0.5 text-[11px] font-normal text-[#777169] dark:text-[#a59f97]">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};
