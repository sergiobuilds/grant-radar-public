export type GrantSource = "kstartup" | "bizinfo" | "msit" | "mss";

export interface Attachment {
  name: string;
  url: string;
}

export interface Grant {
  id: string;
  source: GrantSource;
  sourceId: string;
  title: string;
  agency: string;
  category: string;
  applicantTypes: string[];
  businessAge: string[];
  region: string;
  applyStart: string;
  applyEnd: string;
  summary: string;
  detailUrl: string;
  attachments: Attachment[];
  raw: Record<string, unknown>;
}

export interface CachedGrant extends Grant {
  isExpired: boolean;
  cachedAt: string;
}

export interface FetchAdapter {
  source: GrantSource;
  fetchGrants(): Promise<Grant[]>;
}

export interface UpsertStats {
  inserted: number;
  updated: number;
  total: number;
}

export interface FieldCoverage {
  filled: number;
  total: number;
  rate: number;
}

export interface RefreshResult {
  bySource: Record<string, { fetched: number; stored: number; active: number }>;
  totalFetched: number;
  cache: UpsertStats;
  activeCount: number;
  expiredExcludedCount: number;
  quality: {
    applicantTypes: FieldCoverage;
    businessAge: FieldCoverage;
    region: FieldCoverage;
  };
  attachments: {
    withAttachments: number;
    totalAttachments: number;
  };
}
