import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ProtectedRoute } from '../utils/authGuard'
import { PermissionProtectedRoute } from '../utils/permissionGuard'
import { ROLES } from '../utils/constants'
import { PERMISSION_KEYS } from '../features/permissions/permissionService'

// Auth
const Login = lazy(() => import('../pages/auth/Login'))
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'))

// Dashboard
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'))
const Profile = lazy(() => import('../pages/profile/Profile'))
const MyProfile = lazy(() => import('../pages/profile/MyProfile'))

// Leaves
const ApplyLeave = lazy(() => import('../pages/leaves/ApplyLeave'))
const LeaveBalance = lazy(() => import('../pages/leaves/LeaveBalance'))
const LeaveHistory = lazy(() => import('../pages/leaves/LeaveHistory'))
const LeaveRules = lazy(() => import('../pages/leaves/LeaveRules'))
const LeaveBalanceLog = lazy(() => import('../pages/leaves/LeaveBalanceLog'))
const CompoffRequest = lazy(() => import('../pages/leaves/CompoffRequest'))
const PendingLeaveApproval = lazy(() => import('../pages/leaves/PendingLeaveApproval'))

// My Team (Manager only)
const MyTeam = lazy(() => import('../pages/my-team/MyTeam'))

// Attendance
const AttendancePage = lazy(() => import('../pages/attendance/AttendancePage'))

// Timesheet
const Client = lazy(() => import('../pages/timesheet/Client'))
const Project = lazy(() => import('../pages/timesheet/Project'))
const Timesheet = lazy(() => import('../pages/timesheet/Timesheet'))
const TeamTimesheet = lazy(() => import('../pages/timesheet/TeamTimesheet'))
const EditTimesheet = lazy(() => import('../pages/timesheet/EditTimesheet'))
const DayToDayTimesheet = lazy(() => import('../pages/timesheet/DayToDayTimesheet'))
const IncompleteTimesheet = lazy(() => import('../pages/timesheet/IncompleteTimesheet'))
const ImportTimesheet = lazy(() => import('../pages/timesheet/ImportTimesheet'))
const Utilization = lazy(() => import('../pages/timesheet/Utilization'))
const TeamUtilization = lazy(() => import('../pages/timesheet/TeamUtilization'))

// Salary
const MySalary = lazy(() => import('../pages/salary/MySalary'))
const Payslips = lazy(() => import('../pages/salary/Payslips'))

// Reimbursements
const NonCTCReimbursement = lazy(() => import('../pages/reimbursements/NonCTCReimbursement'))
const TravelReimbursement = lazy(() => import('../pages/reimbursements/TravelReimbursement'))
const MyReimbursementRequest = lazy(() => import('../pages/reimbursements/MyReimbursementRequest'))
const TeamReimbursementRequest = lazy(() => import('../pages/reimbursements/TeamReimbursementRequest'))

// Resignation
const MyResignation = lazy(() => import('../pages/resignation/MyResignation'))
const TeamResignations = lazy(() => import('../pages/resignation/TeamResignations'))
const ExitClearanceDept = lazy(() => import('../pages/resignation/ExitClearanceDept'))
const ExitClearanceRequest = lazy(() => import('../pages/resignation/ExitClearanceRequest'))

// HR Manager (HR only)
const Payroll = lazy(() => import('../pages/hr/Payroll'))
const GenerateLetters = lazy(() => import('../pages/hr/GenerateLetters'))
const LeaveBalanceAllUsers = lazy(() => import('../pages/hr/LeaveBalanceAllUsers'))
const ExtraEarnings = lazy(() => import('../pages/hr/ExtraEarnings'))
const InvoiceEmployees = lazy(() => import('../pages/hr/InvoiceEmployees'))
const ConfigureSalaryHeads = lazy(() => import('../pages/hr/ConfigureSalaryHeads'))
const SalaryStructures = lazy(() => import('../pages/hr/SalaryStructures'))
const HoldSalaries = lazy(() => import('../pages/hr/HoldSalaries'))
const SalaryReports = lazy(() => import('../pages/hr/SalaryReports'))
const DesignationMaster = lazy(() => import('../pages/hr/DesignationMaster'))
const EmployeeCodeSeries = lazy(() => import('../pages/hr/EmployeeCodeSeries'))
const PendingUserRequests = lazy(() => import('../pages/hr/PendingUserRequests'))

