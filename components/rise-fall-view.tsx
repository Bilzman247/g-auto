'use client';

import dynamic from 'next/dynamic';
import { Localize } from '@deriv-com/translations';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/custom/header';
import { LoginPromptDialog } from '@/components/custom/login-prompt-dialog';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import { SymbolSelector } from '@/components/custom/symbol-selector';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useContractMarkers } from '@/hooks/use-contract-markers';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Ban, Play, Square, Bot, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAutoTradingBot } from '@/hooks/use-auto-trading-bot';
import { AutoBotControls } from './auto-bot-controls';
import { AppBottomNavbar } from '@/components/custom/app-bottom-navbar';
import { InAppDashboard } from '@/components/custom/in-app-dashboard';
import { InAppReports } from '@/components/custom/in-app-reports';
import type { RiseFallAppConfig } from '../lib/app-config';

/**
 * A zone overlaid on the chart region. Two modes:
 *  - not-editable (no onClick): ⛔ "… · not editable" hint on hover.
 *  - selectable (onClick): clickable to select; ring highlights when selected.
 * Either way it blocks direct chart interaction in edit mode.
 */
function FixedZone({
  label,
  style,
  onClick,
  selected,
}: {
  label: string;
  style: CSSProperties;
  onClick?: () => void;
  selected?: boolean;
}) {
  const { localize } = useAppTranslations();
  const selectable = !!onClick;
  return (
    <div
      className={`group/zone absolute left-0 right-0 z-[60] ${selectable ? 'cursor-pointer' : ''}`}
      style={style}
      onClick={onClick}
    >
      <div
        className={[
          'pointer-events-none absolute inset-0 rounded-md ring-2 ring-inset transition-opacity',
          selected
            ? 'opacity-100 ring-primary'
            : 'opacity-0 ring-muted-foreground/30 group-hover/zone:opacity-100',
        ].join(' ')}
      >
        <span className="absolute left-3 top-2 flex items-center gap-1.5 rounded-md bg-background/90 px-2 py-1 text-[11px] font-medium text-muted-foreground shadow-sm ring-1 ring-border">
          {!selectable && <Ban className="h-3.5 w-3.5" />}
          {selectable ? label : localize('{{label}} · not editable', { label })}
        </span>
      </div>
    </div>
  );
}
import type {
  AuthState,
  DerivAccount,
  ActiveSymbol,
  ProposalInfo,
  BuyResult,
  DerivWS,
} from '@deriv/core';
import type { Direction, DurationSelectUnit, DurationOption, OpenPosition } from '../lib/types';
import type { UseSmartChartsApiReturn } from '@/hooks/use-smartcharts-api';
import { LightweightTickChart } from './lightweight-tick-chart';

// Edit-mode stand-in for the login prompt's auth handlers — same rule as the
// header: no OAuth navigation out of the editor.
const noopAsyncAuth = async () => {};

export interface RiseFallViewProps {
  // Auth
  authState: AuthState;
  accounts: DerivAccount[];
  activeAccount: DerivAccount | null;
  onLogin: () => Promise<void>;
  onSignUp: () => Promise<void>;
  onLoginAsDemo?: () => void;
  onLogout: () => void;
  onSwitchAccount: (accountId: string) => Promise<void>;
  defaultTab?: 'bot' | 'dashboard' | 'reports';

  // Connection / loading
  ws: DerivWS | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Market data
  symbols: ActiveSymbol[];
  activeSymbol: ActiveSymbol | null;
  selectSymbol: (symbol: string) => void;
  /** Recent price window + pip size for the active symbol — powers the
   *  Symbol Selector's movement indicator when the chart is hidden. */
  prices?: number[];
  pipSize?: number;

  // Trade controls
  direction: Direction;
  setDirection: (direction: Direction) => void;
  allowEquals: boolean;
  setAllowEquals: (value: boolean) => void;
  stake: string;
  setStake: (value: string) => void;
  duration: number;
  setDuration: (value: number) => void;
  durationOptions: DurationOption[];
  durationUnit: DurationSelectUnit;
  setDurationUnit: (unit: DurationSelectUnit) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  proposal: ProposalInfo | null;
  buyContract: () => Promise<void>;
  isBuying: boolean;
  buyResult: BuyResult | null;
  buyError: string | null;
  clearBuyResult: () => void;

  // Positions
  openPositions: OpenPosition[];
  sellContract: (contractId: number, bidPrice: string) => Promise<void>;
  sellingId: number | null;

