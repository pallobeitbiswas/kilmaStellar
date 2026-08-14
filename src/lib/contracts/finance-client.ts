import * as StellarSdk from '@stellar/stellar-sdk';
import { stellar } from '../stellar';

const FINANCE_CONTRACT_ID = import.meta.env.VITE_FINANCE_CONTRACT_ID || '';

export interface Loan {
  borrower: string;
  orderId: number;
  principal: string;
  interest: string;
  repaid: boolean;
}

function parseLoan(raw: Record<string, unknown>): Loan {
  return {
    borrower: String(raw.borrower || ''),
    orderId: Number(raw.order_id || 0),
    principal: stellar.stroopsToXlm(String(raw.principal || '0')),
    interest: stellar.stroopsToXlm(String(raw.interest || '0')),
    repaid: Boolean(raw.repaid),
  };
}

export class FinanceContractClient {
  private contractId: string;

  constructor(contractId: string = FINANCE_CONTRACT_ID) {
    this.contractId = contractId;
  }

  async getLoanCount(publicKey: string): Promise<number> {
    try {
      const result = await stellar.simulateRead({
        publicKey,
        contractId: this.contractId,
        method: 'get_loan_count',
      });
      return result ? Number(StellarSdk.scValToNative(result)) : 0;
    } catch {
      return 0;
    }
  }

  async getPoolBalance(publicKey: string): Promise<string> {
    try {
      const result = await stellar.simulateRead({
        publicKey,
        contractId: this.contractId,
        method: 'get_pool_balance',
      });
      return result ? stellar.stroopsToXlm(String(StellarSdk.scValToNative(result))) : '0';
    } catch {
      return '0';
    }
  }

  async getLoan(loanId: number, publicKey: string): Promise<Loan> {
    const result = await stellar.simulateRead({
      publicKey,
      contractId: this.contractId,
      method: 'get_loan',
      args: [StellarSdk.nativeToScVal(loanId, { type: 'u64' })],
    });
    if (!result) throw new Error('Loan not found');
    return parseLoan(StellarSdk.scValToNative(result) as Record<string, unknown>);
  }

  async requestLoan(params: {
    publicKey: string;
    orderId: number;
    amountXlm: string;
  }): Promise<{ hash: string }> {
    return stellar.buildAndSignTx({
      publicKey: params.publicKey,
      contractId: this.contractId,
      method: 'request_loan',
      args: [
        StellarSdk.nativeToScVal(params.publicKey, { type: 'address' }),
        StellarSdk.nativeToScVal(params.orderId, { type: 'u64' }),
        StellarSdk.nativeToScVal(BigInt(stellar.xlmToStroops(params.amountXlm)), { type: 'i128' }),
      ],
    });
  }

  async repayLoan(params: {
    publicKey: string;
    loanId: number;
  }): Promise<{ hash: string }> {
    return stellar.buildAndSignTx({
      publicKey: params.publicKey,
      contractId: this.contractId,
      method: 'repay_loan',
      args: [
        StellarSdk.nativeToScVal(params.publicKey, { type: 'address' }),
        StellarSdk.nativeToScVal(params.loanId, { type: 'u64' }),
      ],
    });
  }
}

export const financeClient = new FinanceContractClient();
