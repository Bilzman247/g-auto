'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Menu, X, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Localize } from '@deriv-com/translations';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { LANGUAGE_LOCALES } from '@/lib/i18n';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import { LanguageSwitcher } from '@/components/custom/language-switcher';
import type { AuthState, DerivAccount } from '@deriv/core';

interface HeaderProps {
  authState: AuthState;
  accounts: DerivAccount[];
  activeAccount: DerivAccount | null;
  onLogin: () => Promise<void>;
  onLogout: () => void;
  onSwitchAccount: (accountId: string) => Promise<void>;
  /** When provided, a Sign up button is rendered to the right of the Log in button. */
  onSignUp?: () => Promise<void>;
  onLoginAsDemo?: () => void;
  /** Logo source URL or data URL. When omitted, a placeholder badge is shown until
   *  the user provides a logo via the app builder (passed as a data URL via PREVIEW_BRANDING). */
  logoSrc?: string;
  /** App name used for the header text and the fallback logo letter when no logoSrc
   *  is provided. Prefers the live preview / Customise name, then
   *  NEXT_PUBLIC_DERIV_APP_NAME, then 'Deriv Trading'. */
  appName?: string;
  /**
   * When false, hide the name text next to the logo. Defaults to the
   * NEXT_PUBLIC_DERIV_SHOW_APP_NAME env var (true when unset).
   */
  showAppName?: boolean;
  /** Optional controls rendered to the left of the login/logout button (e.g. a theme toggle). */
  actions?: React.ReactNode;
}

