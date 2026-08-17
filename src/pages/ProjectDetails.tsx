

import { useEffect, useState, useCallback } from 'react';
import { useParams } from "react-router-dom";
import { useWallet } from '@/hooks/useWallet';
import { projectClient } from '@/lib/contracts/project-client';
import { escrowClient } from '@/lib/contracts/escrow-client';
import { useEscrow } from '@/hooks/useEscrow';
import { useContractEvents } from '@/hooks/useContractEvents';
import { PROJECT_CONTRACT_ID } from '@/lib/constants';
import { stellar } from '@/lib/stellar';
import { Badge } from '@/components/ui/Badge';
import { ProjectStatusTimeline } from '@/components/projects/ProjectStatusTimeline';
import { Link } from "react-router-dom";
import toast from 'react-hot-toast';
import type { Project } from '@/lib/types';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const { publicKey } = useWallet();
  const { refetch: refetchEscrow } = useEscrow(projectId, publicKey || undefined);
  const { events, loading: eventsLoading } = useContractEvents(PROJECT_CONTRACT_ID);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    if (!publicKey || !projectId) return;
    try {
      setLoading(true);
      const data = await projectClient.getProject(projectId, publicKey);
      setProject(data);
    } catch {
      toast.error('Failed to load project details.');
    } finally {
      setLoading(false);
    }
  }, [projectId, publicKey]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleAction = async (action: () => Promise<{ hash: string }>, successMsg: string) => {
    try {
      setActionLoading(true);
      setTxHash(null);
      const res = await action();
      setTxHash(res.hash);
      toast.success(successMsg);
      await loadProject();
      await refetchEscrow();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center animate-pulse-soft">
        <span className="animate-spin h-8 w-8 rounded-full border-2 border-brand border-t-transparent inline-block mb-4" />
        <p className="text-ink-muted font-mono text-2xs uppercase tracking-widest">Loading project metadata...</p>
      </div>
    );
  }

  const isSponsor = publicKey && publicKey.toUpperCase() === project.sponsor.toUpperCase();
  // const isDeveloper = publicKey && publicKey.toUpperCase() === project.developer.toUpperCase();
  const isAuditor = publicKey && publicKey.toUpperCase() === project.auditor.toUpperCase();
  const isCertifier = publicKey && publicKey.toUpperCase() === project.certifier.toUpperCase();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-8 animate-fade-in">
      {/* Header & Top Navigation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-ink-faint mb-2 font-mono text-2xs uppercase tracking-wider">
            <Link to="/dashboard" className="hover:text-ink transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-ink">Project Details</span>
          </div>
          <h1 className="text-3xl font-bold text-ink font-display tracking-tight sm:text-4xl">Project #{project.id}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <Badge status={project.status} />
            <span className="text-[10px] font-mono text-ink-faint uppercase tracking-wider">Proposed at block ledger {project.createdAt}</span>
          </div>
        </div>

        {/* Action Buttons based on roles */}
        <div className="flex flex-wrap gap-3">
          {project.status === 'created' && isSponsor && (
            <button
              onClick={() =>
                handleAction(
                  () => escrowClient.deposit(publicKey, project.id, project.amount),
                  'Escrow successfully funded!'
                )
              }
              disabled={actionLoading}
              className="btn-primary h-11 px-5"
            >
              <span className="material-symbols-outlined text-[18px]">payments</span>
              FUND ESCROW ({Number(project.amount).toFixed(2)} XLM)
            </button>
          )}

          {project.status === 'funded' && isAuditor && (
            <button
              onClick={() =>
                handleAction(
                  () => projectClient.submitAudit(publicKey, project.id),
                  'Environmental audit submitted!'
                )
              }
              disabled={actionLoading}
              className="btn-primary h-11 px-5"
            >
              <span className="material-symbols-outlined text-[18px]">assignment</span>
              SUBMIT ENVIRONMENTAL AUDIT
            </button>
          )}

          {project.status === 'audit_submitted' && isAuditor && (
            <button
              onClick={() =>
                handleAction(
                  () => projectClient.verifyImpact(publicKey, project.id),
                  'Environmental impact verified!'
                )
              }
              disabled={actionLoading}
              className="btn-primary h-11 px-5"
            >
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
              VERIFY IMPACT
            </button>
          )}

          {project.status === 'impact_verified' && isCertifier && (
            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleAction(
                    () => projectClient.certifyImpact(publicKey, project.id, true),
                    'Impact certified! Escrow released.'
                  )
                }
                disabled={actionLoading}
                className="btn-primary h-11 px-5"
              >
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                CERTIFY IMPACT
              </button>
              <button
                onClick={() =>
                  handleAction(
                    () => projectClient.certifyImpact(publicKey, project.id, false),
                    'Impact certification rejected.'
                  )
                }
                disabled={actionLoading}
                className="flex items-center gap-2 h-11 px-5 bg-short/12 border border-short/25 text-short font-mono text-2xs tracking-widest uppercase hover:border-short/45 hover:bg-short/18 transition-all active:scale-[0.98] rounded-md font-semibold"
              >
                <span className="material-symbols-outlined text-[18px] font-bold">close</span>
                REJECT IMPACT
              </button>
            </div>
          )}

          {project.status === 'rejected' && isSponsor && (
            <button
              onClick={() =>
                handleAction(
                  () => projectClient.refundProject(publicKey, project.id),
                  'Funds successfully refunded!'
                )
              }
              className="flex items-center gap-2 h-11 px-5 bg-short/12 border border-short/25 text-short font-mono text-2xs tracking-widest uppercase hover:border-short/45 hover:bg-short/18 transition-all active:scale-[0.98] rounded-md font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">undo</span>
              REQUEST ESCROW REFUND
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Spec Grid & Details */}
        <div className="lg:col-span-8 space-y-8">
          <div className="border border-hairline bg-surface p-6 rounded-xl relative overflow-hidden">
            {/* Helix corner accent lines */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-brand/30"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-brand/30"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-brand/30"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-brand/30"></div>

            <h3 className="text-2xs font-bold uppercase tracking-widest text-ink-faint font-mono mb-6">Project Specification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-2xs font-bold text-ink-faint font-mono uppercase tracking-widest">Project ID</span>
                <div className="text-sm font-semibold text-ink font-mono uppercase tracking-wide">
                  KS-PROJECT-{project.id}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-2xs font-bold text-ink-faint font-mono uppercase tracking-widest">Escrow Value</span>
                <div className="text-sm font-semibold text-ink font-mono tnum">
                  {Number(project.amount).toFixed(2)} <span className="text-2xs text-ink-muted font-normal">XLM</span>
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="text-2xs font-bold text-ink-faint font-mono uppercase tracking-widest">Sponsor</span>
                <div className="text-xs font-mono bg-canvas/40 p-2.5 rounded-md border border-hairline text-ink-muted truncate">
                  {project.sponsor}
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="text-2xs font-bold text-ink-faint font-mono uppercase tracking-widest">Developer</span>
                <div className="text-xs font-mono bg-canvas/40 p-2.5 rounded-md border border-hairline text-ink-muted truncate">
                  {project.developer}
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="text-2xs font-bold text-ink-faint font-mono uppercase tracking-widest">Environmental Auditor</span>
                <div className="text-xs font-mono bg-canvas/40 p-2.5 rounded-md border border-hairline text-ink-muted truncate">
                  {project.auditor}
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="text-2xs font-bold text-ink-faint font-mono uppercase tracking-widest">Carbon Standards Board</span>
                <div className="text-xs font-mono bg-canvas/40 p-2.5 rounded-md border border-hairline text-ink-muted truncate">
                  {project.certifier}
                </div>
              </div>
            </div>
          </div>

          {/* Environmental Telemetry Mockup */}
          <div className="border border-hairline bg-surface rounded-xl overflow-hidden h-64 relative">
            <div className="w-full h-full bg-cover bg-center opacity-30 filter grayscale"
                 style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')` }} />
            <div className="absolute inset-0 bg-brand/10 mix-blend-multiply pointer-events-none"></div>
            <div className="absolute top-4 left-4 bg-canvas/80 backdrop-blur-md text-ink px-4 py-2 rounded-md border border-hairline">
              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-faint">Ecological Zone</div>
              <div className="text-xs font-semibold font-mono uppercase tracking-wider mt-0.5">Amazon Reforestation Sector 4</div>
            </div>
            <div className="absolute bottom-4 right-4 bg-elevated/40 backdrop-blur-md text-ink px-4 py-2 rounded-md border border-hairline flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-long animate-pulse"></span>
              IoT Carbon Sensors Active
            </div>
          </div>

          {/* Action confirmation link */}
          {txHash && (
            <div className="bg-long/10 p-4 rounded-xl border border-long/20 flex justify-between items-center text-xs animate-slide-up">
              <span className="text-long/80 font-mono tracking-wider uppercase text-2xs">Transaction hash:</span>
              <a
                href={stellar.getExplorerLink(txHash, 'tx')}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-long hover:text-long/80 hover:underline flex items-center gap-1 font-bold tracking-wider uppercase"
              >
                {stellar.formatAddress(txHash, 6, 6)}
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </div>
          )}
        </div>

        {/* Right Column: Timeline, Ledger Event Logs & Document Verifications */}
        <div className="lg:col-span-4 space-y-8">
          {/* Project Lifecycle Timeline */}
          <ProjectStatusTimeline status={project.status} />

          {/* On-Chain Event Ledger */}
          <div className="border border-hairline bg-surface text-ink p-6 rounded-xl flex flex-col h-[400px] relative overflow-hidden">
            {/* Helix corner accents */}
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-brand/30"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-brand/30"></div>

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xs font-mono uppercase tracking-widest font-bold text-ink-faint">On-Chain Event Ledger</h3>
              <span className="material-symbols-outlined text-ink-faint">security</span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
              {eventsLoading ? (
                <div className="space-y-3">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-14 animate-pulse-soft bg-canvas/30 border border-hairline rounded-md" />
                  ))}
                </div>
              ) : events.length === 0 ? (
                <p className="text-2xs font-mono uppercase tracking-wider text-ink-faint italic">No events captured yet.</p>
              ) : (
                events.map((evt) => (
                  <div key={evt.id} className="group border-l border-hairline pl-4 py-1 hover:border-ink transition-colors">
                    <div className="flex justify-between items-start mb-1 text-2xs font-mono uppercase tracking-wider">
                      <span className="font-bold text-ink">{evt.topic.join(' / ')}</span>
                      <span className="text-ink-faint">L{evt.ledger}</span>
                    </div>
                    <p className="text-[10px] font-mono text-ink-muted line-clamp-2">
                      Value:{' '}
                      {JSON.stringify(evt.value, (_, v) =>
                        typeof v === 'bigint' ? v.toString() : v
                      )}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-mono text-[9px] text-ink-faint tracking-wider">{stellar.formatAddress(evt.txHash, 6, 6)}</span>
                      <a
                        href={stellar.getExplorerLink(evt.txHash, 'tx')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink-faint hover:text-ink hover:underline text-[9px] tracking-wider font-mono uppercase flex items-center gap-0.5 font-semibold"
                      >
                        VIEW <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Verification documents mockup */}
          <div className="border border-hairline bg-surface p-6 rounded-xl relative">
            <h4 className="text-2xs font-bold font-mono uppercase tracking-widest text-ink-faint mb-4">Verification Files</h4>
            <ul className="space-y-3 font-mono">
              <li className="flex items-center justify-between p-2.5 hover:bg-elevated/40 rounded-md transition-all group cursor-pointer border border-hairline bg-canvas/30">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-ink-faint text-lg">description</span>
                  <span className="text-2xs tracking-wider font-semibold text-ink uppercase">IMPACT_REPORT.PDF</span>
                </div>
                <span className="material-symbols-outlined text-ink-faint group-hover:text-ink transition-colors text-sm">download</span>
              </li>
              <li className="flex items-center justify-between p-2.5 hover:bg-elevated/40 rounded-md transition-all group cursor-pointer border border-hairline bg-canvas/30">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-ink-faint text-lg">verified</span>
                  <span className="text-2xs tracking-wider font-semibold text-ink uppercase">VERIFICATION_CERT.SIG</span>
                </div>
                <span className="material-symbols-outlined text-ink-faint group-hover:text-ink transition-colors text-sm">download</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
