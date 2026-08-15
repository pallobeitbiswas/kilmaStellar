import { useWallet } from '@/hooks/useWallet';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useFinanceStats } from '@/hooks/useFinanceStats';
import { telemetry, type TelemetryEvent } from '@/lib/telemetry';
import { formatDistanceToNow } from 'date-fns';

const TYPE_META: Record<
  TelemetryEvent['type'],
  { label: string; dot: string; bg: string; text: string }
> = {
  wallet_connect:    { label: 'Wallet Connect',    dot: 'bg-brand',        bg: 'bg-brand/10',    text: 'text-brand' },
  wallet_disconnect: { label: 'Wallet Disconnect',  dot: 'bg-ink-faint',   bg: 'bg-elevated/40', text: 'text-ink-muted' },
  transaction:       { label: 'Transaction',        dot: 'bg-long animate-pulse', bg: 'bg-long/10', text: 'text-long' },
  error:             { label: 'Error',              dot: 'bg-short',        bg: 'bg-short/10',    text: 'text-short' },
  page_view:         { label: 'Page View',          dot: 'bg-ink-muted',   bg: 'bg-elevated/30', text: 'text-ink-muted' },
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border border-hairline bg-surface p-6 rounded-xl">
      <p className="eyebrow mb-2">{label}</p>
      <p className="font-display text-3xl text-ink tnum">{value}</p>
      {sub && <p className="text-2xs text-ink-faint font-mono mt-1">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { publicKey, isConnected, connect } = useWallet();
  const { summary, refresh } = useAnalytics();
  const financeStats = useFinanceStats(publicKey || undefined);

  const handleClear = () => {
    telemetry.clear();
    refresh();
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-2">
          <p className="eyebrow">CONSOLE // ANALYTICS</p>
          <h1 className="text-3xl font-bold text-ink font-display tracking-tight sm:text-4xl">
            Protocol Analytics
          </h1>
          <p className="text-sm text-ink-muted">
            On-device telemetry and live protocol finance stats.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={refresh} className="btn-secondary h-10 px-4 text-xs">
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refresh
          </button>
          <button
            onClick={handleClear}
            className="h-10 px-4 text-xs border border-hairline rounded-md font-mono uppercase tracking-widest text-short hover:bg-short/10 transition-all"
          >
            Clear Log
          </button>
        </div>
      </div>

      {/* Protocol Finance Stats */}
      <section className="mb-10">
        <p className="text-2xs font-bold font-mono uppercase tracking-widest text-ink-faint mb-4">
          Finance Pool · Live
        </p>
        {!isConnected ? (
          <div className="border border-hairline bg-surface/50 rounded-xl p-8 text-center space-y-3">
            <p className="text-xs text-ink-muted font-mono">Connect wallet to view live finance stats</p>
            <button onClick={() => connect('freighter')} className="btn-primary">
              CONNECT WALLET
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard
              label="Loan Count"
              value={financeStats.loading ? '—' : financeStats.loanCount}
              sub="total loans issued"
            />
            <StatCard
              label="Pool Balance"
              value={financeStats.loading ? '—' : `${Number(financeStats.poolBalance).toFixed(2)} XLM`}
              sub="available liquidity"
            />
            <StatCard
              label="Active Principal"
              value={financeStats.loading ? '—' : `${Number(financeStats.activePrincipal).toFixed(2)} XLM`}
              sub="outstanding loan capital"
            />
          </div>
        )}
      </section>

      {/* Event Type Breakdown */}
      <section className="mb-10">
        <p className="text-2xs font-bold font-mono uppercase tracking-widest text-ink-faint mb-4">
          Event Breakdown · Session
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(Object.keys(TYPE_META) as TelemetryEvent['type'][]).map((type) => {
            const meta = TYPE_META[type];
            const count = summary.byType[type];
            const pct = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
            return (
              <div key={type} className={`border border-hairline rounded-xl p-5 ${meta.bg}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  <span className={`text-[10px] font-mono uppercase tracking-widest ${meta.text}`}>
                    {meta.label}
                  </span>
                </div>
                <p className={`font-display text-2xl ${meta.text}`}>{count}</p>
                <p className="text-[10px] font-mono text-ink-faint mt-1">{pct}% of total</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Telemetry Event Feed */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-2xs font-bold font-mono uppercase tracking-widest text-ink-faint">
            Event Feed · Last 20
          </p>
          <span className="text-2xs font-mono text-ink-faint">{summary.total} total events</span>
        </div>

        {summary.recentEvents.length === 0 ? (
          <div className="border border-hairline bg-surface/30 rounded-xl p-12 text-center">
            <span className="material-symbols-outlined text-3xl text-ink-faint mb-2">inbox</span>
            <p className="text-xs text-ink-muted font-mono">No telemetry events recorded yet.</p>
          </div>
        ) : (
          <div className="border border-hairline rounded-xl overflow-hidden bg-surface divide-y divide-hairline">
            {summary.recentEvents.map((evt) => {
              const meta = TYPE_META[evt.type];
              return (
                <div key={evt.id} className="flex items-start gap-4 px-5 py-4 hover:bg-elevated/20 transition-colors">
                  {/* Type indicator */}
                  <span className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${meta.dot}`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className={`text-[10px] font-mono uppercase tracking-widest ${meta.text}`}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] font-mono text-ink-faint">
                        {formatDistanceToNow(new Date(evt.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-ink mt-0.5 truncate">{evt.message}</p>
                    {evt.metadata && (
                      <p className="text-[10px] font-mono text-ink-faint mt-0.5 truncate">
                        {JSON.stringify(evt.metadata)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
