import { Link } from "react-router-dom";
import { Badge } from '../ui/Badge';
import { stellar } from '@/lib/stellar';
import { FiUser, FiClipboard, FiSearch } from 'react-icons/fi';
import type { Project } from '@/lib/types';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link to={`/projects/${project.id}`}>
      <div className="card-interactive hover-lift transition-all p-6 flex flex-col justify-between h-full" id={`project-card-${project.id}`}>
        <div>
          <div className="flex items-start justify-between gap-3 mb-4">
            <h3 className="font-display font-semibold text-ink tracking-tight text-lg">
              Project #{project.id}
            </h3>
            <Badge status={project.status} />
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-[10px] text-ink-muted font-mono">
              <span className="flex items-center gap-1.5 uppercase">
                <FiUser className="h-3.5 w-3.5 text-ink-faint" />
                Sponsor: {stellar.formatAddress(project.sponsor, 4, 4)}
              </span>
              <span className="flex items-center gap-1.5 uppercase">
                <FiUser className="h-3.5 w-3.5 text-ink-faint" />
                Developer: {stellar.formatAddress(project.developer, 4, 4)}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-ink-muted font-mono">
              <span className="flex items-center gap-1.5 uppercase">
                <FiClipboard className="h-3.5 w-3.5 text-ink-faint" />
                Auditor: {stellar.formatAddress(project.auditor, 4, 4)}
              </span>
              <span className="flex items-center gap-1.5 uppercase">
                <FiSearch className="h-3.5 w-3.5 text-ink-faint" />
                Certifier: {stellar.formatAddress(project.certifier, 4, 4)}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-hairline flex justify-between items-center">
          <p className="font-display text-xl font-bold text-ink tnum">
            {Number(project.amount).toFixed(2)}{' '}
            <span className="text-xs font-mono font-normal text-ink-muted">XLM</span>
          </p>
          <span className="material-symbols-outlined text-ink-faint group-hover:text-ink transition-colors">chevron_right</span>
        </div>
      </div>
    </Link>
  );
}
