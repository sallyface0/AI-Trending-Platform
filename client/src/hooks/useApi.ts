import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ProjectsResponse, StatsResponse, StatusResponse,
  TimeRange, SortOption,
  SkillsResponse, SkillStatsResponse, SkillSortOption,
  AITool,
} from '../types';

const API_BASE = '/api';

// ====== Projects ======
async function fetchProjects(
  range: TimeRange,
  sort: SortOption,
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<ProjectsResponse> {
  const params = new URLSearchParams({
    range,
    sort,
    page: String(page),
    limit: String(limit),
  });
  if (search) params.set('search', search);

  const res = await fetch(`${API_BASE}/projects?${params}`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

async function fetchStats(): Promise<StatsResponse> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

async function fetchProjectDetail(owner: string, repo: string) {
  const res = await fetch(`${API_BASE}/projects/detail/${owner}/${repo}`);
  if (!res.ok) throw new Error('Project not found');
  return res.json();
}

async function fetchReadme(owner: string, repo: string): Promise<string> {
  const res = await fetch(`${API_BASE}/projects/detail/${owner}/${repo}/readme`);
  if (!res.ok) return '';
  const data = await res.json();
  return data.content || '';
}

// ====== Skills ======
async function fetchSkills(
  tool: string = '',
  category: string = '',
  type: string = '',
  sort: SkillSortOption = 'popularity_desc',
  page: number = 1,
  search?: string,
  onlyNew: boolean = false,
): Promise<SkillsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: '20',
    sort,
  });
  if (tool) params.set('tool', tool);
  if (category) params.set('category', category);
  if (type) params.set('type', type);
  if (search) params.set('search', search);
  if (onlyNew) params.set('new', '1');

  const res = await fetch(`${API_BASE}/skills?${params}`);
  if (!res.ok) throw new Error('Failed to fetch skills');
  return res.json();
}

async function fetchSkillDetail(owner: string, repo: string) {
  const res = await fetch(`${API_BASE}/skills/detail/${owner}/${repo}`);
  if (!res.ok) throw new Error('Skill not found');
  return res.json();
}

async function fetchSkillStats(): Promise<SkillStatsResponse> {
  const res = await fetch(`${API_BASE}/skills/stats`);
  if (!res.ok) throw new Error('Failed to fetch skill stats');
  return res.json();
}

async function fetchTools(): Promise<AITool[]> {
  const res = await fetch(`${API_BASE}/tools`);
  if (!res.ok) throw new Error('Failed to fetch tools');
  return res.json();
}

async function fetchScraperStatus(): Promise<StatusResponse> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

// ====== Hooks ======
export function useProjects(
  range: TimeRange,
  sort: SortOption,
  page: number = 1,
  search?: string
) {
  return useQuery({
    queryKey: ['projects', range, sort, page, search],
    queryFn: () => fetchProjects(range, sort, page, 20, search),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useProjectDetail(owner: string, repo: string) {
  return useQuery({
    queryKey: ['project', owner, repo],
    queryFn: () => fetchProjectDetail(owner, repo),
    enabled: !!owner && !!repo,
  });
}

export function useReadme(owner: string, repo: string) {
  return useQuery({
    queryKey: ['readme', owner, repo],
    queryFn: () => fetchReadme(owner, repo),
    enabled: !!owner && !!repo,
  });
}

export function useSkills(
  tool: string = '',
  category: string = '',
  type: string = '',
  sort: SkillSortOption = 'popularity_desc',
  page: number = 1,
  search?: string,
  onlyNew: boolean = false,
) {
  return useQuery({
    queryKey: ['skills', tool, category, type, sort, page, search, onlyNew],
    queryFn: () => fetchSkills(tool, category, type, sort, page, search, onlyNew),
    refetchInterval: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSkillDetail(owner: string, repo: string) {
  return useQuery({
    queryKey: ['skill', owner, repo],
    queryFn: () => fetchSkillDetail(owner, repo),
    enabled: !!owner && !!repo,
  });
}

export function useSkillStats() {
  return useQuery({
    queryKey: ['skillStats'],
    queryFn: fetchSkillStats,
    refetchInterval: 10 * 60 * 1000,
  });
}

export function useTools() {
  return useQuery({
    queryKey: ['tools'],
    queryFn: fetchTools,
    staleTime: Infinity, // tools list rarely changes
  });
}

export function useScraperStatus(isFetching: boolean) {
  return useQuery({
    queryKey: ['scraperStatus'],
    queryFn: fetchScraperStatus,
    refetchInterval: isFetching ? 3000 : 30000,
  });
}

export function useRefreshAll() {
  const queryClient = useQueryClient();

  return async (target?: 'projects' | 'skills' | 'all') => {
    fetch(`${API_BASE}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: target || 'all' }),
    }).catch(() => {});
    await queryClient.invalidateQueries();
  };
}
