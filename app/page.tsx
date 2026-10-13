'use client';

import { useEffect, useState } from 'react';
import { LiveRiseFall } from '../components/live-rise-fall';
import { DEFAULT_APP_CONFIG, normalizeAppConfig, type RiseFallAppConfig } from '../lib/app-config';

let cachedConfig: RiseFallAppConfig = DEFAULT_APP_CONFIG;
let configLoaded = false;

/**
 * Deployed app. Reads the no-code config injected at deploy time
 * (public/app-config.json). Fully functional automated trading bot.
 */
export default function RiseFallPage() {
  const [config, setConfig] = useState<RiseFallAppConfig>(cachedConfig);

  useEffect(() => {
    if (configLoaded) return;
    let cancelled = false;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
    fetch(`${base}/app-config.json`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          const normalized = normalizeAppConfig(data);
          cachedConfig = normalized;
          configLoaded = true;
          setConfig(normalized);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return <LiveRiseFall appConfig={config} defaultTab="dashboard" />;
}
