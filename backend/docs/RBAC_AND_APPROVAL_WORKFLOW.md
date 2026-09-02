# RBAC & Leave Approval Workflow

## Role Mapping

| System Role        | Database Role | Description                    |
|--------------------|---------------|--------------------------------|
| Super Admin        | ADMIN         | Full system access             |
| HR Head            | HEAD_HR       | All HR operations, final approvals |
| Reporting Manager  | MANAGER       | Team leave approval            |
| Employee           | EMPLOYEE      | Apply leave, view own data     |

## Leave Approval Workflow

**Both approvals are compulsory.** Leave must be approved first by the Reporting Person, then by Head HR.

```
Employee applies leave
        ↓
Status: Pending_Manager
        ↓
1) Reporting Person (Manager) approves → Status: Pending_HR → Notify Head HR
   Reporting Person rejects → Status: Rejected → Notify Employee
        ↓
2) Head HR approves → Status: Approved → Notify Employee
   Head HR rejects  → Status: Rejected → Notify Employee
```

## API Endpoints

### Leave

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /api/leaves?scope=my\|pendingApproval\|team\|all | All | Get leaves by scope |
| GET | /api/leaves/:id | Owner/Manager/HR | Get leave by ID |
| POST | /api/leaves | Employee | Apply for leave |
| PATCH | /api/leaves/:id/approve-manager | Reporting Manager | Manager approve |
| PATCH | /api/leaves/:id/reject-manager | Reporting Manager | Manager reject |
| PATCH | /api/leaves/:id/approve-hr | HR Head/Admin | Final approve |
| PATCH | /api/leaves/:id/reject-hr | HR Head/Admin | Final reject |
| PATCH | /api/leaves/:id/approve | Manager/HR | Legacy (auto-routes) |
| PATCH | /api/leaves/:id/reject | Manager/HR | Legacy (auto-routes) |
| PATCH | /api/leaves/:id/cancel | Owner | Cancel pending leave |

### Approvals (HR Head only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/approvals?type=leave\|attendance\|salary | Get pending approvals |

## Database Migration

Run migration to add RBAC and leave workflow:

```bash
cd backend
npx sequelize-cli db:migrate
```

## Notifications (Socket.IO)

- `leave_applied` → Reporting Manager
- `leave_pending_hr` → HR Head (when manager approves)
- `leave_rejected` → Employee (manager or HR rejects)
- `leave_approved` → Employee (HR final approval)

## Middleware

- `requireRole(...roles)` - Check user role
- `requirePermission(permission)` - Check permission from config/rbac.js
- `requireSuperAdmin` - ADMIN only
- `requireHRHeadOrAbove` - ADMIN, HEAD_HR, HR
- `requireManagerOrAbove` - Manager and above
