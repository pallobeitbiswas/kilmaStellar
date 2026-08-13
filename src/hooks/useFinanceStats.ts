import { useCallback, useEffect, useState } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';
import { stellar } from '@/lib/stellar';

const FINANCE_CONTRACT_ID =
  import.meta.env.VITE_FINANCE_CONTRACT_ID || '';

export interface FinanceStats {
  loanCount: number;
  poolBalance: string;
  activePrincipal: string;
  loading: boolean;
  error: string | null;
}

const DEFAULT: FinanceStats = {
  loanCount: 0,
  poolBalance: '0.0000000',
  activePrincipal: '0.0000000',
  loading: false,
  error: null,
};

export function useFinanceStats(publicKey?: string) {
  const [stats, setStats] = useState<FinanceStats>(DEFAULT);

  const fetchStats = useCallback(async () => {
    if (!publicKey || !FINANCE_CONTRACT_ID) {
      setStats((s) => ({ ...s, loading: false }));
      return;
    }

    setStats((s) => ({ ...s, loading: true, error: null }));

    try {
      const result = await stellar.simulateRead({
        publicKey,
        contractId: FINANCE_CONTRACT_ID,
        method: 'get_finance_stats',
      });

      if (!result) {
        setStats({ ...DEFAULT, loading: false });
        return;
      }

      const raw = StellarSdk.scValToNative(result) as {
        loan_count: bigint | number;
        pool_balance: bigint | number;
        active_principal: bigint | number;
      };

      setStats({
        loanCount: Number(raw.loan_count),
        poolBalance: stellar.stroopsToXlm(String(raw.pool_balance)),
        activePrincipal: stellar.stroopsToXlm(String(raw.active_principal)),
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load finance stats';
      setStats((s) => ({ ...s, loading: false, error: message }));
    }
  }, [publicKey]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { ...stats, refetch: fetchStats };
}
