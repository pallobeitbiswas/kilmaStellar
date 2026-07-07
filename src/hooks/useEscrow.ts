

import { useCallback, useEffect, useState } from 'react';
import { escrowClient } from '@/lib/contracts/escrow-client';
import type { EscrowDeposit } from '@/lib/types';

export function useEscrow(projectId: number, publicKey?: string) {
  const [escrow, setEscrow] = useState<EscrowDeposit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEscrow = useCallback(async () => {
    if (!publicKey || !projectId) {
      setEscrow(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await escrowClient.getEscrow(projectId, publicKey);
      setEscrow(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load escrow';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId, publicKey]);

  useEffect(() => {
    fetchEscrow();
  }, [fetchEscrow]);

  return { escrow, loading, error, refetch: fetchEscrow };
}