// Other
const InvestmentDeclarations = lazy(() => import('../pages/investment/InvestmentDeclarations'))
const Workflows = lazy(() => import('../pages/workflows/Workflows'))
const Reports = lazy(() => import('../pages/reports/Reports'))
const ListLateMark = lazy(() => import('../pages/team/ListLateMark'))
// import ShiftManager from '../pages/shift/ShiftManager'
// import OvertimeCalculator from '../pages/overtime/OvertimeCalculator'
const PugmarkManual = lazy(() => import('../pages/pugmark/PugmarkManual'))
const Helpdesk = lazy(() => import('../pages/helpdesk/Helpdesk'))
const TalkToHR = lazy(() => import('../pages/useful-links/TalkToHR'))
const TalkToAdmin = lazy(() => import('../pages/useful-links/TalkToAdmin'))
const TalkToMedical = lazy(() => import('../pages/useful-links/TalkToMedical'))
const Chat = lazy(() => import('../pages/chat/Chat'))
// DAR
const DarList = lazy(() => import('../pages/dar/DarList'))
const PendingDarApproval = lazy(() => import('../pages/dar/PendingDarApproval'))
const DarForm = lazy(() => import('../pages/dar/DarForm'))
const DarView = lazy(() => import('../pages/dar/DarView'))
const DarDashboard = lazy(() => import('../pages/dar/DarDashboard'))
const SingleUserDarDashboard = lazy(() => import('../pages/dar/SingleUserDarDashboard'))
const GanttChart = lazy(() => import('../pages/dar/GanttChart'))
const DarCalendar = lazy(() => import('../pages/dar/DarCalendar'))
const DarTimesheet = lazy(() => import('../pages/dar/DarTimesheet'))
const DarSubPage = lazy(() => import('../pages/dar/DarSubPage'))
const MyUtilization = lazy(() => import('../pages/dar/MyUtilization'))
const DarTeamUtilization = lazy(() => import('../pages/dar/TeamUtilization'))
const ClientManager = lazy(() => import('../pages/dar/ClientManager'))
const ProjectDarReport = lazy(() => import('../pages/dar/ProjectDarReport'))
// Project Management
const AdminDashboard = lazy(() => import('../pages/projectManagement/dashboards/AdminDashboard'))
const HeadHRDashboard = lazy(() => import('../pages/projectManagement/dashboards/HeadHRDashboard'))
const HRDashboard = lazy(() => import('../pages/projectManagement/dashboards/HRDashboard'))
const HODDashboard = lazy(() => import('../pages/projectManagement/dashboards/HODDashboard'))
const EmployeeDashboard = lazy(() => import('../pages/projectManagement/dashboards/EmployeeDashboard'))
const ProjectList = lazy(() => import('../pages/projectManagement/projects/ProjectList'))
const ProjectCreate = lazy(() => import('../pages/projectManagement/projects/ProjectCreate'))
const ProjectDetail = lazy(() => import('../pages/projectManagement/projects/ProjectDetail'))
const ApprovalInbox = lazy(() => import('../pages/projectManagement/ApprovalInbox'))
const TaskBoard = lazy(() => import('../pages/projectManagement/TaskBoard'))
const WorkflowDiagram = lazy(() => import('../pages/projectManagement/WorkflowDiagram'))
const AccessControlManager = lazy(() => import('../pages/projectManagement/admin/AccessControlManager'))
const OfficeManagement = lazy(() => import('../pages/admin/OfficeManagement'))
const UserManagement = lazy(() => import('../pages/admin/UserManagement'))
const CompanyManagement = lazy(() => import('../pages/admin/CompanyManagement'))
const Settings = lazy(() => import('../pages/settings/Settings'))
const SendNotice = lazy(() => import('../pages/notices/SendNotice'))
const MyNotices = lazy(() => import('../pages/notices/MyNotices'))
const MaintenanceTasks = lazy(() => import('../pages/maintenance/MaintenanceTasks'))
const BiometricAttendance = lazy(() => import('../pages/attendance/BiometricAttendance'))
import { PROJECT_ROLES } from '../utils/constants'

