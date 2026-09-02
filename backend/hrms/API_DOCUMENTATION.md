# API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Most endpoints require JWT authentication. Include token in request header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Attendance APIs

### 1. Punch Attendance

Punch in or out with location validation.

**Endpoint:** `POST /api/attendance/punch`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "officeId": 1,
  "latitude": 19.1136,
  "longitude": 72.8697,
  "punchType": "IN",
  "remark": "Optional remark for override"
}
```

**Validation:**
- `officeId`: Required, positive integer
- `latitude`: Required, number between -90 and 90
- `longitude`: Required, number between -180 and 180
- `punchType`: Required, must be "IN" or "OUT"
- `remark`: Optional, max 500 characters

**Success Response (201):**
```json
{
  "success": true,
  "message": "Successfully punched in from office location",
  "data": {
    "id": 123,
    "punchType": "IN",
    "timestamp": "2024-01-15T09:00:00.000Z",
    "office": {
      "id": 1,
      "name": "Mumbai Office"
    },
    "location": {
      "latitude": 19.1136,
      "longitude": 72.8697,
      "distance": 45,
      "isWithinRadius": true
    },
    "message": "Successfully punched in from office location"
  }
}
```

**Error Responses:**

**400 - Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "latitude",
      "message": "Latitude is required"
    }
  ]
}
```

**400 - Outside Geofence (Strict):**
```json
{
  "success": false,
  "message": "You are 150m away from the office. Attendance is only allowed within 100m radius."
}
```

**409 - Invalid Sequence:**
```json
{
  "success": false,
  "message": "You have already punched in today. Please punch out first."
}
```

---

### 2. Get Attendance Records

Get user's attendance records with optional filters.

**Endpoint:** `GET /api/attendance/records`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)
- `officeId` (optional): Filter by office ID

**Example:**
```
GET /api/attendance/records?startDate=2024-01-01&endDate=2024-01-31&officeId=1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Attendance records retrieved successfully",
  "data": [
    {
      "id": "date-2024-01-15",
      "date": "2024-01-15",
      "officeId": 1,
      "officeName": "Mumbai Office",
      "checkIn": "09:00 AM",
      "checkOut": "06:00 PM",
      "checkInLocation": {
        "latitude": 19.1136,
        "longitude": 72.8697,
        "distance": 45,
        "isWithinRadius": true
      },
      "checkOutLocation": {
        "latitude": 19.1136,
        "longitude": 72.8697,
        "distance": 42,
        "isWithinRadius": true
      },
      "status": "Present"
    }
  ]
}
```

---

### 3. Get Attendance Record by ID

Get specific attendance record with location details.

**Endpoint:** `GET /api/attendance/records/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Attendance record retrieved successfully",
  "data": {
    "id": 123,
    "date": "2024-01-15",
    "punchType": "IN",
    "location": {
      "latitude": 19.1136,
      "longitude": 72.8697,
      "distance": 45,
      "isWithinRadius": true
    }
  }
}
```

---

## Office APIs

### 1. Get All Offices

Get list of all active offices.

**Endpoint:** `GET /api/offices`

**Headers:** (Optional authentication)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Offices retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Mumbai Office",
      "country": "India",
      "address": "123 Business Park, Mumbai",
      "latitude": 19.1136,
      "longitude": 72.8697,
      "radius": 100,
      "isActive": true,
      "strictGeofencing": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 2. Get Office Location (for Map)

Get office location data optimized for frontend map rendering.

**Endpoint:** `GET /api/offices/:id/location`

**Headers:** (Optional authentication)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Office location retrieved successfully",
  "data": {
    "id": 1,
    "name": "Mumbai Office",
    "country": "India",
    "address": "123 Business Park, Mumbai",
    "latitude": 19.1136,
    "longitude": 72.8697,
    "radius": 100,
    "strictGeofencing": true
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Office not found or inactive"
}
```

---

### 3. Get User's Assigned Offices

Get list of office IDs assigned to a user.

**Endpoint:** `GET /api/offices/user/:userId`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User offices retrieved successfully",
  "data": [1, 2, 3]
}
```