function formatBalance(balance: string, locale: string): string {
  return Number(balance).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function AccountLabel({ type }: { type: 'demo' | 'real' }) {
  return (
    <span
      className={cn(
        'text-sm font-medium whitespace-nowrap truncate',
        type === 'demo' ? 'text-orange-500' : 'text-emerald-600'
      )}
    >
      {type === 'demo' ? (
        <Localize i18n_default_text="Demo account" />
      ) : (
        <Localize i18n_default_text="Real account" />
      )}
    </span>
  );
}

function resolveHeaderAppName(appName?: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_DERIV_APP_NAME?.trim();
  return appName?.trim() || fromEnv || 'Deriv Trading';
}

function resolveShowAppName(showAppName?: boolean): boolean {
  if (typeof showAppName === 'boolean') return showAppName;
  return process.env.NEXT_PUBLIC_DERIV_SHOW_APP_NAME !== 'false';
}

function AuthButtons({
  isAuthenticated,
  isAuthenticating,
  onLogin,
  onLogout,
  onSignUp,
}: {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  onLogin: () => Promise<void>;
  onLogout: () => void;
  onSignUp?: () => Promise<void>;
}) {
  if (isAuthenticated) {
    return (
      <Button variant="outline" size="sm" className="shrink-0" onClick={onLogout}>
        <Localize i18n_default_text="Log out" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onLogin} disabled={isAuthenticating}>
        {isAuthenticating ? (
          <Localize i18n_default_text="Logging in..." />
        ) : (
          <Localize i18n_default_text="Log in" />
        )}
      </Button>
      {onSignUp && (
        <Button size="sm" onClick={onSignUp} disabled={isAuthenticating}>
          <Localize i18n_default_text="Sign up" />
        </Button>
      )}
    </div>
  );
}


const APPEARANCE_OPTIONS = ['light', 'dark', 'system'] as const;

function AppearanceLabel({ value }: { value: (typeof APPEARANCE_OPTIONS)[number] }) {
  if (value === 'light') return <Localize i18n_default_text="Light" />;
  if (value === 'dark') return <Localize i18n_default_text="Dark" />;
  return <Localize i18n_default_text="System" />;
}

function AppearancePicker() {
  const { theme, setTheme } = useTheme();
  const selected = theme === 'light' || theme === 'dark' ? theme : 'system';

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">
        <Localize i18n_default_text="Appearance" />
      </p>
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border">
        {APPEARANCE_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTheme(option)}
            className={cn(
              'py-2 px-2 text-xs font-semibold rounded-lg transition-all capitalize cursor-pointer',
              option === selected
                ? 'bg-background text-foreground shadow-xs font-bold border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function DrawerLanguagePicker() {
  const { currentLang, switchLanguage } = useAppTranslations();

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">
        <Localize i18n_default_text="Language" />
      </p>
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border">
        {(['EN', 'ES', 'FR', 'PT'] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => switchLanguage(lang)}
            className={cn(
              'py-2 px-1 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center',
              lang === currentLang
                ? 'bg-background text-primary shadow-xs font-bold border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {lang}
          </button>
        ))}
      </div>
    </div>
  );
}

function MobileAuthButtons({
  isAuthenticated,
  isAuthenticating,
  onLogin,
  onLogout,
  onSignUp,
}: {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  onLogin: () => Promise<void>;
  onLogout: () => void;
  onSignUp?: () => Promise<void>;
}) {
  const className = 'w-full h-11 font-semibold';

  if (isAuthenticated) {
    return (
      <Button variant="outline" className={className} onClick={onLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        <Localize i18n_default_text="Log out" />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        className={cn(className, 'bg-transparent hover:bg-transparent')}
        onClick={onLogin}
        disabled={isAuthenticating}
      >
        {isAuthenticating ? (
          <Localize i18n_default_text="Logging in..." />
        ) : (
          <Localize i18n_default_text="Log in" />
        )}
      </Button>
      {onSignUp && (
        <Button className={className} onClick={onSignUp} disabled={isAuthenticating}>
          <Localize i18n_default_text="Sign up" />
        </Button>
      )}
    </>
  );
}

export function Header({
  authState,
  accounts,
  activeAccount,
  onLogin,
  onLogout,
  onSwitchAccount,
  onSignUp,
  onLoginAsDemo,
  logoSrc,
  appName,
  showAppName,
  actions,
}: HeaderProps) {
  const { currentLang, localize } = useAppTranslations();
  const numberLocale = LANGUAGE_LOCALES[currentLang];
  const [logoError, setLogoError] = useState(false);
  const resolvedName = resolveHeaderAppName(appName);
  const shouldShowName = resolveShowAppName(showAppName);
  const logoLetter = resolvedName.charAt(0).toUpperCase() || 'D';
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isAuthenticated = authState === 'authenticated';
  const isAuthenticating = authState === 'authenticating';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const headerBar = (
    <div className="flex items-center justify-between px-3.5 py-2.5 w-full bg-background">
      <div className="flex items-center gap-2.5 shrink-0">
        {!logoSrc || logoError ? (
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm select-none">
            {logoLetter}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- next/image is avoided here intentionally
          <img
            src={logoSrc}
            alt={localize('App Logo')}
            className="h-8 w-auto object-contain select-none"
            onError={() => setLogoError(true)}
          />
        )}
        {shouldShowName && (
          <h1 className="text-sm font-bold text-foreground truncate max-w-[130px] select-none">
            {resolvedName}
          </h1>
        )}
      </div>

      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1 shrink-0">
          {actions}
        </div>

        {isAuthenticated && activeAccount ? (
          <Popover open={accountSwitcherOpen} onOpenChange={setAccountSwitcherOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex min-w-0 items-center gap-1.5 rounded-lg border border-border px-2 py-1 hover:bg-muted/50 transition-colors cursor-pointer select-none"
              >
                <div className="min-w-0 text-left">
                  <span
                    className={cn(
                      'text-[10px] font-semibold block leading-tight',
                      activeAccount.account_type === 'demo' ? 'text-orange-500' : 'text-emerald-600'
                    )}
                  >
                    {activeAccount.account_type === 'demo' ? 'Demo' : 'Real'}
                  </span>
                  <p className="text-xs font-bold text-foreground whitespace-nowrap truncate leading-tight">
                    {formatBalance(activeAccount.balance, numberLocale)} {activeAccount.currency}
                  </p>
                </div>
                <svg
                  className={cn(
                    'w-3.5 h-3.5 text-muted-foreground transition-transform',
                    accountSwitcherOpen && 'rotate-180'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="z-[1100] w-64 p-2 shadow-xl bg-card border-border">
              <div className="space-y-1">
                {accounts.map((account) => (
                  <button
                    key={account.account_id}
                    type="button"
                    onClick={() => {
                      onSwitchAccount(account.account_id);
                      setAccountSwitcherOpen(false);
                    }}
                    className={cn(
                      'w-full text-left rounded-lg px-3 py-2.5 transition-colors cursor-pointer',
                      account.account_id === activeAccount.account_id
                        ? 'bg-muted'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <AccountLabel type={account.account_type} />
                    <p className="text-base font-bold text-foreground">
                      {formatBalance(account.balance, numberLocale)} {account.currency}
                    </p>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs px-2.5 font-semibold cursor-pointer active:scale-95 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              onLogin();
            }}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? localize('Logging in...') : localize('Log in')}
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 cursor-pointer active:scale-95 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            setMobileMenuOpen((prev) => !prev);
          }}
          aria-label={localize('Your preferences')}
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  const menuDrawer = (
    <div className="fixed inset-0 z-[999] flex flex-col justify-start">
      {/* Full backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Top slide-down menu sheet */}
      <div className="relative z-[1000] w-full max-w-md mx-auto bg-card border-b border-border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-top-2 duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-foreground">
              <Localize i18n_default_text="Settings & Preferences" />
            </h3>
            <p className="text-[11px] text-muted-foreground">
              <Localize i18n_default_text="Customize your trading interface" />
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <AppearancePicker />

          <DrawerLanguagePicker />

          {!isAuthenticated && onLoginAsDemo && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Quick Practice Mode
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Test the automated trading bot instantly with $10,000 USD demo balance.
              </p>
              <Button
                type="button"
                className="w-full h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs cursor-pointer active:scale-95 transition-transform"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLoginAsDemo();
                }}
              >
                Start Practice Mode ($10,000 USD)
              </Button>
            </div>
          )}
        </div>

        <div className="px-4 pb-5 pt-3 flex flex-col gap-2 border-t border-border bg-card">
          <MobileAuthButtons
            isAuthenticated={isAuthenticated}
            isAuthenticating={isAuthenticating}
            onLogin={async () => {
              setMobileMenuOpen(false);
              await onLogin();
            }}
            onLogout={() => {
              setMobileMenuOpen(false);
              onLogout();
            }}
            onSignUp={async () => {
              setMobileMenuOpen(false);
              if (onSignUp) await onSignUp();
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full">
      {headerBar}
      {mobileMenuOpen && isMounted && typeof document !== 'undefined'
        ? createPortal(menuDrawer, document.body)
        : null}
    </div>
  );
}
