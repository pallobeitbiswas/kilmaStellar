export type WalletType = 'freighter' | 'xbull' | 'albedo';

export interface WalletState {
  publicKey: string | null;
  walletType: WalletType | null;
  balance: string;
  isConnected: boolean;
  loading: boolean;
  error: string | null;
}

export interface TransactionStatus {
  status: 'idle' | 'pending' | 'success' | 'failure';
  txHash: string | null;
  error: string | null;
}

export type ProjectStatus =
  | 'created'
  | 'funded'
  | 'audit_submitted'
  | 'impact_verified'
  | 'certified'
  | 'rejected'
  | 'refunded';

export interface Project {
  id: number;
  sponsor: string;
  developer: string;
  auditor: string;
  certifier: string;
  amount: string;
  status: ProjectStatus;
  createdAt: number;
}

export interface EscrowDeposit {
  projectId: number;
  sponsor: string;
  amount: string;
  isActive: boolean;
}

export interface ContractEvent {
  id: string;
  type: string;
  topic: string[];
  value: unknown;
  ledger: number;
  txHash: string;
  createdAt: string;
}

