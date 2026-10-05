# HRMS - Human Resource Management System

A fully functional, scalable HRMS mobile application built with React Native and Expo.

## Features

### Core Modules

1. **Authentication**
   - Login/Logout
   - Forgot Password
   - JWT-based authentication
   - Token refresh handling
   - Secure session storage

2. **Dashboard**
   - Role-based dashboards
   - Key metrics (attendance, leave, employees count)
   - Quick actions

3. **Company Management**
   - Add/Edit/Delete Company
   - Multiple companies support
   - Company-specific configurations

4. **Employee Management**
   - Add/Edit/View Employees
   - Employee profile (personal, job, documents)
   - Department, designation, reporting manager
   - Active/Inactive status

5. **Attendance Management**
   - Punch In/Out with geolocation
   - Office location & geo-fencing
   - Multiple office locations support
   - Late, half-day, absent calculation
   - Monthly attendance summary
   - Admin/HR can punch on behalf of employees

6. **Leave Management**
   - Leave types (CL, SL, PL, LOP, etc.)
   - Apply/Approve/Reject leave
   - Leave balance tracking
   - Manager & HR approval flow

7. **Payroll**
   - Monthly payroll summary
   - Salary breakup
   - Attendance-based calculation
   - Download payslip (PDF)

8. **Holiday & Shift Management**
   - Company-specific holidays
   - Weekly offs
   - Shift timing configuration

9. **Notifications**
   - Push notifications
   - In-app notifications

10. **Settings**
    - Profile settings
    - Password change
    - App preferences

## Tech Stack

- **Frontend**: React Native (Expo)
- **Navigation**: Expo Router
- **State Management**: Zustand
- **API Handling**: Axios
- **Form Validation**: React Hook Form + Yup
- **Storage**: AsyncStorage
- **Location**: Expo Location
- **UI**: Custom components with theme support

## User Roles

1. Super Admin
2. Company Admin
3. HR
4. Manager
5. Employee

## Project Structure

```
hrms/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Tab navigation screens
│   ├── attendance/        # Attendance screens
│   ├── leaves/            # Leave screens
│   ├── employees/         # Employee screens
│   └── settings/          # Settings screens
├── components/            # Reusable components
│   └── ui/                # UI components
├── services/              # API services
├── store/                 # Zustand stores
├── types/                 # TypeScript types
├── utils/                 # Utility functions
└── constants/             # Constants and theme
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS) or Android Emulator (for Android)

### Installation

1. **Install dependencies:**
   ```bash
   cd hrms
   npm install
   ```

2. **Configure API Base URL:**
   Edit `utils/constants.ts` and update `API_BASE_URL`:
   ```typescript
   export const API_BASE_URL = 'https://your-api-url.com/api';
   ```

3. **Run the app:**
   ```bash
   npm start
   ```

   Then press:
   - `a` for Android
   - `i` for iOS
   - `w` for web

### Environment Setup

For development, update the API base URL in `hrms/utils/constants.ts`:

```typescript
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'  // Development
  : 'https://api.hrms.com/api';  // Production
```

## API Integration

The app expects a REST API with the following endpoints:

### Authentication
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh token
- `POST /auth/forgot-password` - Forgot password
- `POST /auth/reset-password` - Reset password
- `POST /auth/change-password` - Change password

### Dashboard
- `GET /dashboard/stats` - Get dashboard statistics

### Companies
- `GET /companies` - Get all companies
- `GET /companies/:id` - Get company by ID
- `POST /companies` - Create company
- `PUT /companies/:id` - Update company
- `DELETE /companies/:id` - Delete company

### Employees
- `GET /employees` - Get all employees
- `GET /employees/:id` - Get employee by ID
- `POST /employees` - Create employee
- `PUT /employees/:id` - Update employee
- `DELETE /employees/:id` - Delete employee
- `PATCH /employees/:id/status` - Toggle employee status

### Attendance
- `POST /attendance/punch-in` - Punch in
- `POST /attendance/punch-out` - Punch out
- `GET /attendance/today` - Get today's attendance
- `GET /attendance` - Get attendance list
- `GET /attendance/monthly-summary` - Get monthly summary

### Leaves
- `GET /leaves` - Get all leaves
- `GET /leaves/:id` - Get leave by ID
- `POST /leaves` - Apply leave
- `PATCH /leaves/:id/approve` - Approve leave
- `PATCH /leaves/:id/reject` - Reject leave
- `PATCH /leaves/:id/cancel` - Cancel leave
- `GET /leaves/balance` - Get leave balance

### Payroll
- `GET /payroll` - Get payroll list
- `GET /payroll/:id` - Get payroll by ID
- `GET /payroll/:id/payslip` - Download payslip

### Notifications
- `GET /notifications` - Get notifications
- `PATCH /notifications/:id/read` - Mark as read
- `PATCH /notifications/read-all` - Mark all as read
- `GET /notifications/unread-count` - Get unread count

## Mock API Responses

For testing without a backend, you can use mock responses. See `services/` directory for API service implementations.

## Key Features

### Role-Based Access Control
- Different dashboards and permissions based on user role
- Protected routes and API endpoints
- UI elements shown/hidden based on permissions

### Geolocation
- Automatic location capture on punch in/out
- Geo-fencing support for office locations
- Distance calculation from office

### Offline Support
- Token storage in AsyncStorage
- User data persistence
- Automatic token refresh

### Theme Support
- Light/Dark mode
- System theme detection
- Consistent color scheme

## Development

### Code Structure

- **Services**: API calls and business logic
- **Stores**: State management with Zustand
- **Components**: Reusable UI components
- **Screens**: Screen components using Expo Router
- **Utils**: Helper functions and utilities
- **Types**: TypeScript type definitions

### Best Practices

- TypeScript for type safety
- Modular component structure
- Error handling and loading states
- Form validation with Yup
- Consistent code formatting
- Proper error messages

## Building for Production

1. **Configure app.json:**
   Update app name, bundle identifier, etc.

2. **Build:**
   ```bash
   # Android
   eas build --platform android

   # iOS
   eas build --platform ios
   ```

## Security Considerations

- JWT tokens stored securely
- API endpoints protected with authentication
- Input validation on all forms
- Secure password handling
- Role-based access control

## Contributing

1. Follow the existing code structure
2. Use TypeScript for all new code
3. Add proper error handling
4. Write clear commit messages
5. Test on both iOS and Android

## License

This project is proprietary software.

## Support

For issues or questions, please contact the development team.
