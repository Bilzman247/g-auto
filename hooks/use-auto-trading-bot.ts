'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { DerivWS, ActiveSymbol, ProposalResponse, BuyResponse } from '@deriv/core';
import type { Direction, DurationSelectUnit } from '@/lib/types';

export type BotStrategy =
  | 'trend'
  | 'reversal'
  | 'alternating'
  | 'follow_winner'
  | 'always_rise'
  | 'always_fall';

export type BotStatus =
  | 'IDLE'
  | 'WAITING_FOR_AUTH'
  | 'ANALYZING'
  | 'PURCHASING'
  | 'WAITING_RESULT'
  | 'PAUSED'
  | 'STOPPED_TAKE_PROFIT'
  | 'STOPPED_STOP_LOSS'
  | 'STOPPED_MAX_LOSSES';

export interface BotLogEntry {
  id: string;
  time: string;
  type: 'info' | 'buy' | 'win' | 'loss' | 'warn' | 'stop';
  message: string;
  profit?: number;
}

export interface AutoBotConfig {
  baseStake: number;
  martingale: number;
  takeProfit: number;
  stopLoss: number;
  strategy: BotStrategy;
  duration: number;
  durationUnit: DurationSelectUnit;
  allowEquals: boolean;
  maxConsecutiveLosses: number;
  tradeDelaySeconds: number;
}

export interface UseAutoTradingBotParams {
  ws: DerivWS | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  activeSymbol: ActiveSymbol | null;
  prices: number[];
  onRequireAuth?: () => void;
}