---

### 4. Check Office Access

Check if authenticated user has access to an office.

**Endpoint:** `GET /api/offices/:id/access`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User has access to office",
  "data": {
    "hasAccess": true
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [] // Optional, for validation errors
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., double punch-in)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Business Logic

### Geofencing Rules

1. **Strict Geofencing Enabled:**
   - Employees: Must be within radius, cannot override
   - Managers/Admins/HR: Can override with mandatory remark

2. **Strict Geofencing Disabled:**
   - All users: Can punch outside radius with mandatory remark

### Punch Sequence Validation

- Cannot punch IN twice in the same day
- Must punch IN before punching OUT
- Each punch is validated independently

### Role-Based Access

- **Employee**: Can only punch for assigned offices
- **Manager/Admin/HR**: Can punch for any office
- **All roles**: Subject to geofencing rules based on office settings

---

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Configurable via environment variables

---

## Profile APIs

### 1. Get User Profile

Get the complete profile information for the authenticated user.

**Endpoint:** `GET /api/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "basicInformation": {
      "avatar": "/uploads/avatars/avatar-1-1234567890.jpg",
      "yourViewsOnOrganization": "Great place to work",
      "aboutMe": "Experienced developer",
      "gender": "Male",
      "dateOfBirth": "1990-01-15T00:00:00.000Z",
      "bloodGroup": "O+",
      "addressForPayslip": "123 Main St, City"
    },
    "personalInformation": {
      "fathersName": "John Doe",
      "placeOfBirth": "Mumbai",
      "motherTongue": "English",
      "maritalStatus": "Married",
      "dateOfMarriage": "2015-06-20T00:00:00.000Z",
      "passportNumber": "A1234567",
      "aadhaarNumber": "123456789012",
      "panNumber": "ABCDE1234F"
    },
    "contactInformation": {
      "mobileNo": "+919876543210",
      "officialMobileNo": "+919876543211",
      "personalEmailId": "personal@example.com",
      "address": "123 Main Street",
      "cityTown": "Mumbai",
      "pinCode": "400001",
      "state": "Maharashtra",
      "country": "India",
      "permanentAddress": "456 Permanent St",
      "emergencyContactPerson": "Jane Doe",
      "relation": "Spouse",
      "emergencyContactMobileNo": "+919876543212"
    },
    "educationalInformation": {
      "graduation": "B.Tech Computer Science",
      "yearOfPassingGraduation": 2012,
      "postGraduation": "M.Tech Software Engineering",
      "yearOfPassingPostGraduation": 2014,
      "otherQualification": "Certified AWS Architect",
      "yearOfPassingOtherQualification": 2016,
      "certifications": "AWS, Azure, GCP",
      "coCurricularActivitiesHobbies": "Cricket, Reading"
    },
    "employmentInformation": {
      "dateOfJoining": "2020-01-01T00:00:00.000Z",
      "confirmationDate": "2020-07-01T00:00:00.000Z",
      "employmentStatus": "Confirmed",
      "employeeCode": "EMP001",
      "noticePeriod": 30,
      "stateTax": "Maharashtra",
      "compOffOvertime": "Yes",
      "department": "IT",
      "workLocation": "Mumbai Office",
      "company": "ABC Corp",
      "lastWorkingDate": null
    },
    "documents": {
      "panCard": "/uploads/documents/doc-1-1234567890.pdf",
      "aadhaarCard": "/uploads/documents/doc-1-1234567891.jpg",
      "passport": "/uploads/documents/doc-1-1234567892.pdf",
      "markSheets": [
        "/uploads/documents/doc-1-1234567893.pdf",
        "/uploads/documents/doc-1-1234567894.pdf"
      ],
      "otherDocuments": [
        "/uploads/documents/doc-1-1234567895.pdf"
      ]
    }
  }
}
```