// Shown while a route's chunk is in flight. Deliberately hand-rolled rather
// than antd's <Spin>: this module is in the entry bundle's static graph, so
// importing an antd component here would drag antd's runtime into the very
// first download — the thing the user waits on before anything paints.
//
// The surface always paints the app background so the boot splash in
// index.html hands over without a white flash; only the spinner itself is
// held back 200ms, so a warm chunk swaps in silently instead of flickering.
const RouteFallback = () => {
  const [show, setShow] = React.useState(false)
  React.useEffect(() => {
    const t = setTimeout(() => setShow(true), 200)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="route-fallback">
      {show && <div className="route-fallback-ring" />}
    </div>
  )
}

// The shell every signed-in route renders inside, plus the landing page. Warmed
// during idle time so the first navigation after login is already in cache.
const prefetchShell = () => {
  import('../layouts/DashboardLayout')
  import('../pages/dashboard/Dashboard')
}

const AppRoutes = () => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth)

  React.useEffect(() => {
    // Idle callback so this never competes with rendering the current screen.
    const ric = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500))
    const cancel = window.cancelIdleCallback || clearTimeout
    const handle = ric(prefetchShell)
    return () => cancel(handle)
  }, [])

  // Show loading screen during initial authentication check
  if (loading) {
    return (
      <div className="route-fallback">
        <div className="route-fallback-ring" />
        <div className="route-fallback-text">Loading HRMS…</div>
      </div>
    )
  }

  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />
      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      {/* Redirect to role-specific dashboard */}
      <Route
        path="/dashboard/redirect"
        element={<Navigate to="/dashboard" replace />}
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MyProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pugmark-manual"
        element={
          <ProtectedRoute>
            <PugmarkManual />
          </ProtectedRoute>
        }
      />
      {/* Old uKnowva-branded path, kept so existing links/bookmarks still land. */}
      <Route path="/uknowva-manual" element={<Navigate to="/pugmark-manual" replace />} />
      {/* Leaves */}
      <Route
        path="/leaves/apply"
        element={
          <ProtectedRoute>
            <ApplyLeave />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaves/balance"
        element={
          <ProtectedRoute>
            <LeaveBalance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaves/history"
        element={
          <ProtectedRoute>
            <LeaveHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaves/pending-approval"
        element={
          <ProtectedRoute>
            <PendingLeaveApproval />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaves/rules"
        element={
          <ProtectedRoute>
            <LeaveRules />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaves/balance-log"
        element={
          <ProtectedRoute>
            <LeaveBalanceLog />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaves/compoff-request"
        element={
          <ProtectedRoute>
            <CompoffRequest />
          </ProtectedRoute>
        }
      />
      {/* My Team - Manager, HR, Head HR, Admin, plus anyone who has people
          reporting to them (their role is usually EMPLOYEE). */}
      <Route
        path="/my-team"
        element={
          <ProtectedRoute allowReportingPerson allowedRoles={[ROLES.MANAGER, ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HOD, PROJECT_ROLES.HEAD_HR]}>
            <MyTeam />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-team/*"
        element={
          <ProtectedRoute allowReportingPerson allowedRoles={[ROLES.MANAGER, ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HOD, PROJECT_ROLES.HEAD_HR]}>
            <MyTeam />
          </ProtectedRoute>
        }
      />
      {/* Attendance - tabbed page for all users (My Attendance, Punch, Request Regulation, Report Map) */}
      <Route
        path="/attendance/*"
        element={
          <ProtectedRoute>
            <AttendancePage />
          </ProtectedRoute>
        }
      />
      {/* Timesheet */}
      <Route
        path="/timesheet/client"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.TIMESHEET}>
            <Client />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/timesheet/project"
        element={
          <ProtectedRoute>
            <Project />
          </ProtectedRoute>
        }
      />
      <Route
        path="/timesheet/timesheet"
        element={
          <ProtectedRoute>
            <Timesheet />
          </ProtectedRoute>
        }
      />
      <Route
        path="/timesheet/team-timesheet"
        element={
          <ProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <TeamTimesheet />
          </ProtectedRoute>
        }
      />
      <Route
        path="/timesheet/edit"
        element={
          <ProtectedRoute>
            <EditTimesheet />
          </ProtectedRoute>
        }
      />
      <Route
        path="/timesheet/day-to-day"
        element={
          <ProtectedRoute>
            <DayToDayTimesheet />
          </ProtectedRoute>
        }
      />
      <Route
        path="/timesheet/incomplete"
        element={
          <ProtectedRoute>
            <IncompleteTimesheet />
          </ProtectedRoute>
        }
      />
      <Route
        path="/timesheet/import"
        element={
          <ProtectedRoute>
            <ImportTimesheet />
          </ProtectedRoute>
        }
      />
      <Route
        path="/timesheet/utilization"
        element={
          <ProtectedRoute>
            <Utilization />
          </ProtectedRoute>
        }
      />
      <Route
        path="/timesheet/team-utilization"
        element={
          <ProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <TeamUtilization />
          </ProtectedRoute>
        }
      />
      {/* Salary */}
      <Route
        path="/salary/my-salary"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.SALARY}>
            <MySalary />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/salary/payslips"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.SALARY}>
            <Payslips />
          </PermissionProtectedRoute>
        }
      />
      {/* Reimbursements */}
      <Route
        path="/reimbursements/non-ctc"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.REIMBURSEMENTS}>
            <NonCTCReimbursement />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/reimbursements/travel"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.REIMBURSEMENTS}>
            <TravelReimbursement />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/reimbursements/my-requests"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.REIMBURSEMENTS}>
            <MyReimbursementRequest />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/reimbursements/team-requests"
        element={
          <PermissionProtectedRoute 
            allowedRoles={[ROLES.MANAGER, ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}
            requiredPermission={PERMISSION_KEYS.REIMBURSEMENTS}
          >
            <TeamReimbursementRequest />
          </PermissionProtectedRoute>
        }
      />
      {/* Resignation */}
      <Route
        path="/resignation/my-resignation"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.RESIGNATION}>
            <MyResignation />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/resignation/team-resignations"
        element={
          <ProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <TeamResignations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resignation/exit-clearance-dept"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <ExitClearanceDept />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resignation/exit-clearance-request"
        element={
          <ProtectedRoute>
            <ExitClearanceRequest />
          </ProtectedRoute>
        }
      />
      {/* HR Manager (HR and Admin access) */}
      <Route
        path="/hr/payroll"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <Payroll />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/generate-letters"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <GenerateLetters />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/leave-balance-all"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <LeaveBalanceAllUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/extra-earnings"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <ExtraEarnings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/invoice-employees"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <InvoiceEmployees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/configure-salary-heads"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <ConfigureSalaryHeads />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/salary-structures"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <SalaryStructures />
          </ProtectedRoute>
        }
      />
      {/* The free-form salary structure builder is retired — the company runs a
          single CTC structure (backend/utils/salaryStructure.js). Any old link
          lands back on the read-only structure page. */}
      <Route
        path="/hr/salary-structures/edit/:id"
        element={<Navigate to="/hr/salary-structures" replace />}
      />
      <Route
        path="/hr/hold-salaries"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <HoldSalaries />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/salary-reports"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <SalaryReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/designation-master"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <DesignationMaster />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/employee-code-series"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <EmployeeCodeSeries />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/pending-requests"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <PendingUserRequests />
          </ProtectedRoute>
        }
      />
      {/* Other */}
      <Route
        path="/investment-declarations"
        element={
          <ProtectedRoute>
            <InvestmentDeclarations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workflows"
        element={
          <ProtectedRoute>
            <Workflows />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/late-mark"
        element={
          <ProtectedRoute>
            <ListLateMark />
          </ProtectedRoute>
        }
      />
      {/* <Route
        path="/shift-manager"
        element={
          <ProtectedRoute>
            <ShiftManager />
          </ProtectedRoute>
        }
      /> */}
      {/* <Route
        path="/overtime-calculator"
        element={
          <ProtectedRoute>
            <OvertimeCalculator />
          </ProtectedRoute>
        }
      /> */}
      <Route
        path="/helpdesk"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.HELPDESK}>
            <Helpdesk />
          </PermissionProtectedRoute>
        }
      />
      {/* DAR */}
      <Route
        path="/dar"
        element={<Navigate to="/dar/list" replace />}
      />
      <Route
        path="/dar/dashboard"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.DAR}>
            <DarDashboard />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/dar/user-dashboard"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.DAR}>
            <SingleUserDarDashboard />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/dar/list"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.DAR}>
            <DarList />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/dar/pending-approvals"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.DAR}>
            <PendingDarApproval />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/dar/create"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.DAR}>
            <DarForm />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/dar/edit/:id"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.DAR}>
            <DarForm />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/dar/view/:id"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.DAR}>
            <DarView />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/dar/gantt"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.GANTT_CALENDAR}>
            <GanttChart />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/dar/calendar"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.DAR}>
            <DarCalendar />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/dar/timesheet"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.DAR}>
            <DarTimesheet />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/dar/client"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.DAR}>
            <ClientManager />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/dar/project"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.DAR}>
            <ProjectDarReport />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/dar/team-timesheet"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.DAR}>
            <DarSubPage />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/dar/edit-timesheet"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.DAR}>
            <DarSubPage />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/dar/day-to-day"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.DAR}>
            <DarSubPage />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/dar/incomplete"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.DAR}>
            <DarSubPage />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/dar/import"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.DAR}>
            <DarSubPage />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/dar/my-utilization"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.DAR}>
            <MyUtilization />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/dar/team-utilization"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.DAR}>
            <DarTeamUtilization />
          </PermissionProtectedRoute>
        }
      />
      {/* Project Management - Role-based Dashboards */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={[PROJECT_ROLES.ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/head-hr/dashboard"
        element={
          <ProtectedRoute allowedRoles={[PROJECT_ROLES.HEAD_HR]}>
            <HeadHRDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/dashboard"
        element={
          <ProtectedRoute allowedRoles={[PROJECT_ROLES.HR, ROLES.HR]}>
            <HRDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hod/dashboard"
        element={
          <ProtectedRoute allowedRoles={[PROJECT_ROLES.HOD, ROLES.MANAGER]}>
            <HODDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute allowedRoles={[PROJECT_ROLES.EMPLOYEE, ROLES.EMPLOYEE]}>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
      {/* Project Management - Projects */}
      <Route
        path="/project/list"
        element={
          <ProtectedRoute>
            <ProjectList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/create"
        element={
          <ProtectedRoute>
            <ProjectCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:id"
        element={
          <ProtectedRoute>
            <ProjectDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:id/edit"
        element={
          <ProtectedRoute>
            <ProjectCreate />
          </ProtectedRoute>
        }
      />
      {/* Project Management - Approval & Tasks */}
      <Route
        path="/approval/inbox"
        element={
          <ProtectedRoute>
            <ApprovalInbox />
          </ProtectedRoute>
        }
      />
      <Route
        path="/task/board"
        element={
          <ProtectedRoute>
            <TaskBoard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workflow"
        element={
          <PermissionProtectedRoute requiredPermission={PERMISSION_KEYS.WORKFLOW_DIAGRAM}>
            <WorkflowDiagram />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/admin/access-control"
        element={
          <PermissionProtectedRoute 
            allowedRoles={[PROJECT_ROLES.ADMIN]}
            requiredPermission={PERMISSION_KEYS.ADMIN_SETTINGS}
          >
            <AccessControlManager />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/admin/offices"
        element={
          <PermissionProtectedRoute 
            allowedRoles={[PROJECT_ROLES.ADMIN]}
            requiredPermission={PERMISSION_KEYS.ADMIN_SETTINGS}
          >
            <OfficeManagement />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={[PROJECT_ROLES.ADMIN]}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/companies"
        element={
          <ProtectedRoute allowedRoles={[PROJECT_ROLES.ADMIN]}>
            <CompanyManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={[PROJECT_ROLES.ADMIN, ROLES.HR, PROJECT_ROLES.HEAD_HR]}>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/roles"
        element={
          <ProtectedRoute allowedRoles={[PROJECT_ROLES.ADMIN, ROLES.HR, PROJECT_ROLES.HEAD_HR]}>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/departments"
        element={
          <ProtectedRoute allowedRoles={[PROJECT_ROLES.ADMIN, ROLES.HR, PROJECT_ROLES.HEAD_HR]}>
            <Settings />
          </ProtectedRoute>
        }
      />
      {/* Notices */}
      <Route
        path="/notices/my"
        element={
          <ProtectedRoute>
            <MyNotices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notices/send"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HR, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <SendNotice />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance/tasks"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HR, ROLES.MANAGER, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <MaintenanceTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance/tasks"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HR, ROLES.MANAGER, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <MaintenanceTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/biometric"
        element={
          <ProtectedRoute allowedRoles={[ROLES.HR, ROLES.MANAGER, PROJECT_ROLES.ADMIN, PROJECT_ROLES.HEAD_HR]}>
            <BiometricAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/useful-links/talk-to-hr"
        element={
          <ProtectedRoute>
            <TalkToHR />
          </ProtectedRoute>
        }
      />
      <Route
        path="/useful-links/talk-to-admin"
        element={
          <ProtectedRoute>
            <TalkToAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/useful-links/talk-to-medical"
        element={
          <ProtectedRoute>
            <TalkToMedical />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route 
        path="*" 
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
    </Routes>
    </Suspense>
  )
}

export default AppRoutes
