# Multi-Company HRMS Implementation

## Overview

This document describes the multi-company support implementation for the HRMS system. The system now supports multiple companies under one roof, with company-specific payroll calculations and branded payslips.

## Features

- ✅ **Multiple Companies**: Support for multiple companies in a single system
- ✅ **Company-Employee Mapping**: Each employee belongs to one company
- ✅ **Company-Specific Payroll**: Payroll calculations use company-specific working days and rules
- ✅ **Company-Branded Payslips**: Payslips include company logo, name, address, and registration details
- ✅ **Company Data Isolation**: Employees can only access their company's data
- ✅ **Company-Wise Automation**: Payroll automation processes all companies
- ✅ **Backward Compatibility**: Existing data continues to work

## Database Schema

### Companies Table (New)

```sql
CREATE TABLE companies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_code VARCHAR(50) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  postal_code VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  currency VARCHAR(10) DEFAULT 'INR',
  registration_number VARCHAR(100),
  tax_id VARCHAR(100),
  working_days_config JSON,
  payroll_cycle ENUM('MONTHLY', 'BIWEEKLY', 'WEEKLY') DEFAULT 'MONTHLY',
  payroll_day INT DEFAULT 1,
  payslip_template ENUM('STANDARD', 'COMPACT', 'DETAILED') DEFAULT 'STANDARD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Users Table (Updated)

- Added `company_id` (INT, FK → companies.id) - Links user to company

### Payrolls Table (Updated)

- Added `company_id` (INT, FK → companies.id) - Links payroll to company
- Added `company_name` (VARCHAR) - Company name at time of payroll generation
- Added `company_address` (TEXT) - Company address at time of payroll generation
- Added `company_logo_url` (TEXT) - Company logo URL at time of payroll generation
- Added `company_registration_number` (VARCHAR) - Registration number at time of payroll generation
- Updated unique constraint to include `company_id`: `(user_id, payroll_month, payroll_year, company_id)`

## Company Configuration

### Working Days Configuration

Each company can configure its working days:

```json
{
  "monday": true,
  "tuesday": true,
  "wednesday": true,
  "thursday": true,
  "friday": true,
  "saturday": false,
  "sunday": false
}
```

### Payroll Cycle

- **MONTHLY**: Payroll processed monthly (default)
- **BIWEEKLY**: Payroll processed bi-weekly
- **WEEKLY**: Payroll processed weekly

### Payroll Day

Day of the month when payroll is processed (1-31, default: 1)

## API Endpoints

### Company Management

#### Get All Companies
```
GET /api/companies
Authorization: Bearer <token>
Roles: ADMIN, HR, HEAD_HR

Query Parameters:
- isActive (boolean)
- country (string)
- search (string)
```

#### Get Company by ID
```
GET /api/companies/:id
Authorization: Bearer <token>
Roles: ADMIN, HR, HEAD_HR, MANAGER
```

#### Create Company
```
POST /api/companies
Authorization: Bearer <token>
Roles: ADMIN

