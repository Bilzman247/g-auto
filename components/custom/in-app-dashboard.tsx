'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  TrendingUp,
  Activity,
  DollarSign,
  Award,
  Zap,
  Layers,
  Play,
  Square,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DerivAccount } from '@deriv/core';
import type { UseAutoTradingBotReturn, BotLogEntry } from '@/hooks/use-auto-trading-bot';

interface InAppDashboardProps {
  bot: UseAutoTradingBotReturn;
  activeAccount: DerivAccount | null;
  isAuthenticated: boolean;
  onOpenLogin: () => void;
  onSwitchToBot: () => void;
}

export function InAppDashboard({
  bot,
  activeAccount,
  isAuthenticated,
  onOpenLogin,
  onSwitchToBot,
}: InAppDashboardProps) {
  const {
    isRunning,
    startBot,
    stopBot,
    sessionProfit,
    winRate,
    winCount,
    lossCount,
    totalTrades,
    currentStake,
    consecutiveWins,
    consecutiveLosses,
    config,
    logs,
    resetStats,
  } = bot;

  const [copied, setCopied] = useState(false);
  const [clearedLogs, setClearedLogs] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // If logs update after user cleared, show fresh logs again
  useEffect(() => {
    if (logs.length > 0 && clearedLogs) {
      setClearedLogs(false);
    }
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs.length, clearedLogs]);

  const displayedLogs = clearedLogs ? [] : logs;

  const handleCopyLogs = () => {
    if (displayedLogs.length === 0) return;
    const text = displayedLogs
      .map((l) => `[${l.time}] [${l.type.toUpperCase()}] ${l.message}${l.profit !== undefined ? ` (Profit: ${l.profit})` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClearLogs = () => {
    setClearedLogs(true);
  };

  return (
    <div className="space-y-3.5 pb-6">
      {/* Title & Engine Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold tracking-tight text-foreground">
            Trading Dashboard
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Algorithmic execution metrics & risk telemetry
          </p>
        </div>
        <Badge
          variant="outline"
          className={`gap-1.5 px-2.5 py-1 text-xs font-semibold ${
            isRunning
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-muted text-muted-foreground border-border'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50'}`} />
          <span>{isRunning ? 'Engine Running' : 'Engine Idle'}</span>
        </Badge>
      </div>

      {/* Connected Account Card */}
      <div className="rounded-2xl border border-border bg-card p-3.5 shadow-none space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Connected Trading Capital
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isAuthenticated
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isAuthenticated
              ? activeAccount?.account_type === 'demo'
                ? 'Demo Practice Account'
                : 'Real Live Account'
              : 'Not Connected'}
          </span>
        </div>

        {isAuthenticated && activeAccount ? (
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-2xl font-black tracking-tight text-foreground">
                ${Number(activeAccount.balance).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-sm font-bold text-muted-foreground ml-1.5">
                {activeAccount.currency}
              </span>
            </div>
            <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
              {activeAccount.account_id}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              Connect or use instant practice mode to trade.
            </span>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs px-3 font-semibold cursor-pointer"
              onClick={onOpenLogin}
            >
              Connect
            </Button>
          </div>
        )}
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Net Profit */}
        <div className="rounded-2xl border border-border bg-card p-3 shadow-none space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Session P&L</span>
            <TrendingUp className={`h-3.5 w-3.5 ${sessionProfit >= 0 ? 'text-emerald-500' : 'text-destructive'}`} />
          </div>
          <div className={`text-lg font-black tracking-tight ${sessionProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
            {sessionProfit >= 0 ? '+' : ''}${sessionProfit.toFixed(2)} USD
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            Target: +${config.takeProfit.toFixed(2)} | Stop: -${config.stopLoss.toFixed(2)}
          </p>
        </div>

        {/* Win Rate */}
        <div className="rounded-2xl border border-border bg-card p-3 shadow-none space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Win Rate</span>
            <Activity className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="text-lg font-black tracking-tight text-foreground">
            {winRate.toFixed(1)}%
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            {winCount} Wins / {lossCount} Losses ({totalTrades} Total)
          </p>
        </div>

        {/* Stake */}
        <div className="rounded-2xl border border-border bg-card p-3 shadow-none space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Active Stake</span>
            <DollarSign className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-black tracking-tight text-foreground">
            ${currentStake.toFixed(2)} USD
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            Base: ${config.baseStake.toFixed(2)} | Martingale: {config.martingale}x
          </p>
        </div>

        {/* Streaks */}
        <div className="rounded-2xl border border-border bg-card p-3 shadow-none space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Streaks</span>
            <Award className="h-3.5 w-3.5 text-purple-500" />
          </div>
          <div className="text-lg font-black tracking-tight text-foreground">
            {consecutiveWins > 0 ? `${consecutiveWins}W Streak` : consecutiveLosses > 0 ? `${consecutiveLosses}L Streak` : 'Neutral'}
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            Max loss limit: {config.maxConsecutiveLosses} trades
          </p>
        </div>
      </div>

      {/* CONSOLE LOG - Flat wide card spanning across the app */}
      <div className="w-full rounded-2xl border border-border bg-card p-3.5 shadow-none space-y-3">
        {/* Console Log Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-primary">
              <Terminal className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block leading-tight">
                Console Log
              </span>
              <span className="text-[10px] text-muted-foreground block leading-tight">
                Live engine telemetry & execution logs
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge
              variant="secondary"
              className="text-[10px] px-2 py-0.5 font-mono gap-1"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
              <span>{displayedLogs.length} events</span>
            </Badge>

            {displayedLogs.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleCopyLogs}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Copy console output"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors cursor-pointer"
                  title="Clear console view"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Flat Console Output Terminal */}
        <div
          ref={logContainerRef}
          className="w-full rounded-xl bg-zinc-950 p-3 font-mono text-[11px] border border-zinc-800/80 max-h-64 h-56 overflow-y-auto space-y-1.5 select-text scrollbar-thin scrollbar-thumb-zinc-700"
        >
          {displayedLogs.length === 0 ? (
            <div className="flex flex-col gap-1 py-1 text-zinc-400">
              <div className="text-zinc-500 flex items-center gap-1.5">
                <span className="text-zinc-600">[SYS]</span>
                <span>Deriv Bot Engine Console initialized.</span>
              </div>
              <div className="text-zinc-500 flex items-center gap-1.5">
                <span className="text-zinc-600">[STATUS]</span>
                <span className={isRunning ? 'text-emerald-400' : 'text-zinc-400'}>
                  {isRunning ? 'Algorithmic loop active. Monitoring price ticks...' : 'Engine idle. Ready for launch.'}
                </span>
              </div>
              <div className="text-zinc-500 flex items-center gap-1.5">
                <span className="text-zinc-600">[STRAT]</span>
                <span>Active: {config.strategy.toUpperCase()} | Base Stake: ${config.baseStake.toFixed(2)} USD</span>
              </div>
              <div className="text-zinc-600 pt-2 text-[10px] italic">
                Logs will appear automatically here as trades are executed.
              </div>
            </div>
          ) : (
            displayedLogs.map((log) => {
              const typeColor =
                log.type === 'win'
                  ? 'text-emerald-400 font-bold'
                  : log.type === 'loss'
                  ? 'text-red-400 font-bold'
                  : log.type === 'buy'
                  ? 'text-cyan-400 font-bold'
                  : log.type === 'warn'
                  ? 'text-amber-400 font-semibold'
                  : log.type === 'stop'
                  ? 'text-rose-400 font-bold'
                  : 'text-zinc-300';

              const tagBg =
                log.type === 'win'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                  : log.type === 'loss'
                  ? 'bg-red-950/80 text-red-400 border border-red-800/60'
                  : log.type === 'buy'
                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
                  : log.type === 'warn'
                  ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                  : log.type === 'stop'
                  ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800';

              return (
                <div key={log.id} className="flex items-start gap-1.5 leading-snug break-all">
                  <span className="text-zinc-600 shrink-0 select-none">[{log.time}]</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-semibold uppercase shrink-0 select-none ${tagBg}`}>
                    {log.type}
                  </span>
                  <span className={`flex-1 ${typeColor}`}>
                    {log.message}
                  </span>
                  {log.profit !== undefined && (
                    <span
                      className={`shrink-0 font-bold text-[10px] px-1 rounded ${
                        log.profit >= 0 ? 'text-emerald-400 bg-emerald-950/60' : 'text-red-400 bg-red-950/60'
                      }`}
                    >
                      {log.profit >= 0 ? '+' : ''}${log.profit.toFixed(2)}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Flat Console Footer Telemetry */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 border-t border-border/50">
          <div className="flex items-center gap-2">
            <span>Delay: {config.tradeDelaySeconds}s</span>
            <span>•</span>
            <span>Target: +${config.takeProfit.toFixed(0)}</span>
            <span>•</span>
            <span>Stop: -${config.stopLoss.toFixed(0)}</span>
          </div>
          <span className="font-mono text-zinc-500">
            {isRunning ? '● STREAMING' : '○ STANDBY'}
          </span>
        </div>
      </div>

      {/* Strategies Overview */}
      <div className="rounded-2xl border border-border bg-card p-3.5 shadow-none space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">
            Active Strategy Configuration
          </span>
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 capitalize">
            {config.strategy.replace('_', ' ')}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <Zap className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-foreground block">
                Trend Momentum Breakout
              </span>
              <span className="text-[11px] text-muted-foreground block leading-tight">
                Executes orders aligned with the latest tick delta momentum to ride short-burst micro-trends.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <Layers className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-foreground block">
                Smart Martingale Multiplier
              </span>
              <span className="text-[11px] text-muted-foreground block leading-tight">
                Automatically adjusts stake on losses to recover capital upon the subsequent winning contract.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fast Action Shortcuts */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          onClick={onSwitchToBot}
          className="flex items-center justify-between p-3 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-bold text-foreground">Trading Bot</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
        </button>

        {isRunning ? (
          <button
            type="button"
            onClick={() => stopBot('Stopped from dashboard')}
            className="flex items-center justify-between p-3 rounded-2xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Square className="h-4 w-4 text-destructive shrink-0 fill-current" />
              <span className="text-xs font-bold text-destructive">Stop Bot</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-destructive shrink-0" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                onOpenLogin();
              } else {
                startBot();
                onSwitchToBot();
              }
            }}
            className="flex items-center justify-between p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 fill-current" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Launch Bot</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}
