'use client';

import { BarChart2, CheckCircle2, XCircle, Bot, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { UseAutoTradingBotReturn, BotLog } from '@/hooks/use-auto-trading-bot';
import type { OpenPosition } from '@/lib/types';

interface InAppReportsProps {
  bot: UseAutoTradingBotReturn;
  openPositions: OpenPosition[];
  isAuthenticated: boolean;
  onOpenLogin: () => void;
  onSwitchToBot: () => void;
}

export function InAppReports({
  bot,
  openPositions,
  isAuthenticated,
  onOpenLogin,
  onSwitchToBot,
}: InAppReportsProps) {
  const { logs, totalTrades, winCount, lossCount, sessionProfit, resetStats } = bot;

  return (
    <div className="space-y-3.5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold tracking-tight text-foreground">
            Positions & Reports
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Real-time orders, telemetry logs & closed trades
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
          onClick={resetStats}
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </Button>
      </div>

      {/* Summary Banner */}
      <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Net Executed P&L
          </span>
          <div className={`text-xl font-black tracking-tight ${sessionProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
            {sessionProfit >= 0 ? '+' : ''}${sessionProfit.toFixed(2)} USD
          </div>
        </div>
        <div className="text-right space-y-0.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Record
          </span>
          <div className="text-sm font-bold text-foreground">
            {winCount}W / {lossCount}L <span className="text-xs text-muted-foreground font-normal">({totalTrades} trades)</span>
          </div>
        </div>
      </div>

      {/* Live Open Positions Section */}
      <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">
            Open Contract Positions
          </span>
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
            {openPositions.length} Active
          </Badge>
        </div>

        {openPositions.length === 0 ? (
          <div className="py-4 text-center rounded-xl bg-muted/30 border border-dashed border-border/80 space-y-1">
            <p className="text-xs text-muted-foreground font-medium">
              No open contract positions right now.
            </p>
            <p className="text-[11px] text-muted-foreground">
              When the bot or manual trade enters an order, it appears here live.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {openPositions.map((pos) => (
              <div
                key={pos.contract_id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border"
              >
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    #{pos.contract_id} {pos.underlying_symbol}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Buy Price: ${Number(pos.buy_price).toFixed(2)}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs font-semibold animate-pulse border-primary/40 text-primary">
                  In Progress
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trade Execution History Logs */}
      <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">
            Automated Bot Execution Log
          </span>
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
            {logs.length} Entries
          </Badge>
        </div>

        {logs.length === 0 ? (
          <div className="py-6 text-center rounded-xl bg-muted/30 border border-dashed border-border/80 space-y-2">
            <Bot className="h-6 w-6 text-muted-foreground/60 mx-auto" />
            <p className="text-xs text-muted-foreground font-medium">
              No execution history recorded yet.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-xs h-8 cursor-pointer"
              onClick={onSwitchToBot}
            >
              Start Bot to Begin Trading
            </Button>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {logs.map((log: BotLog) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-2 p-2 rounded-xl bg-muted/30 border border-border/60 text-xs"
              >
                <div className="flex items-start gap-2 min-w-0">
                  {log.type === 'win' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : log.type === 'loss' ? (
                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-foreground leading-snug break-words">
                      {log.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {log.time}
                    </span>
                  </div>
                </div>
                {log.profit !== undefined && (
                  <span
                    className={`font-mono font-bold shrink-0 text-xs ${
                      log.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                    }`}
                  >
                    {log.profit >= 0 ? '+' : ''}${log.profit.toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Switch to Bot Button */}
      <button
        type="button"
        onClick={onSwitchToBot}
        className="w-full flex items-center justify-between p-3 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-bold text-foreground">Return to Trading Bot & Chart</span>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
      </button>
    </div>
  );
}
