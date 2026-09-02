# HRMS - Human Resource Management System

A fully functional, enterprise-grade HRMS web application built with React, Redux Toolkit, and Ant Design.

## Features

- **Authentication & Authorization**: Role-based access control (Employee, Manager, HR)
- **Leave Management**: Apply leaves, view balance, history, and rules
- **Attendance Tracking**: View attendance records and reports
- **Timesheet Management**: Track project hours and utilization
- **Salary Management**: View salary details and payslips
- **Reimbursement**: Submit and track reimbursement requests
- **Resignation Management**: Submit and manage resignation requests
- **HR Management**: Comprehensive HR tools for administrators
- **Helpdesk**: Create and manage support tickets
- **Team Management**: Manager tools for team oversight

## Tech Stack

- **React 18** (JavaScript only - no TypeScript)
- **Redux Toolkit** for state management
- **React Router v6** for routing
- **Ant Design** for UI components
- **Axios** for API calls
- **Vite** for build tooling

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Demo Credentials

The application includes mock authentication. Use these credentials to login:

- **Employee**: `employee@hrms.com` / `password`
- **Manager**: `manager@hrms.com` / `password`
- **HR**: `hr@hrms.com` / `password`

## Project Structure

```
src/
├── app/              # Redux store configuration
├── features/         # Feature-based Redux slices and services
├── layouts/          # Layout components (Auth, Dashboard, Sidebar)
├── pages/            # Page components
├── routes/           # Route configuration
├── services/         # API service configuration
└── utils/            # Utility functions and constants
```

## Features by Role

### Employee
- View profile and dashboard
- Apply for leaves
- View attendance and timesheet
- Submit reimbursement requests
- View salary and payslips
- Submit resignation

### Manager
- All employee features
- View team members
- Approve team leave requests
- View team attendance and timesheet
- Manage team reimbursements

### HR
- All manager features
- Payroll management
- Generate letters
- Configure salary structures
- Manage all user requests
- View leave balance of all users

## Mock Data

The application uses mock API responses for demonstration. To connect to a real backend:

1. Update `API_BASE_URL` in `src/utils/constants.js`
2. Replace mock functions in service files with actual API calls
3. Update Redux slices to handle real API responses

## Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## License

This project is created for demonstration purposes.
