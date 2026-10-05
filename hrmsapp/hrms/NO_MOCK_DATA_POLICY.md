# NO MOCK DATA POLICY

## 🚫 STRICT RULE: NO MOCK DATA

This HRMS mobile application uses **REAL backend APIs ONLY**. 

### What is NOT allowed:
- ❌ Mock data
- ❌ Demo data
- ❌ Static JSON files
- ❌ Hardcoded arrays
- ❌ Fake API responses
- ❌ Local mock services
- ❌ Fallback demo responses

### What IS required:
- ✅ All data from backend APIs
- ✅ Proper error handling
- ✅ Loading states
- ✅ Empty states when API returns no data
- ✅ Network error detection
- ✅ Retry mechanisms

## Implementation Details

### Authentication
- Uses real JWT tokens from `/api/auth/login`
- Tokens stored securely in `expo-secure-store`
- Auto-logout on token expiry (401 errors)
- Role-based access from API response

### API Service Layer
- Centralized in `services/api.ts`
- Uses Axios for all HTTP requests
- Base URL from environment variables
- Authorization header on every secured request
- Automatic token refresh on 401 errors

### Services Updated
All services have been updated to remove mock data:

1. **auth.service.ts** - Real login/logout/refresh
2. **dashboard.service.ts** - Real dashboard stats
3. **attendance.service.ts** - Real punch in/out
4. **employee.service.ts** - Real employee CRUD
5. **leave.service.ts** - Real leave management
6. **dar.service.ts** - Real DAR operations
7. **payroll.service.ts** - Real payroll data

### State Management
- Zustand stores only API responses
- No prefilled or seeded data
- State cleared on logout

### Error Handling
- Network errors show "No internet connection"
- 401 errors trigger logout
- 404 errors show "Not found"
- 500 errors show "Server error"
- Empty API responses show "No data available"

### UI States
- **Loading**: Skeleton loaders while API loads
- **Empty**: "No data available" when API returns empty
- **Error**: Clear error messages from API response
- **Success**: Display API data

## Environment Configuration

### Development
```typescript
API_BASE_URL = 'http://localhost:3001/api'
```

### Production
Set `EXPO_PUBLIC_API_BASE_URL` environment variable in your deployment.

### For Android Emulator
Use `http://10.0.2.2:3001/api` instead of `localhost`.

### For Physical Device
Use your computer's IP address: `http://192.168.x.x:3001/api`

## Testing

When testing:
1. Ensure backend server is running
2. Use real user credentials
3. Verify API responses are displayed
4. Test error scenarios (network off, invalid credentials, etc.)
5. Verify empty states when no data exists

## Missing Endpoints

Some features may need backend endpoints:
- Employee birthdays (currently filters all employees client-side)
- Employee anniversaries (currently filters all employees client-side)
- Holidays list
- Notifications

See `API_ENDPOINTS.md` for complete endpoint documentation.

## Security

- Tokens stored in `expo-secure-store` (encrypted storage)
- User data in `AsyncStorage` (less sensitive)
- No sensitive data in logs
- Environment variables for URLs and keys
- Strict TypeScript typing for API responses

## Migration Notes

If you previously used mock data:
1. Remove all `USE_MOCK_AUTH` flags
2. Remove all mock data files
3. Ensure backend is running
4. Update API base URL if needed
5. Test all features with real data

---

**Remember**: This app is production-ready and connects to a live backend. No mock data is used anywhere.
