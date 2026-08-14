import type { ProjectStatus } from '@/lib/types';

interface Step {
  key: ProjectStatus;
  label: string;
  icon: string;
}

const STEPS: Step[] = [
  { key: 'created',        label: 'Proposed',       icon: 'pending' },
  { key: 'funded',         label: 'Funded',          icon: 'payments' },
  { key: 'audit_submitted', label: 'Audit Submitted', icon: 'assignment' },
  { key: 'impact_verified', label: 'Impact Verified', icon: 'task_alt' },
  { key: 'certified',      label: 'Certified',       icon: 'verified_user' },
];

// For rejected/refunded we still want to show progress up to verification
const STATUS_INDEX: Partial<Record<ProjectStatus, number>> = {
  created: 0,
  funded: 1,
  audit_submitted: 2,
  impact_verified: 3,
  certified: 4,
  rejected: 3,   // failed after verification step
  refunded: 4,   // refunded at the end
};

interface Props {
  status: ProjectStatus;
}

export function ProjectStatusTimeline({ status }: Props) {
  const currentIndex = STATUS_INDEX[status] ?? 0;
  const isFailed = status === 'rejected' || status === 'refunded';

  return (
    <div className="border border-hairline bg-surface p-6 rounded-xl relative overflow-hidden">
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-brand/30" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-brand/30" />

      <h3 className="text-2xs font-bold uppercase tracking-widest text-ink-faint font-mono mb-6">
        Project Lifecycle
      </h3>

      <div className="relative">
        {/* Connector line */}
        <div className="absolute left-4 top-4 bottom-4 w-px bg-hairline" />

        <ol className="space-y-5">
          {STEPS.map((step, idx) => {
            const isDone    = idx < currentIndex;
            const isActive  = idx === currentIndex;
            const isFuture  = idx > currentIndex;
            const isFailedStep = isFailed && idx === currentIndex;

            let dotClass = 'bg-elevated border-hairline text-ink-faint';
            if (isDone)        dotClass = 'bg-brand/20 border-brand/50 text-brand';
            if (isActive && !isFailed) dotClass = 'bg-brand border-brand text-canvas';
            if (isFailedStep)  dotClass = 'bg-short/20 border-short/50 text-short';

            let labelClass = 'text-ink-faint';
            if (isDone)        labelClass = 'text-ink-muted';
            if (isActive && !isFailed) labelClass = 'text-ink font-semibold';
            if (isFailedStep)  labelClass = 'text-short font-semibold';

            return (
              <li key={step.key} className="flex items-center gap-4 pl-0">
                {/* Step dot */}
                <div
                  className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-sm transition-all ${dotClass}`}
                >
                  {isDone ? (
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  ) : isFailedStep ? (
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  ) : (
                    <span className="material-symbols-outlined text-[14px]">{step.icon}</span>
                  )}
                </div>

                {/* Step label */}
                <div className={`text-xs font-mono uppercase tracking-wider transition-all ${labelClass} ${isFuture ? 'opacity-40' : ''}`}>
                  {step.label}
                  {isActive && !isFailed && (
                    <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-brand animate-pulse align-middle" />
                  )}
                  {isFailedStep && (
                    <span className="ml-2 text-[10px] text-short/70 normal-case font-normal">
                      {status === 'rejected' ? '— Certification Failed' : '— Refunded'}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
