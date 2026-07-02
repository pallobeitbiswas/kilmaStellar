export const STELLAR_RPC_URL =
  import.meta.env.VITE_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';

export const HORIZON_URL = 'https://horizon-testnet.stellar.org';

export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

export const EXPLORER_BASE_URL = 'https://stellar.expert/explorer/testnet';

export const ESCROW_CONTRACT_ID =
  import.meta.env.VITE_ESCROW_CONTRACT_ID || 'CBEBKFQAP46KIKWE4ECUZNTGD6T433NHQYY7DQSVQ2REVG7WAVQE64ZA';

export const PROJECT_CONTRACT_ID =
  import.meta.env.VITE_PROJECT_CONTRACT_ID || 'CA7MSP7ENYQENDNQT23N3GREKOKU6ZPJZAZUDCVMB6YA4HLRWSAQ4WCW';

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  created: { bg: 'bg-elevated/40 text-ink-muted border-hairline', text: 'text-ink-muted font-mono text-[10px] tracking-widest uppercase', dot: 'bg-ink-faint' },
  funded: { bg: 'bg-brand/10 text-brand border-brand-muted/30', text: 'text-brand font-mono text-[10px] tracking-widest uppercase', dot: 'bg-brand' },
  shipped: { bg: 'bg-long/10 text-long border-long/20', text: 'text-long font-mono text-[10px] tracking-widest uppercase font-bold', dot: 'bg-long animate-pulse' },
  delivered: { bg: 'bg-paper text-canvas border-paper', text: 'text-canvas font-mono text-[10px] tracking-widest uppercase font-bold', dot: 'bg-canvas' },
  inspected_passed: { bg: 'bg-paper text-canvas border-paper shadow-glow', text: 'text-canvas font-mono text-[10px] tracking-widest uppercase font-bold', dot: 'bg-canvas' },
  inspected_failed: { bg: 'bg-short/10 text-short border-short/20', text: 'text-short font-mono text-[10px] tracking-widest uppercase font-bold', dot: 'bg-short' },
  refunded: { bg: 'bg-transparent text-ink-faint border-hairline line-through', text: 'text-ink-faint font-mono text-[10px] tracking-widest uppercase line-through', dot: 'bg-hairline' },
};

export const STATUS_LABELS: Record<string, string> = {
  created: 'Proposed',
  funded: 'Funded',
  shipped: 'Audited',
  delivered: 'Verified',
  inspected_passed: 'Passed Quality Check',
  inspected_failed: 'Failed Quality Check',
  refunded: 'Refunded',
};
