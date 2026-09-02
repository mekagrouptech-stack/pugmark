/**
 * RBAC Configuration
 * Role mapping: Super Admin=ADMIN, HR Head=HEAD_HR, Reporting Manager=MANAGER, Employee=EMPLOYEE
 */

module.exports = {
  ROLES: {
    SUPER_ADMIN: 'ADMIN',
    HR_HEAD: 'HEAD_HR',
    REPORTING_MANAGER: 'MANAGER',
    EMPLOYEE: 'EMPLOYEE',
    HR: 'HR',
    HOD: 'HOD',
  },

  PERMISSIONS: {
    // Leave
    LEAVE_APPLY: 'leave:apply',
    LEAVE_VIEW_OWN: 'leave:view_own',
    LEAVE_VIEW_TEAM: 'leave:view_team',
    LEAVE_VIEW_ALL: 'leave:view_all',
    LEAVE_APPROVE_MANAGER: 'leave:approve_manager',
    LEAVE_APPROVE_HR: 'leave:approve_hr',
    LEAVE_REJECT_MANAGER: 'leave:reject_manager',
    LEAVE_REJECT_HR: 'leave:reject_hr',

    // Attendance
    ATTENDANCE_VIEW_OWN: 'attendance:view_own',
    ATTENDANCE_VIEW_ALL: 'attendance:view_all',
    ATTENDANCE_APPROVE: 'attendance:approve',

    // Salary
    SALARY_VIEW_OWN: 'salary:view_own',
    SALARY_VIEW_ALL: 'salary:view_all',
    SALARY_APPROVE: 'salary:approve',

    // Payroll
    PAYROLL_PROCESS: 'payroll:process',
    PAYROLL_VIEW: 'payroll:view',

    // Employee
    EMPLOYEE_VIEW: 'employee:view',
    EMPLOYEE_MANAGE: 'employee:manage',
    EMPLOYEE_UPDATE_RECORDS: 'employee:update_records',

    // Full access
    FULL_ACCESS: '*',
  },

  ROLE_PERMISSIONS: {
    ADMIN: ['*'],
    HEAD_HR: [
      'leave:*', 'attendance:*', 'salary:*', 'payroll:*', 'employee:*',
      'leave:view_all', 'leave:approve_hr', 'leave:reject_hr',
      'attendance:view_all', 'attendance:approve',
      'salary:view_all', 'salary:approve',
      'payroll:process', 'payroll:view',
      'employee:view', 'employee:manage', 'employee:update_records',
    ],
    HR: [
      'leave:view_all', 'leave:approve_hr', 'leave:reject_hr',
      'attendance:view_all', 'attendance:approve',
      'salary:view_all', 'salary:approve',
      'payroll:process', 'payroll:view',
      'employee:view', 'employee:manage', 'employee:update_records',
    ],
    MANAGER: [
      'leave:view_own', 'leave:view_team', 'leave:approve_manager', 'leave:reject_manager',
      'attendance:view_own', 'attendance:view_all',
      'salary:view_own',
      'employee:view',
    ],
    HOD: [
      'leave:view_own', 'leave:view_team', 'leave:approve_manager', 'leave:reject_manager',
      'attendance:view_own', 'attendance:view_all',
      'salary:view_own',
      'employee:view',
    ],
    EMPLOYEE: [
      'leave:apply', 'leave:view_own',
      'attendance:view_own',
      'salary:view_own',
      'employee:view',
    ],
  },
}
