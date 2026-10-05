/**
 * Core Type Definitions for HRMS Application
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  HR = 'HR',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum LeaveType {
  CL = 'CL', // Casual Leave
  SL = 'SL', // Sick Leave
  PL = 'PL', // Privilege Leave
  LOP = 'LOP', // Loss of Pay
  ML = 'ML', // Maternity Leave
  EL = 'EL', // Earned Leave
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  LATE = 'LATE',
  ON_LEAVE = 'ON_LEAVE',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
  department?: string;
  designation?: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
  phoneNumber?: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  timezone: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Employee extends User {
  employeeId: string;
  dateOfJoining: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  documents?: Document[];
  salary?: {
    basic: number;
    hra: number;
    allowances: number;
    deductions: number;
    netSalary: number;
  };
}

export interface Document {
  id: string;
  type: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface OfficeLocation {
  id: string;
  companyId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  isActive: boolean;
}

export interface Attendance {
  id: string;
  userId: string;
  employeeId: string;
  employeeName: string;
  date: string;
  punchIn?: {
    time: string;
    latitude: number;
    longitude: number;
    location: string;
    /**
     * Optional pre-formatted time string from backend (already in local timezone, e.g. IST)
     * Used only for display to avoid double timezone conversions on mobile.
     */
    displayTime?: string;
  };
  punchOut?: {
    time: string;
    latitude: number;
    longitude: number;
    location: string;
    /**
     * Optional pre-formatted time string from backend (already in local timezone, e.g. IST)
     * Used only for display to avoid double timezone conversions on mobile.
     */
    displayTime?: string;
  };
  status: AttendanceStatus;
  /**
   * Total working time between punch in and punch out, in hours (decimal).
   * Used for aggregations and analytics.
   */
  workingHours?: number;
  /**
   * Total working time between punch in and punch out, in seconds.
   */
  workingSeconds?: number;
  /**
   * Human‑readable duration string including hours, minutes and seconds,
   * e.g. "1 hrs 5 min 30 sec".
   */
  workingDuration?: string;
  /**
   * True once the day is over and the worked time fell under the required
   * 9 hours. A flag only — `status` stays Present / Late.
   */
  shortHours?: boolean;
  /** Shortfall against the required hours, e.g. "1h 20m". Set with shortHours. */
  shortBy?: string;
  isLate: boolean;
  /** How late the first punch was past the shift's late cut-off, e.g. "12m". */
  lateBy?: string;
  /** Last punch before the shift end. A flag only, like shortHours. */
  earlyOut?: boolean;
  earlyBy?: string;
  /** The assigned shift the day is judged against (API default 10:00–19:00). */
  shiftName?: string;
  expectedCheckIn?: string;
  expectedCheckOut?: string;
  /** First punch after this time is a late mark (shift start + grace). */
  lateAfter?: string;
  /** The shift's length — the hours the day is expected to complete. */
  requiredHours?: number;
  isHalfDay: boolean;
  officeLocationId?: string;
  officeLocationName?: string;
}

export interface Leave {
  id: string;
  userId: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface LeaveBalance {
  userId: string;
  leaveType: LeaveType;
  total: number;
  used: number;
  pending: number;
  available: number;
}

/**
 * A payroll row as the API returns it (backend/models/Payroll.js). The salary
 * components come from the company CTC structure
 * (backend/utils/salaryStructure.js) prorated by attendance, so they match the
 * salary slip exactly.
 */
export interface Payroll {
  id: number;
  userId: number;
  user?: { id: number; name?: string; employeeCode?: string };
  payrollMonth: number;
  payrollYear: number;

  monthlySalary: number; // Monthly CTC
  totalWorkingDays: number;
  fullDays: number;
  halfDays: number;
  absentDays: number;
  payableDays: number;
  lopDays: number;
  perDaySalary: number;
  finalSalary: number;

  // Salary structure breakup for the period
  pfEnabled?: boolean;
  basic?: number;
  hra?: number;
  specialAllowance?: number;
  cca?: number;
  conveyance?: number;
  education?: number;
  bonus?: number;
  grossEarned?: number;
  employeePF?: number;
  employerPF?: number;
  professionalTax?: number;
  gratuity?: number;
  totalDeductions?: number;
  netPayable?: number;

  status: 'PENDING' | 'PROCESSED' | 'LOCKED' | 'PAID';
  processedAt?: string;
  paidDate?: string;
}

export interface Holiday {
  id: string;
  companyId: string;
  name: string;
  date: string;
  type: 'NATIONAL' | 'REGIONAL' | 'COMPANY';
  isActive: boolean;
}

export interface Shift {
  id: string;
  companyId: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration: number; // in minutes
  workingHours: number;
  isActive: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ATTENDANCE' | 'LEAVE' | 'PAYROLL' | 'GENERAL';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingLeaves: number;
  upcomingHolidays: number;
  monthlyAttendance: {
    present: number;
    absent: number;
    halfDay: number;
    onLeave: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

// ==================== DAR (Daily Activity Report) Types ====================

export enum DARStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum DARTaskCategory {
  EXECUTION = 'EXECUTION',
  PLANNING = 'PLANNING',
  MEETING = 'MEETING',
  INSPECTION = 'INSPECTION',
  DOCUMENTATION = 'DOCUMENTATION',
  OTHER = 'OTHER',
}

export interface DARAttachment {
  id: string;
  type: 'IMAGE' | 'PDF' | 'DOCUMENT';
  name: string;
  url: string;
  thumbnailUrl?: string;
  size?: number; // in bytes
  uploadedAt: string;
}

export interface DAR {
  id: string;
  userId: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  designation?: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
  date: string; // YYYY-MM-DD
  projectName?: string;
  workLocation?: string;
  workLocationLatitude?: number;
  workLocationLongitude?: number;
  activityDescription: string;
  taskCategory: DARTaskCategory;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  totalHours: number; // calculated from startTime and endTime
  remarks?: string;
  issuesFaced?: string;
  attachments: DARAttachment[];
  status: DARStatus;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  managerComments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DARCreateRequest {
  date: string;
  projectName?: string;
  workLocation?: string;
  workLocationLatitude?: number;
  workLocationLongitude?: number;
  activityDescription: string;
  taskCategory: DARTaskCategory;
  startTime: string;
  endTime: string;
  remarks?: string;
  issuesFaced?: string;
  attachments?: File[] | string[]; // File objects or URLs
}

export interface DARUpdateRequest extends Partial<DARCreateRequest> {
  id: string;
}

export interface DARApproveRequest {
  darId: string;
  comments?: string;
}

export interface DARRejectRequest {
  darId: string;
  reason: string;
  comments?: string;
}

export interface DARFilterParams {
  startDate?: string;
  endDate?: string;
  projectName?: string;
  status?: DARStatus;
  userId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DARStats {
  totalDARs: number;
  submittedToday: number;
  pendingApproval: number;
  approvedThisWeek: number;
  approvedThisMonth: number;
  rejectedThisWeek: number;
}
