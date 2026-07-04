import * as StellarSdk from '@stellar/stellar-sdk';
import { stellar } from '../stellar';
import { PROJECT_CONTRACT_ID } from '../constants';
import type { Project, ProjectStatus } from '../types';

function parseProjectStatus(val: string): ProjectStatus {
  const map: Record<string, ProjectStatus> = {
    Proposed: 'created',
    Funded: 'funded',
    AuditSubmitted: 'audit_submitted',
    Verified: 'impact_verified',
    Certified: 'certified',
    Rejected: 'rejected',
    Refunded: 'refunded',
  };
  return map[val] || 'created';
}

function parseProject(raw: Record<string, unknown>): Project {
  return {
    id: Number(raw.id || 0),
    sponsor: String(raw.sponsor || ''),
    developer: String(raw.developer || ''),
    auditor: String(raw.auditor || ''),
    certifier: String(raw.certifier || ''),
    amount: stellar.stroopsToXlm(String(raw.amount || '0')),
    status: parseProjectStatus(String(raw.status || 'Proposed')),
    createdAt: Number(raw.created_at || 0),
  };
}

export class ProjectContractClient {
  private contractId: string;

  constructor(contractId: string = PROJECT_CONTRACT_ID) {
    this.contractId = contractId;
  }

  async getProjectCount(publicKey: string): Promise<number> {
    try {
      const result = await stellar.simulateRead({
        publicKey,
        contractId: this.contractId,
        method: 'get_project_count',
      });
      return result ? Number(StellarSdk.scValToNative(result)) : 0;
    } catch {
      return 0;
    }
  }

  async getProject(projectId: number, publicKey: string): Promise<Project> {
    const result = await stellar.simulateRead({
      publicKey,
      contractId: this.contractId,
      method: 'get_project',
      args: [StellarSdk.nativeToScVal(projectId, { type: 'u64' })],
    });
    if (!result) throw new Error('Project not found');
    return parseProject(StellarSdk.scValToNative(result) as Record<string, unknown>);
  }

  async createProject(params: {
    publicKey: string;
    developer: string;
    auditor: string;
    certifier: string;
    amountXlm: string;
  }): Promise<{ hash: string }> {
    return stellar.buildAndSignTx({
      publicKey: params.publicKey,
      contractId: this.contractId,
      method: 'create_project',
      args: [
        StellarSdk.nativeToScVal(params.publicKey, { type: 'address' }),
        StellarSdk.nativeToScVal(params.developer, { type: 'address' }),
        StellarSdk.nativeToScVal(params.auditor, { type: 'address' }),
        StellarSdk.nativeToScVal(params.certifier, { type: 'address' }),
        StellarSdk.nativeToScVal(BigInt(stellar.xlmToStroops(params.amountXlm)), { type: 'i128' }),
      ],
    });
  }

  async submitAudit(publicKey: string, projectId: number): Promise<{ hash: string }> {
    return stellar.buildAndSignTx({
      publicKey,
      contractId: this.contractId,
      method: 'submit_audit',
      args: [
        StellarSdk.nativeToScVal(publicKey, { type: 'address' }),
        StellarSdk.nativeToScVal(projectId, { type: 'u64' }),
      ],
    });
  }

  async verifyImpact(publicKey: string, projectId: number): Promise<{ hash: string }> {
    return stellar.buildAndSignTx({
      publicKey,
      contractId: this.contractId,
      method: 'verify_impact',
      args: [
        StellarSdk.nativeToScVal(publicKey, { type: 'address' }),
        StellarSdk.nativeToScVal(projectId, { type: 'u64' }),
      ],
    });
  }

  async certifyImpact(publicKey: string, projectId: number, passed: boolean): Promise<{ hash: string }> {
    return stellar.buildAndSignTx({
      publicKey,
      contractId: this.contractId,
      method: 'certify_impact',
      args: [
        StellarSdk.nativeToScVal(publicKey, { type: 'address' }),
        StellarSdk.nativeToScVal(projectId, { type: 'u64' }),
        StellarSdk.nativeToScVal(passed, { type: 'bool' }),
      ],
    });
  }

  async refundProject(publicKey: string, projectId: number): Promise<{ hash: string }> {
    return stellar.buildAndSignTx({
      publicKey,
      contractId: this.contractId,
      method: 'refund_project',
      args: [
        StellarSdk.nativeToScVal(publicKey, { type: 'address' }),
        StellarSdk.nativeToScVal(projectId, { type: 'u64' }),
      ],
    });
  }
}

export const projectClient = new ProjectContractClient();
