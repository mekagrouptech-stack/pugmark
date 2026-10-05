/**
 * Grievance Service
 *
 * Backend endpoints (/api/grievances):
 * - GET   /meta             categories, priorities, statuses, canManage
 * - GET   /mine             my grievances
 * - GET   /                 all grievances (HR: hr.grievances.manage)
 * - POST  /                 raise a grievance
 * - GET   /:id              one grievance with its conversation
 * - POST  /:id/replies      add a reply
 * - PATCH /:id/status       HR: change status (+ resolution note)
 * - PATCH /:id/withdraw     owner: withdraw (closes it)
 */

import { apiService } from './api';

export type GrievanceStatus = 'Open' | 'In Review' | 'Resolved' | 'Closed';
export type GrievancePriority = 'Low' | 'Medium' | 'High';

export interface GrievanceReply {
  id: number;
  message: string;
  fromHr: boolean;
  userName: string | null;
  isMine: boolean;
  createdAt: string;
}

export interface Grievance {
  id: number;
  ticketNo: string;
  category: string;
  subject: string;
  description: string;
  priority: GrievancePriority;
  isAnonymous: boolean;
  status: GrievanceStatus;
  resolution: string | null;
  handledByName: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isMine: boolean;
  replyCount?: number;
  employee: { id: number | null; name: string | null; employeeCode: string | null; department: string | null };
  replies?: GrievanceReply[];
  canManage?: boolean;
}

export interface GrievanceMeta {
  categories: string[];
  priorities: GrievancePriority[];
  statuses: GrievanceStatus[];
  canManage: boolean;
}

export interface CreateGrievancePayload {
  category: string;
  subject: string;
  description: string;
  priority: GrievancePriority;
}

export const GRIEVANCE_STATUS_COLORS: Record<GrievanceStatus, string> = {
  Open: '#F59E0B',
  'In Review': '#3B82F6',
  Resolved: '#10B981',
  Closed: '#6B7280',
};

export const GRIEVANCE_PRIORITY_COLORS: Record<GrievancePriority, string> = {
  Low: '#6B7280',
  Medium: '#F97316',
  High: '#EF4444',
};

export interface GrievanceStats {
  scope: 'mine' | 'all';
  total: number;
  byStatus: Record<GrievanceStatus, number>;
  pending: number;
  solved: number;
  withdrawn: number;
  solveRate: number;
  avgResolutionHours: number | null;
  medianResolutionHours: number | null;
  fastestResolutionHours: number | null;
  slowestResolutionHours: number | null;
  avgFirstResponseHours: number | null;
  awaitingFirstResponse: number;
  resolvedWithin: { '24h': number; '3d': number; '7d': number; over7d: number };
  oldestPendingDays: number | null;
  byCategory: { category: string; total: number; solved: number; pending: number; avgResolutionHours: number | null }[];
  monthly: { month: string; label: string; raised: number; solved: number }[];
  byHandler?: {
    id: number;
    name: string;
    solved: number;
    replies: number;
    avgResolutionHours: number | null;
    avgFirstResponseHours: number | null;
  }[];
}

/** Hours → "45m", "5h 20m", "2d 3h". */
export const formatHours = (h: number | null | undefined): string => {
  if (h === null || h === undefined) return '—';
  const mins = Math.round(h * 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${String(mins % 60).padStart(2, '0')}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
};

// The API wraps payloads as { success, data }.
const unwrap = <T>(response: any): T => (response?.data ?? response) as T;

export const grievanceService = {
  getMeta: async (): Promise<GrievanceMeta> => unwrap(await apiService.get<any>('/grievances/meta')),

  getMine: async (): Promise<Grievance[]> => {
    const data = unwrap<Grievance[]>(await apiService.get<any>('/grievances/mine'));
    return Array.isArray(data) ? data : [];
  },

  getAll: async (status?: GrievanceStatus): Promise<{ list: Grievance[]; counts: Record<string, number> }> => {
    const response: any = await apiService.get<any>('/grievances', { params: status ? { status } : undefined });
    return { list: Array.isArray(response?.data) ? response.data : [], counts: response?.counts || {} };
  },

  /** Dashboard figures: 'mine' = own grievances; 'all' = everyone (HR only). */
  getStats: async (scope: 'mine' | 'all'): Promise<GrievanceStats> =>
    unwrap(await apiService.get<any>('/grievances/stats', { params: { scope } })),

  getOne: async (id: number | string): Promise<Grievance> => unwrap(await apiService.get<any>(`/grievances/${id}`)),

  create: async (payload: CreateGrievancePayload): Promise<Grievance> =>
    unwrap(await apiService.post<any>('/grievances', payload)),

  reply: async (id: number | string, message: string): Promise<Grievance> =>
    unwrap(await apiService.post<any>(`/grievances/${id}/replies`, { message })),

  updateStatus: async (id: number | string, status: GrievanceStatus, resolution?: string): Promise<Grievance> =>
    unwrap(await apiService.patch<any>(`/grievances/${id}/status`, { status, resolution })),

  withdraw: async (id: number | string): Promise<Grievance> =>
    unwrap(await apiService.patch<any>(`/grievances/${id}/withdraw`)),
};