---

### 2. Update Profile Field

Update a single field in the user's profile.

**Endpoint:** `PATCH /api/profile/field`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "group": "basicInformation",
  "field": "gender",
  "value": "Male"
}
```

**Field Groups:**
- `basicInformation`: avatar, yourViewsOnOrganization, aboutMe, gender, dateOfBirth, bloodGroup, addressForPayslip
- `personalInformation`: fathersName, placeOfBirth, motherTongue, maritalStatus, dateOfMarriage, passportNumber, aadhaarNumber, panNumber
- `contactInformation`: mobileNo, officialMobileNo, personalEmailId, address, cityTown, pinCode, state, country, permanentAddress, emergencyContactPerson, relation, emergencyContactMobileNo
- `educationalInformation`: graduation, yearOfPassingGraduation, postGraduation, yearOfPassingPostGraduation, otherQualification, yearOfPassingOtherQualification, certifications, coCurricularActivitiesHobbies
- `employmentInformation`: dateOfJoining, confirmationDate, employmentStatus, noticePeriod, stateTax, compOffOvertime, workLocation, company, lastWorkingDate
- `documents`: panCard, aadhaarCard, passport, markSheets, otherDocuments

**Success Response (200):**
```json
{
  "success": true,
  "message": "Field updated successfully",
  "data": {
    "group": "basicInformation",
    "field": "gender",
    "value": "Male",
    "profile": {
      // Complete profile object
    }
  }
}
```

---

### 3. Update Profile Group

Update multiple fields in a profile group at once.

**Endpoint:** `PUT /api/profile/group`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "group": "contactInformation",
  "data": {
    "mobileNo": "+919876543210",
    "address": "123 Main Street",
    "cityTown": "Mumbai",
    "pinCode": "400001",
    "state": "Maharashtra",
    "country": "India"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile group updated successfully",
  "data": {
    "group": "contactInformation",
    "data": {
      // Updated data
    },
    "profile": {
      // Complete profile object
    }
  }
}
```

---

### 4. Upload Avatar

Upload a profile picture/avatar.

**Endpoint:** `POST /api/profile/upload/avatar`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `avatar`: Image file (JPEG, PNG, max 10MB)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "url": "/uploads/avatars/avatar-1-1234567890.jpg",
    "profile": {
      // Complete profile object with updated avatar
    }
  }
}
```

**Error Responses:**

**400 - No File:**
```json
{
  "success": false,
  "message": "No file uploaded"
}
```

**400 - Invalid File Type:**
```json
{
  "success": false,
  "message": "Only JPEG and PNG images are allowed for avatars"
}
```

---

### 5. Upload Document

Upload a document (PAN card, Aadhaar, Passport, Mark Sheets, etc.).

**Endpoint:** `POST /api/profile/upload/document`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `document`: File (PDF, JPEG, PNG, max 10MB)
- `field`: Document field name (panCard, aadhaarCard, passport, markSheets, otherDocuments)

**Note:** For `markSheets` and `otherDocuments`, multiple files can be uploaded by calling this endpoint multiple times. Each call adds to the existing array.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "field": "panCard",
    "url": "/uploads/documents/doc-1-1234567890.pdf",
    "profile": {
      // Complete profile object with updated documents
    }
  }
}
```

**Error Responses:**

**400 - No File:**
```json
{
  "success": false,
  "message": "No file uploaded"
}
```

**400 - Missing Field:**
```json
{
  "success": false,
  "message": "Document field name is required"
}
```

**400 - Invalid File Type:**
```json
{
  "success": false,
  "message": "Only PDF, JPEG, and PNG files are allowed for documents"
}
```

---

## Security

- All sensitive endpoints require JWT authentication
- Input validation on all requests
- SQL injection prevention (parameterized queries)
- CORS protection
- Security headers (Helmet)
- Rate limiting
- File upload validation (type and size)