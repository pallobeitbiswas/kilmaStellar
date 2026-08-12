import { useCallback, useEffect, useState } from 'react';
import { telemetry, type TelemetryEvent } from '@/lib/telemetry';

export interface AnalyticsSummary {
  total: number;
  byType: Record<TelemetryEvent['type'], number>;
  recentEvents: TelemetryEvent[];
}

const DEFAULT_SUMMARY: AnalyticsSummary = {
  total: 0,
  byType: {
    wallet_connect: 0,
    wallet_disconnect: 0,
    transaction: 0,
    error: 0,
    page_view: 0,
  },
  recentEvents: [],
};

export function useAnalytics() {
  const [summary, setSummary] = useState<AnalyticsSummary>(DEFAULT_SUMMARY);

  const refresh = useCallback(() => {
    const events = telemetry.getEvents();
    const byType = { ...DEFAULT_SUMMARY.byType };

    for (const evt of events) {
      if (evt.type in byType) {
        byType[evt.type]++;
      }
    }

    setSummary({
      total: events.length,
      byType,
      recentEvents: events.slice(0, 20),
    });
  }, []);

  useEffect(() => {
    refresh();
    // Re-aggregate every 15 seconds to pick up new events
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { summary, refresh };
}
