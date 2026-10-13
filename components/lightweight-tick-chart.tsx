'use client';

import { useMemo } from 'react';
import type { ActiveSymbol } from '@deriv/core';
import { SymbolSelector } from '@/components/custom/symbol-selector';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export interface LightweightTickChartProps {
  symbols: ActiveSymbol[];
  activeSymbol: ActiveSymbol | null;
  onSymbolChange: (symbol: string) => void;
  prices?: number[];
  pipSize?: number;
}

export function LightweightTickChart({
  symbols,
  activeSymbol,
  onSymbolChange,
  prices = [],
  pipSize = 2,
}: LightweightTickChartProps) {
  const decimals = pipSize ?? 2;

  // Compute stats from current price window
  const { currentPrice, minPrice, maxPrice, priceChange, isUp, pathD, areaD, points } = useMemo(() => {
    if (!prices || prices.length === 0) {
      return {
        currentPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        priceChange: 0,
        isUp: true,
        pathD: '',
        areaD: '',
        points: [],
      };
    }

    const current = prices[prices.length - 1];
    const first = prices[0];
    const change = current - first;
    const up = change >= 0;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const width = 360;
    const height = 120;
    const paddingY = 12;

    const pts = prices.map((price, idx) => {
      const x = (idx / Math.max(prices.length - 1, 1)) * width;
      const normalized = (price - min) / range;
      const y = height - paddingY - normalized * (height - paddingY * 2);
      return { x, y, price };
    });

    let d = '';
    if (pts.length > 0) {
      d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < pts.length; i++) {
        d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
      }
    }

    let aD = '';
    if (pts.length > 0) {
      aD = `${d} L ${width} ${height} L 0 ${height} Z`;
    }

    return {
      currentPrice: current,
      minPrice: min,
      maxPrice: max,
      priceChange: change,
      isUp: up,
      pathD: d,
      areaD: aD,
      points: pts,
    };
  }, [prices]);

  const lastPoint = points.length > 0 ? points[points.length - 1] : null;

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-3 shadow-xs space-y-3">
      {/* Symbol Selector at Top */}
      <SymbolSelector
        symbols={symbols}
        activeSymbol={activeSymbol}
        onSymbolChange={onSymbolChange}
        prices={prices}
        pipSize={pipSize}
      />

      {/* Live Market Price & Window Summary */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold tracking-tight text-foreground font-mono">
            {currentPrice ? currentPrice.toFixed(decimals) : '—'}
          </span>
          {prices.length >= 2 && (
            <span
              className={`flex items-center text-xs font-semibold ${
                isUp ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {isUp ? <TrendingUp className="h-3.5 w-3.5 mr-0.5 inline" /> : <TrendingDown className="h-3.5 w-3.5 mr-0.5 inline" />}
              {priceChange >= 0 ? '+' : ''}
              {priceChange.toFixed(decimals)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
          <Activity className="h-3 w-3 text-primary animate-pulse" />
          <span>{prices.length} ticks live</span>
        </div>
      </div>

      {/* SVG Tick Chart */}
      <div className="relative w-full h-[120px] rounded-xl bg-muted/20 border border-border/40 overflow-hidden">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-30">
          <div className="border-b border-dashed border-border flex justify-between text-[9px] font-mono">
            <span>High: {maxPrice ? maxPrice.toFixed(decimals) : ''}</span>
          </div>
          <div className="border-b border-dashed border-border" />
          <div className="flex justify-between text-[9px] font-mono">
            <span>Low: {minPrice ? minPrice.toFixed(decimals) : ''}</span>
          </div>
        </div>

        {prices.length < 2 ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            Connecting live tick stream...
          </div>
        ) : (
          <svg
            viewBox="0 0 360 120"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartGradientUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="chartGradientDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gradient area */}
            <path
              d={areaD}
              fill={isUp ? 'url(#chartGradientUp)' : 'url(#chartGradientDown)'}
            />

            {/* Price line */}
            <path
              d={pathD}
              fill="none"
              stroke={isUp ? '#10b981' : '#f43f5e'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Pulse dot on latest tick */}
            {lastPoint && (
              <>
                <circle
                  cx={lastPoint.x}
                  cy={lastPoint.y}
                  r="5"
                  fill={isUp ? '#10b981' : '#f43f5e'}
                  className="animate-ping origin-center opacity-75"
                />
                <circle
                  cx={lastPoint.x}
                  cy={lastPoint.y}
                  r="4"
                  fill={isUp ? '#10b981' : '#f43f5e'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </>
            )}
          </svg>
        )}
      </div>
    </div>
  );
}
