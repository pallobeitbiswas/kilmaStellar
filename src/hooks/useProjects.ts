

import { useCallback, useEffect, useState } from 'react';
import { projectClient } from '@/lib/contracts/project-client';
import type { Project } from '@/lib/types';

export function useProjects(publicKey?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!publicKey) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const count = await projectClient.getProjectCount(publicKey);
      const fetched: Project[] = [];

      for (let i = 1; i <= count; i++) {
        try {
          const project = await projectClient.getProject(i, publicKey);
          fetched.push(project);
        } catch {
          // skip projects that fail to load
        }
      }

      setProjects(fetched.reverse());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, error, refetch: fetchProjects };
}