Body:
{
  "companyCode": "COMP001",
  "companyName": "Company Name",
  "address": "Full Address",
  "city": "City",
  "state": "State",
  "country": "India",
  "currency": "INR",
  "registrationNumber": "REG123",
  "workingDaysConfig": {
    "monday": true,
    "tuesday": true,
    ...
  }
}
```

#### Update Company
```
PUT /api/companies/:id
Authorization: Bearer <token>
Roles: ADMIN
```

#### Delete Company (Soft Delete)
```
DELETE /api/companies/:id
Authorization: Bearer <token>
Roles: ADMIN
```

### Payroll Endpoints (Updated)

All payroll endpoints now respect company boundaries:

- **GET /api/payroll**: Returns payrolls filtered by user's company (unless admin)
- **GET /api/payroll/:id**: Validates company access before returning payroll
- **POST /api/payroll/run-auto**: Processes payroll for all companies
- **POST /api/payroll/calculate**: Calculates payroll using company-specific rules

## Payroll Calculation (Company-Aware)

### Process Flow

1. **Fetch Employee**: Get employee with company information
2. **Validate Company**: Ensure employee has active company assigned
3. **Get Working Days**: Calculate working days based on company configuration
4. **Calculate Attendance**: Aggregate attendance for the month
5. **Calculate Salary**: Apply company-specific rules
6. **Store Company Branding**: Save company information in payroll record

### Calculation Rules

- **Per Day Salary** = Monthly Salary / Company Working Days
- **Payable Days** = (Full Days × 1.0) + (Half Days × 0.5)
- **LOP Days** = Total Working Days - Payable Days
- **Final Salary** = Payable Days × Per Day Salary

## Payslip Generation

### Company Branding

Payslips now include:

- **Company Name**: Prominently displayed at top
- **Company Address**: Full address with city, state, postal code
- **Company Registration Number**: Displayed below address
- **Company Logo**: If available (future enhancement)

### Payslip Content

1. **Header**: Company name, address, registration number
2. **Employee Information**: Name, code, payroll month
3. **Attendance Summary**: Full days, half days, absent days, payable days, LOP days
4. **Salary Calculation**: Monthly salary, working days, per day salary
5. **Final Payable**: Net salary amount
6. **Footer**: Generation timestamp

## Security & Data Isolation

### Company Boundary Enforcement

1. **Employee Access**: Employees can only view their own payroll
2. **Manager Access**: Managers can view their company's payroll
3. **HR Access**: HR can view all companies' payroll (if authorized)
4. **Admin Access**: Full access to all companies

### Validation Rules

- Employees must have a company assigned
- Payroll cannot be created without company
- Company must be active for payroll processing
- Cross-company data access is prevented

## Migration Guide

### Step 1: Run Migrations

```bash
cd backend
npm run db:migrate
```

This will:
- Create `companies` table
- Add `company_id` to `users` table
- Add company fields to `payrolls` table

### Step 2: Create Companies

Create companies using the API or directly in the database:

```sql
INSERT INTO companies (company_code, company_name, country, currency, is_active)
VALUES ('COMP001', 'Company Name', 'India', 'INR', true);
```

### Step 3: Assign Employees to Companies

Update employees to assign them to companies:

```sql
UPDATE users SET company_id = 1 WHERE id = 1;
```

Or use the User Management API.

### Step 4: Configure Company Settings

Update company working days and other settings:

```sql
UPDATE companies 
SET working_days_config = '{"monday":true,"tuesday":true,"wednesday":true,"thursday":true,"friday":true,"saturday":false,"sunday":false}'
WHERE id = 1;
```

## Backward Compatibility

- Existing users without companies will be skipped in payroll calculation
- Payroll records without company_id are still accessible
- Default working days (Monday-Friday) used if company config not set
- System continues to work for existing data

## Testing

### Manual Testing

1. **Create Company**:
```bash
POST /api/companies
{
  "companyCode": "TEST001",
  "companyName": "Test Company",
  "country": "India",
  "currency": "INR"
}
```

2. **Assign Employee**:
```bash
PUT /api/users/:id
{
  "companyId": 1
}
```

3. **Calculate Payroll**:
```bash
POST /api/payroll/calculate
{
  "userId": 1,
  "year": 2024,
  "month": 1
}
```

4. **Download Payslip**: Should include company branding

## Future Enhancements

- Company logo upload and display in payslips
- Company-specific payroll approval workflows
- Multi-currency support with exchange rates
- Company-specific payslip templates (HTML/PDF)
- Company-level reporting and analytics
- Company-specific leave policies
- Company-specific attendance rules

## Troubleshooting

### Issue: Employee has no company assigned

**Solution**: Assign company to employee using User Management API or database update.

### Issue: Payroll calculation skipped

**Check**:
- Employee has company assigned
- Company is active
- Employee has monthly salary set
- Employee is active

### Issue: Payslip doesn't show company information

**Check**:
- Payroll record has company_id
- Company information was stored during payroll generation
- Regenerate payroll if needed

## Support

For issues or questions, refer to:
- API Documentation: `API_DOCUMENTATION.md`
- Payroll Automation: `PAYROLL_AUTOMATION.md`
- Database Schema: `DATABASE_SCHEMA.md`