  // Chart data (optional, smartcharts removed for speed and stability)
  chartData?: any;
  getQuotes?: any;
  subscribeQuotes?: any;
  unsubscribeQuotes?: any;
  /** Passed to SmartChart. Set to false for a frozen preview. Defaults to true. */
  isLive?: boolean;
  /**
   * Unix epoch (seconds) to freeze the chart at. When set, SmartCharts renders
   * a static historical snapshot and never sets up a live subscription.
   */
  endEpoch?: number;

  // Branding (used by preview route; no-op in the real app)
  logoSrc?: string;
  appName?: string;
  showAppName?: boolean;

  /**
   * No-code config. When provided, the trade controls render in configurable
   * styles/order (ConfigurableTradeControls). When omitted, the standard
   * TradeControls render unchanged.
   */
  appConfig?: RiseFallAppConfig;
  /** Edit mode — components become selectable (click opens their accordion). */
  editMode?: boolean;
  /** Called when an editable component is clicked (e.g. "chart", "stake"). */
  onSelect?: (key: string) => void;
  /** Currently selected component (highlighted). */
  selectedKey?: string | null;
  /** Rearrange mode — drag blocks in the phone to reorder the layout. */
  rearrangeMode?: boolean;
  /** Called with the new block order after a drag-drop reorder. */
  onReorder?: (order: RiseFallAppConfig['order']) => void;
}

