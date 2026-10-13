'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Play,
  Square,
  RotateCcw,
  TrendingUp,
  Activity,
  ShieldAlert,
  Flame,
  ArrowUpRight,
  Terminal,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Localize } from '@deriv-com/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { ActiveSymbol } from '@deriv/core';
import type { DurationSelectUnit, DurationOption } from '@/lib/types';
import type { useAutoTradingBot, BotStrategy } from '@/hooks/use-auto-trading-bot';

export interface AutoBotControlsProps {
  bot: ReturnType<typeof useAutoTradingBot>;
  isConnected: boolean;
  isAuthenticated: boolean;
  activeSymbol: ActiveSymbol | null;
  durationOptions: DurationOption[];
  onOpenLogin?: () => void;
  onSwitchToReports?: () => void;
}

export function AutoBotControls({
  bot,
  isConnected,
  isAuthenticated,
  activeSymbol,
  durationOptions,
  onOpenLogin,
  onSwitchToReports,
}: AutoBotControlsProps) {
  const {
    config,
    updateConfig,
    isRunning,
    status,
    startBot,
    stopBot,
    resetStats,
    currentStake,
    sessionProfit,
    totalTrades,
    winCount,
    lossCount,
    consecutiveWins,
    consecutiveLosses,
    winRate,
    activeContractId,
    logs,
  } = bot;

  const statusDisplay = useMemo(() => {
    switch (status) {
      case 'PURCHASING':
        return {
          text: 'Placing Order...',
          color: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
          dot: 'bg-blue-500 animate-ping',
        };
      case 'WAITING_RESULT':
        return {
          text: `Contract Active (#${activeContractId ?? '...'})`,
          color: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
          dot: 'bg-amber-500 animate-pulse',
        };
      case 'ANALYZING':
        return {
          text: 'Scanning Market Signal...',
          color: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
          dot: 'bg-cyan-500 animate-pulse',
        };
      case 'WAITING_FOR_AUTH':
        return {
          text: 'Login Required',
          color: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
          dot: 'bg-yellow-500',
        };
      case 'STOPPED_TAKE_PROFIT':
        return {
          text: '🎯 Target Profit Hit',
          color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
          dot: 'bg-emerald-500',
        };
      case 'STOPPED_STOP_LOSS':
        return {
          text: '🛑 Stop Loss Triggered',
          color: 'bg-red-500/15 text-red-500 border-red-500/30',
          dot: 'bg-red-500',
        };
      case 'STOPPED_MAX_LOSSES':
        return {
          text: '⚠️ Max Consecutive Losses Hit',
          color: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
          dot: 'bg-orange-500',
        };
      case 'PAUSED':
      case 'IDLE':
      default:
        return {
          text: isRunning ? 'Active' : 'Bot Idle',
          color: isRunning
            ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
            : 'bg-muted text-muted-foreground border-border',
          dot: isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50',
        };
    }
  }, [status, isRunning, activeContractId]);

  return (
    <div className="w-full space-y-4">
      {/* Bot Header & Master Action */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Auto Trading Bot</h2>
              <p className="text-[11px] text-muted-foreground">
                Automated algorithmic execution on {activeSymbol?.underlying_symbol_name || 'Deriv'}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`gap-1.5 px-2.5 py-1 text-xs font-medium ${statusDisplay.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusDisplay.dot}`} />
            {statusDisplay.text}
          </Badge>
        </div>

        {/* Master Start / Stop Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {isRunning ? (
            <Button
              type="button"
              size="lg"
              variant="destructive"
              className="w-full gap-2 font-semibold shadow-md active:scale-[0.98] transition-all cursor-pointer"
              onClick={() => stopBot('Stopped by user')}
            >
              <Square className="h-4 w-4 fill-current" />
              <span>STOP AUTO BOT</span>
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              className="w-full gap-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-[0.98] transition-all cursor-pointer"
              onClick={() => {
                if (!isAuthenticated && onOpenLogin) {
                  onOpenLogin();
                } else {
                  startBot();
                }
              }}
            >
              <Play className="h-4 w-4 fill-current" />
              <span>START AUTO BOT</span>
            </Button>
          )}

          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full gap-2 text-xs cursor-pointer"
            onClick={resetStats}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Session Stats</span>
          </Button>
        </div>

        {!isAuthenticated && (
          <div className="mt-1 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-xs text-primary font-medium">Log in to enable automated trading</span>
            <Button size="sm" variant="default" className="h-7 text-xs px-2.5" onClick={onOpenLogin}>
              Log In
            </Button>
          </div>
        )}
      </div>

      {/* Session Performance Dashboard Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Net Profit */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">Session P&L</span>
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <div className="mt-2">
            <div
              className={`text-lg sm:text-xl font-bold tracking-tight ${
                sessionProfit > 0
                  ? 'text-emerald-500'
                  : sessionProfit < 0
                  ? 'text-destructive'
                  : 'text-foreground'
              }`}
            >
              {sessionProfit >= 0 ? '+' : ''}
              {sessionProfit.toFixed(2)} USD
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>Target: +${config.takeProfit.toFixed(0)}</span>
              <span>Stop: -${config.stopLoss.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">Win Rate</span>
            <Activity className="h-3.5 w-3.5" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {winRate.toFixed(1)}%
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
              <span className="text-emerald-500 font-medium">{winCount} Won</span>
              <span>/</span>
              <span className="text-destructive font-medium">{lossCount} Lost</span>
              <span className="text-muted-foreground">({totalTrades} total)</span>
            </div>
          </div>
        </div>

        {/* Current Stake */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">Next Stake</span>
            <Layers className="h-3.5 w-3.5" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              ${currentStake.toFixed(2)} USD
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {consecutiveLosses > 0 ? (
                <span className="text-amber-500 font-medium">
                  Martingale Step {consecutiveLosses} ({config.martingale}x)
                </span>
              ) : (
                <span>Base Stake Level</span>
              )}
            </div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">Streak & Protection</span>
            <Flame className="h-3.5 w-3.5" />
          </div>
          <div className="mt-2">
            <div className="text-sm sm:text-base font-semibold tracking-tight">
              {consecutiveWins > 0 ? (
                <span className="text-emerald-500 flex items-center gap-1">
                  🔥 {consecutiveWins} Wins in row
                </span>
              ) : consecutiveLosses > 0 ? (
                <span className="text-amber-500 flex items-center gap-1">
                  ⚠️ {consecutiveLosses} Loss streak
                </span>
              ) : (
                <span className="text-muted-foreground">Neutral Streak</span>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Max Loss Guard: {config.maxConsecutiveLosses} trades
            </div>
          </div>
        </div>
      </div>

      {/* Bot Parameters Settings (Stake & Risk Management) */}
      <div className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bot Configuration
          </span>
          <span className="text-[11px] text-muted-foreground">Stake & Risk Settings</span>
        </div>

        {/* Stake and Martingale */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="base-stake" className="text-xs text-muted-foreground">
              Base Stake (USD)
            </Label>
            <Input
              id="base-stake"
              type="number"
              min={0.35}
              step={0.5}
              value={config.baseStake}
              disabled={isRunning}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) updateConfig({ baseStake: val });
              }}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="martingale" className="text-xs text-muted-foreground">
              Martingale Multiplier
            </Label>
            <Select
              value={String(config.martingale)}
              disabled={isRunning}
              onValueChange={(val) => updateConfig({ martingale: parseFloat(val) })}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1.0x (Flat / No Martingale)</SelectItem>
                <SelectItem value="1.5">1.5x (Conservative)</SelectItem>
                <SelectItem value="2">2.0x (Standard Martingale)</SelectItem>
                <SelectItem value="2.1">2.1x (Aggressive Recovery)</SelectItem>
                <SelectItem value="2.5">2.5x (High Risk)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Take Profit & Stop Loss */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="take-profit" className="text-xs text-emerald-500 font-medium">
              Target Profit ($)
            </Label>
            <Input
              id="take-profit"
              type="number"
              min={1}
              step={5}
              value={config.takeProfit}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) updateConfig({ takeProfit: val });
              }}
              className="text-xs border-emerald-500/30 focus-visible:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stop-loss" className="text-xs text-destructive font-medium">
              Stop Loss ($)
            </Label>
            <Input
              id="stop-loss"
              type="number"
              min={1}
              step={5}
              value={config.stopLoss}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) updateConfig({ stopLoss: val });
              }}
              className="text-xs border-destructive/30 focus-visible:ring-destructive"
            />
          </div>
        </div>
      </div>

      {/* Live Bot Execution Log */}
      <div className="rounded-xl border border-border bg-card p-3 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Terminal className="h-3.5 w-3.5 text-primary" />
            <span>Live Bot Activity Log</span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {logs.length} events logged
          </span>
        </div>

        <div className="h-44 overflow-y-auto rounded-lg bg-black/5 dark:bg-black/40 border border-border/50 p-2 text-[11px] font-mono space-y-1.5 select-text">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground/60 text-xs font-sans">
              Waiting for bot activity...
            </div>
          ) : (
            logs.map((log) => {
              let badgeColor = 'text-muted-foreground';
              if (log.type === 'win') badgeColor = 'text-emerald-500 font-bold';
              if (log.type === 'loss') badgeColor = 'text-rose-500 font-bold';
              if (log.type === 'buy') badgeColor = 'text-blue-400';
              if (log.type === 'warn') badgeColor = 'text-amber-400';
              if (log.type === 'stop') badgeColor = 'text-orange-400';

              return (
                <div key={log.id} className="flex items-start gap-1.5 leading-snug">
                  <span className="text-muted-foreground/50 shrink-0">[{log.time}]</span>
                  <span className={badgeColor}>{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Link to reports */}
      {isAuthenticated && (
        onSwitchToReports ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onSwitchToReports}
            className="w-full text-xs text-muted-foreground hover:text-foreground justify-center gap-1 cursor-pointer active:scale-[0.99] transition-transform"
          >
            <span>View Positions & Transaction History</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            asChild
            variant="ghost"
            className="w-full text-xs text-muted-foreground hover:text-foreground justify-center gap-1 cursor-pointer"
          >
            <Link href="/reports">
              <span>View Positions & Transaction History</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )
      )}
    </div>
  );
}
