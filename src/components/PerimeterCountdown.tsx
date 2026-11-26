import React, { useEffect, useRef, useState } from 'react';

interface PerimeterCountdownProps {
  progress: number; // 1.0 -> 0.0
  remainingSec: number;
  radius?: number;
}

export const PerimeterCountdown: React.FC<PerimeterCountdownProps> = ({
  progress,
  remainingSec,
  radius = 19.25,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Color progression: Emerald (>8s) -> Warm Amber (4s..8s) -> Ember Red-Orange (<=4s)
  const strokeColor =
    remainingSec <= 4
      ? '#ff4704'
      : remainingSec <= 8
        ? '#F59E0B'
        : '#10B981';

  const clamped = Math.max(0, Math.min(1, progress));
  const dashOffset = 1000 * (1 - clamped);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[20px]">
      {size.width > 0 && size.height > 0 && (
        <svg
          width={size.width}
          height={size.height}
          viewBox={`0 0 ${size.width} ${size.height}`}
          fill="none"
          className="block h-full w-full"
        >
          {/* Base 1px Stone Hairline (#ebe8e4) */}
          <rect
            x="0.75"
            y="0.75"
            width={Math.max(2, size.width - 1.5)}
            height={Math.max(2, size.height - 1.5)}
            rx={radius}
            stroke="currentColor"
            className="text-[#ebe8e4] dark:text-[#292623]"
            strokeWidth="1.25"
          />

          {/* Active Colorful Perimeter Countdown */}
          <rect
            x="0.75"
            y="0.75"
            width={Math.max(2, size.width - 1.5)}
            height={Math.max(2, size.height - 1.5)}
            rx={radius}
            pathLength={1000}
            stroke={strokeColor}
            strokeOpacity={remainingSec <= 4 ? 0.95 : 0.78}
            strokeWidth={remainingSec <= 4 ? '2' : '1.65'}
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke 300ms ease, stroke-opacity 300ms ease',
            }}
          />
        </svg>
      )}
    </div>
  );
};

export const CircularTimerBadge: React.FC<{
  progress: number;
  remainingSec: number;
}> = ({ progress, remainingSec }) => {
  const r = 6.5;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)));

  const colorStyle =
    remainingSec <= 4
      ? { stroke: '#ff4704', pill: 'border-[#ff4704]/30 bg-[#ff4704]/8 text-[#d93800] dark:text-[#ff6a33]' }
      : remainingSec <= 8
        ? { stroke: '#F59E0B', pill: 'border-[#F59E0B]/35 bg-[#F59E0B]/10 text-[#b45309] dark:text-[#fbbf24]' }
        : { stroke: '#10B981', pill: 'border-[#10B981]/30 bg-[#10B981]/8 text-[#047857] dark:text-[#34d399]' };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] transition-colors duration-300 ${colorStyle.pill}`}
    >
      <svg width="15" height="15" viewBox="0 0 18 18" className="-rotate-90">
        <circle
          cx="9"
          cy="9"
          r={r}
          fill="none"
          stroke={colorStyle.stroke}
          strokeOpacity="0.22"
          strokeWidth="1.75"
        />
        <circle
          cx="9"
          cy="9"
          r={r}
          fill="none"
          stroke={colorStyle.stroke}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke 300ms ease' }}
        />
      </svg>
      <span className="font-mono-tabular w-[2.3ch] text-right text-[12px] font-medium">
        {remainingSec}s
      </span>
    </div>
  );
};
