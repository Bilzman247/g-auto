'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, LayoutDashboard, BarChart2, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AppBottomNavbarProps {
  isRunning?: boolean;
  sessionProfit?: number;
  onStartBot?: () => void;
  onStopBot?: () => void;
  showBotBar?: boolean;
  activeTab?: 'bot' | 'dashboard' | 'reports';
  onTabChange?: (tab: 'bot' | 'dashboard' | 'reports') => void;
}

export function AppBottomNavbar({
  isRunning = false,
  sessionProfit = 0,
  onStartBot,
  onStopBot,
  showBotBar = true,
  activeTab,
  onTabChange,
}: AppBottomNavbarProps) {
  const pathname = usePathname();

  const isCurrentActive = (tabId: 'bot' | 'dashboard' | 'reports', href: string) => {
    if (activeTab) return activeTab === tabId;
    if (href === '/') return pathname === '/' || pathname === '';
    return pathname.startsWith(href);
  };

  return (
    <nav className="shrink-0 z-40 w-full border-t border-border bg-card shadow-lg select-none">
      {/* 1. Quick Bot Status & Master Start/Stop Action Bar */}
      {showBotBar && onStartBot && onStopBot && (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2 bg-muted/40 border-b border-border/60">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40'
              }`}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold text-foreground leading-tight truncate">
                {isRunning ? 'Auto Bot Running' : 'Auto Bot Idle'}
              </span>
              <span
                className={`text-[10px] font-medium leading-tight truncate ${
                  sessionProfit >= 0 ? 'text-emerald-500 font-semibold' : 'text-destructive font-semibold'
                }`}
              >
                P&L: {sessionProfit >= 0 ? '+' : ''}${sessionProfit.toFixed(2)} USD
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {isRunning ? (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="h-8 gap-1.5 px-3 text-xs font-semibold shadow-xs active:scale-95 transition-transform cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onStopBot();
                }}
              >
                <Square className="h-3 w-3 fill-current" />
                <span>Stop Bot</span>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs active:scale-95 transition-transform cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartBot();
                }}
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Start Bot</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 2. Main Navigation Tabs (Trading Bot | Dashboard | Positions & Reports) */}
      <div className="grid grid-cols-3 py-1 px-1.5 text-center bg-card">
        {/* Tab 1: Trading Bot */}
        {onTabChange ? (
          <button
            type="button"
            onClick={() => onTabChange('bot')}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              isCurrentActive('bot', '/')
                ? 'text-primary font-semibold bg-primary/10'
                : 'text-muted-foreground hover:text-foreground font-medium hover:bg-muted/30'
            }`}
          >
            <Bot className={`h-4 w-4 ${isCurrentActive('bot', '/') ? 'text-primary stroke-[2.5]' : ''}`} />
            <span className="text-[10px] leading-tight tracking-tight">Trading Bot</span>
          </button>
        ) : (
          <Link
            href="/"
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              isCurrentActive('bot', '/')
                ? 'text-primary font-semibold bg-primary/10'
                : 'text-muted-foreground hover:text-foreground font-medium hover:bg-muted/30'
            }`}
          >
            <Bot className={`h-4 w-4 ${isCurrentActive('bot', '/') ? 'text-primary stroke-[2.5]' : ''}`} />
            <span className="text-[10px] leading-tight tracking-tight">Trading Bot</span>
          </Link>
        )}

        {/* Tab 2: Dashboard */}
        {onTabChange ? (
          <button
            type="button"
            onClick={() => onTabChange('dashboard')}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              isCurrentActive('dashboard', '/dashboard')
                ? 'text-primary font-semibold bg-primary/10'
                : 'text-muted-foreground hover:text-foreground font-medium hover:bg-muted/30'
            }`}
          >
            <LayoutDashboard
              className={`h-4 w-4 ${
                isCurrentActive('dashboard', '/dashboard') ? 'text-primary stroke-[2.5]' : ''
              }`}
            />
            <span className="text-[10px] leading-tight tracking-tight">Dashboard</span>
          </button>
        ) : (
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              isCurrentActive('dashboard', '/dashboard')
                ? 'text-primary font-semibold bg-primary/10'
                : 'text-muted-foreground hover:text-foreground font-medium hover:bg-muted/30'
            }`}
          >
            <LayoutDashboard
              className={`h-4 w-4 ${
                isCurrentActive('dashboard', '/dashboard') ? 'text-primary stroke-[2.5]' : ''
              }`}
            />
            <span className="text-[10px] leading-tight tracking-tight">Dashboard</span>
          </Link>
        )}

        {/* Tab 3: Positions & Reports */}
        {onTabChange ? (
          <button
            type="button"
            onClick={() => onTabChange('reports')}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              isCurrentActive('reports', '/reports')
                ? 'text-primary font-semibold bg-primary/10'
                : 'text-muted-foreground hover:text-foreground font-medium hover:bg-muted/30'
            }`}
          >
            <BarChart2
              className={`h-4 w-4 ${
                isCurrentActive('reports', '/reports') ? 'text-primary stroke-[2.5]' : ''
              }`}
            />
            <span className="text-[10px] leading-tight tracking-tight">Reports</span>
          </button>
        ) : (
          <Link
            href="/reports"
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              isCurrentActive('reports', '/reports')
                ? 'text-primary font-semibold bg-primary/10'
                : 'text-muted-foreground hover:text-foreground font-medium hover:bg-muted/30'
            }`}
          >
            <BarChart2
              className={`h-4 w-4 ${
                isCurrentActive('reports', '/reports') ? 'text-primary stroke-[2.5]' : ''
              }`}
            />
            <span className="text-[10px] leading-tight tracking-tight">Reports</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
