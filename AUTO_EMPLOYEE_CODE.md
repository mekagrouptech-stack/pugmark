# Auto-Generate Employee Code - Implementation ✅

## Overview

Employee Code is now **automatically generated** when creating new users. The code is based on the user's role and a sequential number.

---

## ✅ Implementation Details

### 1. **Backend Auto-Generation** (`backend/controllers/userController.js`)

**Employee Code Format:**
- `ADMIN0001`, `ADMIN0002`, `ADMIN0003`... (for ADMIN role)
- `HEADHR0001`, `HEADHR0002`... (for HEAD_HR role)
- `HR0001`, `HR0002`... (for HR role)
- `HOD0001`, `HOD0002`... (for HOD role)
- `MGR0001`, `MGR0002`... (for MANAGER role)
- `EMP0001`, `EMP0002`... (for EMPLOYEE role)

**Generation Logic:**
1. Checks if employee code is provided in request
2. If **not provided**, generates automatically:
   - Uses role prefix (ADMIN, HEADHR, HR, HOD, MGR, EMP)
   - Finds the next available sequential number
   - Ensures uniqueness (checks existing codes)
   - Format: `{PREFIX}{4-digit-number}` (e.g., EMP0001)

**Example:**
- First EMPLOYEE → `EMP0001`
- Second EMPLOYEE → `EMP0002`
- First HR → `HR0001`
- First ADMIN → `ADMIN0001`

### 2. **Frontend Updates** (`src/pages/admin/UserManagement.jsx`)

**Add New User Form:**
- Employee Code field is **optional**
- Tooltip: "Leave blank to auto-generate based on role"
- If left blank, backend will auto-generate
- If provided, backend will use the provided code (if unique)

**Edit User Form:**
- Employee Code field is **disabled** (read-only)
- Cannot be changed after creation
- Shows: "Auto-generated (cannot be changed)"

---

## 🎯 How It Works

### Creating New User:

1. **Admin fills form:**
   - Name: "John Doe"
   - Email: "john@example.com"
   - Password: "password123"
   - Role: EMPLOYEE
   - **Employee Code: (leave blank)**

2. **Backend generates:**
   - Checks existing EMP codes
   - Finds next available: EMP0001 (or EMP0002, EMP0003, etc.)
   - Assigns: `EMP0001`

3. **Result:**
   - User created with `employeeCode: "EMP0001"`

### Creating User with Custom Code:

1. **Admin fills form:**
   - Employee Code: "CUSTOM001"

2. **Backend validates:**
   - Checks if "CUSTOM001" exists
   - If unique → uses "CUSTOM001"
   - If exists → returns error

---

## 📋 Employee Code Prefixes

| Role | Prefix | Example |
|------|--------|---------|
| ADMIN | `ADMIN` | ADMIN0001 |
| HEAD_HR | `HEADHR` | HEADHR0001 |
| HR | `HR` | HR0001 |
| HOD | `HOD` | HOD0001 |
| MANAGER | `MGR` | MGR0001 |
| EMPLOYEE | `EMP` | EMP0001 |

---

## ✅ Features

- ✅ **Auto-generation** - Codes generated automatically if not provided
- ✅ **Role-based** - Prefix based on user role
- ✅ **Sequential** - Numbers increment for each role (0001, 0002, 0003...)
- ✅ **Unique** - Automatically ensures uniqueness
- ✅ **Immutable** - Cannot be changed after creation
- ✅ **Optional** - Can still provide custom code if needed

---

## 🔒 Security & Validation

- ✅ Employee code is **unique** (database constraint)
- ✅ Cannot be changed after user creation (immutable)
- ✅ Auto-generation ensures no duplicates
- ✅ Custom codes are validated for uniqueness

---

## 📝 Notes

1. **First User of Each Role:**
   - Starts from `{ROLE}0001`
   - Example: First EMPLOYEE → EMP0001

2. **Sequential Numbering:**
   - Finds highest existing number for that role
   - Generates next number
   - Example: If EMP0001, EMP0002 exist → generates EMP0003

3. **Custom Codes:**
   - Still allowed if provided
   - Must be unique
   - Can be any format (not just role-based)

4. **Editing:**
   - Employee code field is disabled when editing
   - Shows current code but cannot be changed

---

## 🎉 Result

**Employee Code is now fully automated!**

- ✅ Admin doesn't need to manually enter employee codes
- ✅ Codes are automatically generated based on role
- ✅ Ensures uniqueness and sequential numbering
- ✅ Cannot be changed after creation
- ✅ Optional custom codes still supported

**The system will automatically assign unique employee codes when creating new users!**
