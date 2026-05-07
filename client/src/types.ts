// ====== Projects ======
export interface Project {
  id: number;
  repo_full_name: string;
  name: string;
  owner: string;
  description_en: string;
  description_cn: string;
  star_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string;
  topics: string[];
  url: string;
  avatar_url: string;
  homepage: string;
  created_at: string;
  updated_at: string;
  fetched_at: string;
  star_delta: number;
  trending_stars: number;
}

export interface ProjectsResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Project[];
}

export interface StatsResponse {
  totalProjects: number;
  totalStars: number;
  todayNew: number;
  totalSkills: number;
  newSkills: number;
  languages: { name: string; count: number }[];
}

export type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all';
export type SortOption = 'stars_desc' | 'stars_asc' | 'updated_desc' | 'forks_desc' | 'trending_desc';
export type ViewMode = 'grid' | 'list';

// ====== Skills & MCP ======
export interface Skill {
  id: number;
  repo_full_name: string;
  name: string;
  owner: string;
  description_en: string;
  description_cn: string;
  star_count: number;
  forks_count: number;
  language: string;
  skill_type: 'skill' | 'mcp' | 'extension' | 'awesome-list';
  compatible_tools: string[];
  category: string;
  tags: string[];
  install_command: string;
  is_new: number;
  popularity_score: number;
  url: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
  fetched_at: string;
}

export interface SkillsResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Skill[];
}

export type SkillSortOption = 'popularity_desc' | 'stars_desc' | 'stars_asc' | 'newest' | 'recently_updated';

export interface SkillStatsResponse {
  totalSkills: number;
  totalStars: number;
  newSkills: number;
  byType: { skill_type: string; count: number }[];
  byCategory: { category: string; count: number }[];
  byTool: Record<string, number>;
}

// ====== AI Tools ======
export interface AITool {
  id: string;
  name: string;
  icon: string;
  description: string;
  skillsSource: string;
}

// ====== Status ======
export interface ScraperStatus {
  state: 'idle' | 'fetching' | 'done' | 'error';
  lastFetchTime: string | null;
  currentTask: string;
  progress: string;
  errorMessage: string;
  totalProjects: number;
}

export interface SkillScraperStatus {
  state: 'idle' | 'fetching' | 'done' | 'error';
  lastFetchTime: string | null;
  currentTask: string;
  progress: string;
  errorMessage: string;
  totalSkills: number;
}

export interface StatusResponse {
  status: string;
  timestamp: string;
  scraper: ScraperStatus;
  skillScraper: SkillScraperStatus;
}