export function useAutoTradingBot({
  ws,
  isConnected,
  isAuthenticated,
  activeSymbol,
  prices,
  onRequireAuth,
}: UseAutoTradingBotParams) {
  // Configuration
  const [config, setConfig] = useState<AutoBotConfig>({
    baseStake: 1.0,
    martingale: 2.0,
    takeProfit: 20.0,
    stopLoss: 10.0,
    strategy: 'trend',
    duration: 5,
    durationUnit: 't',
    allowEquals: false,
    maxConsecutiveLosses: 5,
    tradeDelaySeconds: 2,
  });

  // Bot running state — initialized to false (starts ONLY when user explicitly starts the bot)
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [status, setStatus] = useState<BotStatus>('IDLE');

  // Performance metrics
  const [currentStake, setCurrentStake] = useState<number>(config.baseStake);
  const [sessionProfit, setSessionProfit] = useState<number>(0);
  const [totalTrades, setTotalTrades] = useState<number>(0);
  const [winCount, setWinCount] = useState<number>(0);
  const [lossCount, setLossCount] = useState<number>(0);
  const [consecutiveWins, setConsecutiveWins] = useState<number>(0);
  const [consecutiveLosses, setConsecutiveLosses] = useState<number>(0);
  const [activeContractId, setActiveContractId] = useState<number | null>(null);
  const [logs, setLogs] = useState<BotLogEntry[]>([]);

  // Refs for tracking mutable execution loop
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  const configRef = useRef(config);
  configRef.current = config;

  const pricesRef = useRef(prices);
  pricesRef.current = prices;

  const activeSymbolRef = useRef(activeSymbol);
  activeSymbolRef.current = activeSymbol;

  const currentStakeRef = useRef(currentStake);
  currentStakeRef.current = currentStake;

  const sessionProfitRef = useRef(sessionProfit);
  sessionProfitRef.current = sessionProfit;

  const consecutiveLossesRef = useRef(consecutiveLosses);
  consecutiveLossesRef.current = consecutiveLosses;

  const consecutiveWinsRef = useRef(consecutiveWins);
  consecutiveWinsRef.current = consecutiveWins;

  const lastDirectionRef = useRef<Direction>('CALL');
  const lastResultRef = useRef<'won' | 'lost' | null>(null);
  const isExecutingRef = useRef<boolean>(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addLog = useCallback(
    (type: BotLogEntry['type'], message: string, profit?: number) => {
      const now = new Date();
      const time = now.toTimeString().split(' ')[0];
      const entry: BotLogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        time,
        type,
        message,
        profit,
      };
      setLogs((prev) => [entry, ...prev.slice(0, 99)]);
    },
    []
  );

  const stopBot = useCallback(
    (reason: string = 'User stopped bot', finalStatus: BotStatus = 'PAUSED') => {
      setIsRunning(false);
      setStatus(finalStatus);
      isExecutingRef.current = false;
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
      addLog('stop', `🛑 Bot stopped: ${reason}`);
    },
    [addLog]
  );

  const startBot = useCallback(() => {
    if (!isAuthenticated) {
      addLog('warn', '⚠️ Authentication required. Please log in to start live auto-trading.');
      setStatus('WAITING_FOR_AUTH');
      onRequireAuth?.();
      return;
    }

    if (!isConnected || !ws) {
      addLog('warn', '⚠️ Waiting for WebSocket connection...');
      return;
    }

    setIsRunning(true);
    setStatus('ANALYZING');
    addLog(
      'info',
      `🚀 Auto Trading Bot started! Strategy: ${configRef.current.strategy.toUpperCase()} | Base Stake: $${configRef.current.baseStake.toFixed(2)} | Target: +$${configRef.current.takeProfit.toFixed(2)}`
    );
  }, [isAuthenticated, isConnected, ws, addLog, onRequireAuth]);

  const resetStats = useCallback(() => {
    setSessionProfit(0);
    setTotalTrades(0);
    setWinCount(0);
    setLossCount(0);
    setConsecutiveWins(0);
    setConsecutiveLosses(0);
    setCurrentStake(configRef.current.baseStake);
    currentStakeRef.current = configRef.current.baseStake;
    setLogs([]);
    addLog('info', '📊 Session statistics reset.');
  }, [addLog]);

  const updateConfig = useCallback((partial: Partial<AutoBotConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...partial };
      configRef.current = next;
      // If base stake updated and not in loss recovery, update current stake
      if (partial.baseStake !== undefined && consecutiveLossesRef.current === 0) {
        setCurrentStake(partial.baseStake);
        currentStakeRef.current = partial.baseStake;
      }
      return next;
    });
  }, []);

  // Compute direction based on configured strategy
  const determineDirection = useCallback((): Direction => {
    const strat = configRef.current.strategy;
    const p = pricesRef.current;

    switch (strat) {
      case 'trend': {
        if (p.length >= 2) {
          const diff = p[p.length - 1] - p[p.length - 2];
          return diff >= 0 ? 'CALL' : 'PUT';
        }
        return 'CALL';
      }
      case 'reversal': {
        if (p.length >= 3) {
          const up = p[p.length - 1] > p[p.length - 2] && p[p.length - 2] > p[p.length - 3];
          const down = p[p.length - 1] < p[p.length - 2] && p[p.length - 2] < p[p.length - 3];
          if (up) return 'PUT';
          if (down) return 'CALL';
        }
        return lastDirectionRef.current === 'CALL' ? 'PUT' : 'CALL';
      }
      case 'alternating': {
        return lastDirectionRef.current === 'CALL' ? 'PUT' : 'CALL';
      }
      case 'follow_winner': {
        if (lastResultRef.current === 'lost') {
          return lastDirectionRef.current === 'CALL' ? 'PUT' : 'CALL';
        }
        return lastDirectionRef.current;
      }
      case 'always_rise':
        return 'CALL';
      case 'always_fall':
        return 'PUT';
      default:
        return 'CALL';
    }
  }, []);

  // Main trade execution cycle
  const executeNextTrade = useCallback(async () => {
    if (!isRunningRef.current) return;
    if (isExecutingRef.current) return;

    if (!isAuthenticated) {
      setStatus('WAITING_FOR_AUTH');
      return;
    }

    if (!isConnected || !ws) {
      return;
    }

    const symbol = activeSymbolRef.current;
    if (!symbol) return;

    // Check risk rules before opening trade
    const currentProfit = sessionProfitRef.current;
    const cfg = configRef.current;

    if (currentProfit >= cfg.takeProfit) {
      toast.success(`🎯 Take Profit Hit! +$${currentProfit.toFixed(2)} USD`, {
        description: 'Auto Bot safely locked in target profit and paused.',
      });
      stopBot(`Target Profit Reached (+$${currentProfit.toFixed(2)})`, 'STOPPED_TAKE_PROFIT');
      return;
    }

    if (currentProfit <= -cfg.stopLoss) {
      toast.error(`🛑 Stop Loss Triggered! -$${Math.abs(currentProfit).toFixed(2)} USD`, {
        description: 'Auto Bot paused to protect your account balance.',
      });
      stopBot(`Stop Loss Triggered (-$${Math.abs(currentProfit).toFixed(2)})`, 'STOPPED_STOP_LOSS');
      return;
    }

    if (consecutiveLossesRef.current >= cfg.maxConsecutiveLosses) {
      toast.warning(`⚠️ Max Consecutive Losses (${cfg.maxConsecutiveLosses}) Reached`, {
        description: 'Auto Bot paused as a safety circuit-breaker.',
      });
      stopBot(`Max consecutive losses reached (${cfg.maxConsecutiveLosses})`, 'STOPPED_MAX_LOSSES');
      return;
    }

    isExecutingRef.current = true;
    setStatus('ANALYZING');

    addLog(
      'info',
      `🔍 Analyzing ${symbol.underlying_symbol_name || symbol.underlying_symbol} market momentum...`
    );

    let direction: Direction = 'CALL';
    try {
      const res = await fetch('/api/gemini/filter-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: pricesRef.current }),
      });
      const data = await res.json();
      if (!data.shouldTrade) {
        addLog('info', '⏳ Market consolidating / waiting for optimal conditions...');
        isExecutingRef.current = false;
        setStatus('ANALYZING');
        if (isRunningRef.current) {
          cooldownTimerRef.current = setTimeout(() => {
            if (isRunningRef.current) {
              executeNextTradeRef.current();
            }
          }, 3000);
        }
        return;
      }
      direction = data.direction === 'PUT' ? 'PUT' : 'CALL';
    } catch {
      direction = determineDirection();
    }

    lastDirectionRef.current = direction;
    const stakeToUse = currentStakeRef.current;
    const contractType = cfg.allowEquals ? `${direction}E` : direction;

    addLog(
      'info',
      `⚡ Signal validated: Executing ${direction} ($${stakeToUse.toFixed(2)}) 5-tick contract`
    );

    try {
      setStatus('PURCHASING');

      // 1. Attempt Deriv live contract purchase via WebSocket
      let contractId: number = 0;
      let isSimulated = false;
      let payout = parseFloat((stakeToUse * 1.95).toFixed(2));
      const entryPrice = pricesRef.current[pricesRef.current.length - 1] ?? 0;

      try {
        const propPayload: Record<string, unknown> = {
          proposal: 1,
          amount: stakeToUse,
          basis: 'stake',
          contract_type: contractType,
          currency: 'USD',
          duration: cfg.duration,
          duration_unit: cfg.durationUnit,
          underlying_symbol: symbol.underlying_symbol,
        };

        const propRes = await ws.send<ProposalResponse>(propPayload);
        if (propRes?.proposal?.id) {
          payout = propRes.proposal.payout;
          const buyRes = await ws.send<BuyResponse>({
            buy: propRes.proposal.id,
            price: String(propRes.proposal.ask_price),
          });
          if (buyRes?.buy?.contract_id) {
            contractId = buyRes.buy.contract_id;
          } else {
            throw new Error('Buy returned no contract ID');
          }
        } else {
          throw new Error('Proposal unavailable');
        }
      } catch {
        // Fallback to Practice Simulation mode against live ticks
        isSimulated = true;
        contractId = Math.floor(100000000000 + Math.random() * 900000000000);
      }

      setActiveContractId(contractId);
      setStatus('WAITING_RESULT');

      addLog(
        'buy',
        `⚡ ${isSimulated ? '[Practice] ' : ''}Bought ${direction} #${contractId} @ $${stakeToUse.toFixed(2)} | Payout: $${payout.toFixed(2)}`
      );

      // 2. Monitor contract settlement
      await new Promise<void>((resolve) => {
        let settled = false;
        let unsubscribeFn: (() => Promise<void>) | null = null;
        let safetyTimeout: ReturnType<typeof setTimeout> | null = null;

        const complete = (isWin: boolean, profit: number) => {
          if (settled) return;
          settled = true;
          if (safetyTimeout) clearTimeout(safetyTimeout);
          if (unsubscribeFn) unsubscribeFn();

          setActiveContractId(null);
          setTotalTrades((prev) => prev + 1);

          if (isWin) {
            lastResultRef.current = 'won';
            setWinCount((w) => w + 1);
            setConsecutiveWins((cw) => cw + 1);
            setConsecutiveLosses(0);
            consecutiveLossesRef.current = 0;

            const nextProfit = sessionProfitRef.current + profit;
            sessionProfitRef.current = nextProfit;
            setSessionProfit(nextProfit);

            // Reset stake to base
            setCurrentStake(cfg.baseStake);
            currentStakeRef.current = cfg.baseStake;

            addLog(
              'win',
              `✅ WON #${contractId}: +$${profit.toFixed(2)} | Net P&L: ${nextProfit >= 0 ? '+' : ''}$${nextProfit.toFixed(2)}`,
              profit
            );
          } else {
            lastResultRef.current = 'lost';
            setLossCount((l) => l + 1);
            setConsecutiveLosses((cl) => {
              const nextLossCount = cl + 1;
              consecutiveLossesRef.current = nextLossCount;
              return nextLossCount;
            });
            setConsecutiveWins(0);

            const lossAmount = Math.abs(profit) > 0 ? Math.abs(profit) : stakeToUse;
            const nextProfit = sessionProfitRef.current - lossAmount;
            sessionProfitRef.current = nextProfit;
            setSessionProfit(nextProfit);

            // Apply Martingale
            const nextStake = parseFloat((stakeToUse * cfg.martingale).toFixed(2));
            setCurrentStake(nextStake);
            currentStakeRef.current = nextStake;

            addLog(
              'loss',
              `❌ LOST #${contractId}: -$${lossAmount.toFixed(2)} | Martingale ${cfg.martingale}x -> Next Stake: $${nextStake.toFixed(2)}`,
              -lossAmount
            );
          }

          resolve();
        };

        if (isSimulated) {
          // Monitor live market prices for simulation duration
          const targetTicks = cfg.durationUnit === 't' ? cfg.duration : Math.max(1, Math.round(cfg.duration / 2));
          const initialLength = pricesRef.current.length;

          const checkInterval = setInterval(() => {
            const currentLen = pricesRef.current.length;
            const ticksElapsed = Math.max(0, currentLen - initialLength);

            if (ticksElapsed >= targetTicks || settled) {
              clearInterval(checkInterval);
              const exitPrice = pricesRef.current[pricesRef.current.length - 1] ?? entryPrice;
              let isWin = false;
              if (direction === 'CALL') {
                isWin = cfg.allowEquals ? exitPrice >= entryPrice : exitPrice > entryPrice;
              } else {
                isWin = cfg.allowEquals ? exitPrice <= entryPrice : exitPrice < entryPrice;
              }
              const calculatedProfit = isWin ? payout - stakeToUse : -stakeToUse;
              complete(isWin, calculatedProfit);
            }
          }, 400);

          safetyTimeout = setTimeout(() => {
            clearInterval(checkInterval);
            if (!settled) {
              const exitPrice = pricesRef.current[pricesRef.current.length - 1] ?? entryPrice;
              let isWin = false;
              if (direction === 'CALL') {
                isWin = cfg.allowEquals ? exitPrice >= entryPrice : exitPrice > entryPrice;
              } else {
                isWin = cfg.allowEquals ? exitPrice <= entryPrice : exitPrice < entryPrice;
              }
              const calculatedProfit = isWin ? payout - stakeToUse : -stakeToUse;
              complete(isWin, calculatedProfit);
            }
          }, Math.max(3000, (cfg.duration + 2) * 1000));
          return;
        }

        // Live contract subscription on Deriv server
        ws.subscribe(
          {
            proposal_open_contract: 1,
            contract_id: contractId,
            subscribe: 1,
          },
          (data) => {
            const poc = data.proposal_open_contract as Record<string, unknown> | undefined;
            if (!poc) return;

            const isExpired = Boolean(poc.is_expired);
            const isSold = Boolean(poc.is_sold);

            if (isExpired || isSold) {
              const rawProfit = parseFloat(String(poc.profit ?? '0'));
              const isWon = poc.status === 'won' || rawProfit > 0;
              complete(isWon, rawProfit);
            }
          }
        )
          .then((sub) => {
            unsubscribeFn = sub.unsubscribe;
          })
          .catch(() => {
            // Subscription fallback handled by safetyTimeout
          });

        const timeoutMs = Math.max(12000, (cfg.duration + 5) * 1000);
        safetyTimeout = setTimeout(async () => {
          if (settled) return;
          try {
            const check = await ws.send<{ proposal_open_contract?: Record<string, unknown> }>({
              proposal_open_contract: 1,
              contract_id: contractId,
            });
            const poc = check.proposal_open_contract;
            if (poc && (poc.is_expired || poc.is_sold)) {
              const rawProfit = parseFloat(String(poc.profit ?? '0'));
              complete(poc.status === 'won' || rawProfit > 0, rawProfit);
              return;
            }
          } catch {
            // fall through
          }
          complete(false, -stakeToUse);
        }, timeoutMs);
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown trading error';
      addLog('warn', `⚠️ Trade error: ${errMsg}`);

      if (errMsg.toLowerCase().includes('insufficient') || errMsg.toLowerCase().includes('balance')) {
        toast.error('Insufficient Account Balance', {
          description: 'Auto Bot stopped. Please top up your account or lower base stake.',
        });
        stopBot('Insufficient balance', 'PAUSED');
        return;
      }
    } finally {
      isExecutingRef.current = false;

      // Plan next trade if bot is still running
      if (isRunningRef.current) {
        setStatus('ANALYZING');
        const delayMs = Math.max(1000, cfg.tradeDelaySeconds * 1000);
        cooldownTimerRef.current = setTimeout(() => {
          if (isRunningRef.current) {
            executeNextTrade();
          }
        }, delayMs);
      }
    }
  }, [
    determineDirection,
    isAuthenticated,
    isConnected,
    ws,
    addLog,
    stopBot,
  ]);

  const executeNextTradeRef = useRef<() => Promise<void>>(() => Promise.resolve());
  executeNextTradeRef.current = executeNextTrade;

  // Main lifecycle trigger
  useEffect(() => {
    if (!isRunning) {
      setStatus((s) => (s.startsWith('STOPPED') ? s : 'IDLE'));
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
      return;
    }

    if (!isAuthenticated) {
      setStatus('WAITING_FOR_AUTH');
      return;
    }

    if (!isConnected || !ws) {
      setStatus('IDLE');
      return;
    }

    if (!activeSymbol) {
      setStatus('ANALYZING');
      return;
    }

    if (!isExecutingRef.current && !cooldownTimerRef.current) {
      executeNextTradeRef.current();
    }

    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    };
  }, [isRunning, isAuthenticated, isConnected, ws, activeSymbol?.underlying_symbol]);

  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

  return {
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
  };
}

export type UseAutoTradingBotReturn = ReturnType<typeof useAutoTradingBot>;
export type BotLog = BotLogEntry;
export type { Direction };
