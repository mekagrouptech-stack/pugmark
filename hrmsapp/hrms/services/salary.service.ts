/**
 * Salary Service
 *
 * IMPORTANT: Uses REAL backend APIs only. No mock data.
 *
 * Backend endpoints:
 * - GET /api/salary/me - Logged-in user's salary structure (salary slip)
 */

import { apiService } from './api';

export interface SalaryAmount {
  monthly: number;
  annual: number;
}

export interface SalaryEarningRow {
  key: string;
  label: string;
  percent: number;
  monthly: number;
  annual: number;
}

export interface MySalary {
  employee: {
    id: number | string;
    name: string | null;
    employeeCode: string | null;
    department: string | null;
    designation: string | null;
    dateOfJoining: string | null;
    location: string | null;
    pan: string | null;
  };
  hasStructure: boolean;
  pfEnabled: boolean;
  monthlyCTC: number;
  annualCTC: number;
  grossMonthly: number;
  earnings: SalaryEarningRow[];
  grossSalary: SalaryAmount;
  gratuity: SalaryAmount;
  employerPF: SalaryAmount;
  totalCTCRow: SalaryAmount;
  net: {
    grossSalary: SalaryAmount;
    employeePF: SalaryAmount;
    professionalTax: SalaryAmount;
    netSalary: SalaryAmount;
  };
  takeHomeMonthly: number;
  netSalary: number;
}

export const salaryService = {
  /**
   * Get logged-in user's salary
   * GET /api/salary/me
   */
  getMySalary: async (): Promise<MySalary | null> => {
    const response = await apiService.get<MySalary>('/salary/me');
    const data = (response as any)?.data ?? response;
    return data && Object.keys(data).length > 0 ? (data as MySalary) : null;
  },
};