export function RiseFallView({
  authState,
  accounts,
  activeAccount,
  onLogin,
  onSignUp,
  onLoginAsDemo,
  onLogout,
  onSwitchAccount,
  defaultTab,
  ws,
  isConnected,
  isLoading,
  error,
  symbols,
  activeSymbol,
  selectSymbol,
  prices,
  pipSize,
  direction,
  setDirection,
  allowEquals,
  setAllowEquals,
  stake,
  setStake,
  duration,
  setDuration,
  durationOptions,
  durationUnit,
  setDurationUnit,
  endDate,
  setEndDate,
  endTime,
  setEndTime,
  proposal,
  buyContract,
  isBuying,
  buyResult,
  buyError,
  clearBuyResult,
  openPositions,
  chartData,
  getQuotes,
  subscribeQuotes,
  unsubscribeQuotes,
  isLive,
  endEpoch,
  logoSrc,
  appName,
  showAppName,
  appConfig,
  editMode,
  onSelect,
  selectedKey,
  rearrangeMode,
  onReorder,
}: RiseFallViewProps) {
  const { localize } = useAppTranslations();
  const isMobile = useIsMobile();
  const chartHidden = appConfig?.chart?.hidden ?? false;
  // Pinning is a mobile affordance: on desktop the controls card grows to fit,
  // so the Buy button is never scroll-clipped and a viewport-wide bar under a
  // 400px column would look detached.
  const pinBuy = !!appConfig?.buy?.pinned && isMobile;
  // With Buy unpinned the footer still has to sit at the end of the mobile
  // column — and a `fixed` footer makes that column reserve clearance for it.
  // That reservation was a guess (`pb-28`, 112px) for a footer that measures
  // 40px, leaving 72px of dead space under the Buy button at the bottom of the
  // scroll. Rendering it in flow, exactly as PinnedBuyBar does, ends the column
  // where the footer begins and removes the number to guess.
  //
  // Note what this does NOT depend on: `buy.pinned`. Every no-code mobile
  // render gets the in-flow band, so an existing unpinned project also moves
  // off the translucent `fixed` footer on its next redeploy. That is deliberate
  // — it is the dead-space fix — but it means the backward-compatibility rule
  // covers Buy's PLACEMENT, not the footer treatment: a pre-existing project
  // keeps Buy scrolling in the column, while its footer becomes the opaque
  // bordered band. A footer that moved after a redeploy is expected here, not a
  // regression.
  const inFlowFooter = !!appConfig && isMobile;
  const contractMarkers = useContractMarkers(openPositions, activeSymbol?.underlying_symbol, isMobile);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<'bot' | 'dashboard' | 'reports'>(defaultTab ?? 'bot');

  useEffect(() => {
    if (defaultTab && defaultTab !== activeTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname;
      if (path.includes('dashboard')) {
        setActiveTab('dashboard');
      } else if (path.includes('reports')) {
        setActiveTab('reports');
      } else {
        setActiveTab('bot');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const bot = useAutoTradingBot({
    ws,
    isConnected,
    isAuthenticated: authState === 'authenticated',
    activeSymbol,
    prices: prices ?? [],
    onRequireAuth: () => setShowLoginPrompt(true),
  });

  // In edit mode, login/sign-up/account actions are inert (no OAuth navigation
  // out of the editor) — only the theme toggle stays interactive.
  const headerEl = useMemo(() => {
    const noop = () => {};
    const noopAsync = async () => {};
    return (
      <Header
        authState={authState}
        accounts={accounts}
        activeAccount={activeAccount}
        onLogin={editMode ? noopAsync : async () => setShowLoginPrompt(true)}
        onSignUp={editMode ? noopAsync : async () => setShowLoginPrompt(true)}
        onLoginAsDemo={editMode ? noop : onLoginAsDemo}
        onLogout={editMode ? noop : onLogout}
        onSwitchAccount={editMode ? noopAsync : onSwitchAccount}
        logoSrc={logoSrc}
        appName={appName}
        showAppName={showAppName}
        actions={<ThemeToggle />}
      />
    );
  }, [
    authState,
    accounts,
    activeAccount,
    editMode,
    onLogin,
    onSignUp,
    onLoginAsDemo,
    onLogout,
    onSwitchAccount,
    logoSrc,
    appName,
    showAppName,
  ]);

  // The chart + symbol block. Used in the standard 2-column layout (left column)
  // and as a reorderable block in the no-code layout. When the chart is hidden,
  // the SmartChart is NOT mounted at all (so nothing bleeds through) and a
  // standalone Symbol Selector takes its place so users can still switch markets.
  // Lightweight tick chart with symbol selector, live price metrics, and SVG pulse
  const chartBlock = useMemo(
    () => (
      <LightweightTickChart
        symbols={symbols}
        activeSymbol={activeSymbol}
        onSymbolChange={selectSymbol}
        prices={prices}
        pipSize={pipSize}
      />
    ),
    [symbols, activeSymbol, selectSymbol, prices, pipSize]
  );

  if (error) {
    return (
      <main className="flex flex-col bg-background items-center justify-center px-4 h-full">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">
              <Localize i18n_default_text="Connection Error" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* 1. FIXED TOP APP HEADER - NEVER MOVES WITH SCROLL */}
      <div className="shrink-0 z-40 w-full border-b border-border bg-background">
        {headerEl}
      </div>

      {/* 2. SCROLLABLE PAGE CONTENT - ONLY THIS SCROLLS SMOOTHLY */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-3 pb-8">
        {activeTab === 'bot' && (
          <>
            {chartBlock}
            {isLoading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : (
              <AutoBotControls
                bot={bot}
                isConnected={isConnected}
                isAuthenticated={authState === 'authenticated'}
                activeSymbol={activeSymbol}
                durationOptions={durationOptions}
                onOpenLogin={() => setShowLoginPrompt(true)}
                onSwitchToReports={() => {
                  setActiveTab('reports');
                  if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', '/reports');
                  }
                }}
              />
            )}
          </>
        )}

        {activeTab === 'dashboard' && (
          <InAppDashboard
            bot={bot}
            activeAccount={activeAccount}
            isAuthenticated={authState === 'authenticated'}
            onOpenLogin={() => setShowLoginPrompt(true)}
            onSwitchToBot={() => {
              setActiveTab('bot');
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/');
              }
            }}
          />
        )}

        {activeTab === 'reports' && (
          <InAppReports
            bot={bot}
            openPositions={openPositions}
            isAuthenticated={authState === 'authenticated'}
            onOpenLogin={() => setShowLoginPrompt(true)}
            onSwitchToBot={() => {
              setActiveTab('bot');
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/');
              }
            }}
          />
        )}
      </div>

      {/* 3. FIXED BOTTOM NAVBAR - NEVER MOVES WITH PAGE CONTENT */}
      <AppBottomNavbar
        isRunning={bot.isRunning}
        sessionProfit={bot.sessionProfit}
        onStartBot={() => {
          if (authState !== 'authenticated') {
            setShowLoginPrompt(true);
          } else {
            bot.startBot();
          }
        }}
        onStopBot={() => bot.stopBot('Stopped from mobile navbar')}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (typeof window !== 'undefined') {
            const nextPath = tab === 'bot' ? '/' : `/${tab}`;
            window.history.replaceState(null, '', nextPath);
          }
        }}
      />

      <LoginPromptDialog
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        onLogin={editMode ? noopAsyncAuth : onLogin}
        onSignUp={editMode ? noopAsyncAuth : onSignUp}
        onLoginAsDemo={editMode ? undefined : onLoginAsDemo}
      />
    </main>
  );
}
