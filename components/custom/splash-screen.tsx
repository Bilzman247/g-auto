'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SplashScreenProps {
  logoSrc?: string | null;
}

/**
 * Deriv-style clean splash screen.
 * Displays for exactly 6 seconds on initial load, then automatically opens the dashboard.
 * - Uses session storage to ensure it displays once per session (preventing re-triggering loops on navigation).
 * - Uses the app logo
 * - Rounded logo
 * - Spinning ring around the logo in the main app primary color
 * - Displays for exactly 6 seconds (6000ms)
 * - Automatically transitions to the dashboard after 6s
 * - Built-in timing safeguards so it never keeps loading indefinitely
 * - Uses main app background color (bg-background)
 * - Only the app logo, no text
 */
export function SplashScreen({ logoSrc }: SplashScreenProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem('g_squad_splash_shown') !== 'true';
  });
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [imgError, setImgError] = useState(false);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (!isVisible) return;

    try {
      sessionStorage.setItem('g_squad_splash_shown', 'true');
    } catch {
      // ignore
    }

    try {
      router.prefetch('/dashboard');
    } catch {
      // safe fallback
    }

    const DURATION_MS = 6000; // Exactly 6 seconds
    const FADE_START_MS = 5400; // Smooth 600ms fade-out transition
    const startTimestamp = Date.now();

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, FADE_START_MS);

    const completeSplash = () => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      setIsFadingOut(true);
      setIsVisible(false);

      if (typeof window !== 'undefined') {
        if (!window.location.pathname.includes('/dashboard')) {
          router.replace('/dashboard');
        }
      }
    };

    const removeTimer = setTimeout(completeSplash, DURATION_MS);

    const intervalGuard = setInterval(() => {
      if (Date.now() - startTimestamp >= DURATION_MS) {
        completeSplash();
      }
    }, 200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      clearInterval(intervalGuard);
    };
  }, [isVisible, router]);

  if (!isVisible) {
    return null;
  }

  const resolvedLogo = !imgError && logoSrc ? logoSrc : '/logo.jpg';

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-background text-foreground transition-opacity duration-600 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden="true"
    >
      {/* Centered logo container with spinning ring */}
      <div className="relative flex items-center justify-center">
        {/* Animated spinning ring around the logo in the main app primary color */}
        <div
          className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border-[3px] border-border/80 border-t-primary border-r-primary animate-spin"
          style={{ animationDuration: '1.1s' }}
        />

        {/* Secondary subtle halo in the main app color */}
        <div
          className="absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full border border-primary/20 animate-pulse pointer-events-none"
        />

        {/* Rounded app logo */}
        <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden bg-card border-2 border-border shadow-2xl flex items-center justify-center p-2 z-10">
          {!imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedLogo}
              alt=""
              className="w-full h-full object-cover rounded-full select-none"
              onError={() => setImgError(true)}
            />
          ) : (
            // Fallback rounded emblem in the main app primary color
            <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black text-2xl select-none shadow-inner">
              D
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
