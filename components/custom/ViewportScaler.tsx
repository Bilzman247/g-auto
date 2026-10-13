'use client';

/**
 * Mobile layout wrapper - passes children cleanly without scaling distortions.
 */
export default function ViewportScaler({ children }: { children: React.ReactNode }) {
  return <div className="w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden">{children}</div>;
}
