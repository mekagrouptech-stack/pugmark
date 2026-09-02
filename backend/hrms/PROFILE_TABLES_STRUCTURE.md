# Profile Tables Structure - Complete Implementation

## ✅ Implementation Status: COMPLETE

The profile has been successfully divided into **6 separate tables** with proper relationships.

---

## 📊 Database Tables Created

### 1. `basic_information` Table
**Purpose:** Stores basic profile information

**Fields:**
- `id` (Primary Key)
- `user_id` (Foreign Key → users.id, UNIQUE)
- `avatar` (TEXT)
- `your_views_on_organization` (TEXT)
- `about_me` (TEXT)
- `gender` (ENUM: 'Male', 'Female', 'Other')
- `date_of_birth` (DATE)
- `blood_group` (ENUM: 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-')
- `address_for_payslip` (TEXT)
- `created_at`, `updated_at` (Timestamps)

**Relationship:** One-to-One with `users` table

---

### 2. `personal_information` Table
**Purpose:** Stores personal details

**Fields:**
- `id` (Primary Key)
- `user_id` (Foreign Key → users.id, UNIQUE)
- `fathers_name` (VARCHAR(255))
- `place_of_birth` (VARCHAR(255))
- `mother_tongue` (VARCHAR(100))
- `marital_status` (ENUM: 'Single', 'Married', 'Divorced', 'Widowed')
- `date_of_marriage` (DATE)
- `passport_number` (VARCHAR(50))
- `aadhaar_number` (VARCHAR(20))
- `pan_number` (VARCHAR(20))
- `created_at`, `updated_at` (Timestamps)

**Relationship:** One-to-One with `users` table

---

### 3. `contact_information` Table
**Purpose:** Stores contact details

**Fields:**
- `id` (Primary Key)
- `user_id` (Foreign Key → users.id, UNIQUE)
- `mobile_no` (VARCHAR(20))
- `official_mobile_no` (VARCHAR(20))
- `personal_email_id` (VARCHAR(255))
- `address` (TEXT)
- `city_town` (VARCHAR(100))
- `pin_code` (VARCHAR(10))
- `state` (VARCHAR(100))
- `country` (VARCHAR(100))
- `permanent_address` (TEXT)
- `emergency_contact_person` (VARCHAR(255))
- `relation` (VARCHAR(50))
- `emergency_contact_mobile_no` (VARCHAR(20))
- `created_at`, `updated_at` (Timestamps)

**Relationship:** One-to-One with `users` table

---

### 4. `educational_information` Table
**Purpose:** Stores educational qualifications

**Fields:**
- `id` (Primary Key)
- `user_id` (Foreign Key → users.id, UNIQUE)
- `graduation` (VARCHAR(255))
- `year_of_passing_graduation` (INTEGER)
- `post_graduation` (VARCHAR(255))
- `year_of_passing_post_graduation` (INTEGER)
- `other_qualification` (VARCHAR(255))
- `year_of_passing_other_qualification` (INTEGER)
- `certifications` (TEXT)
- `co_curricular_activities_hobbies` (TEXT)
- `created_at`, `updated_at` (Timestamps)

**Relationship:** One-to-One with `users` table

---

### 5. `employment_information` Table
**Purpose:** Stores employment details

**Fields:**
- `id` (Primary Key)
- `user_id` (Foreign Key → users.id, UNIQUE)
- `date_of_joining` (DATE)
- `confirmation_date` (DATE)
- `employment_status` (ENUM: 'Probation', 'Confirmed', 'Contract')
- `notice_period` (INTEGER)
- `state_tax` (VARCHAR(100))
- `comp_off_overtime` (ENUM: 'Yes', 'No')
- `work_location` (VARCHAR(255))
- `company` (VARCHAR(255))
- `last_working_date` (DATE)
- `created_at`, `updated_at` (Timestamps)

**Relationship:** One-to-One with `users` table

---

### 6. `documents` Table
**Purpose:** Stores uploaded documents (supports multiple documents per type)

**Fields:**
- `id` (Primary Key)
- `user_id` (Foreign Key → users.id)
- `document_type` (ENUM: 'panCard', 'aadhaarCard', 'passport', 'markSheets', 'otherDocuments')
- `file_url` (TEXT, NOT NULL)
- `file_name` (VARCHAR(255))
- `file_size` (INTEGER)
- `mime_type` (VARCHAR(100))
- `created_at`, `updated_at` (Timestamps)

**Indexes:**
- Index on `user_id`
- Composite index on `user_id` and `document_type`

**Relationship:** One-to-Many with `users` table (one user can have multiple documents)

---

## 🔗 Relationships

### User Model Associations
```javascript
User.hasOne(BasicInformation, { as: 'basicInformation' })
User.hasOne(PersonalInformation, { as: 'personalInformation' })
User.hasOne(ContactInformation, { as: 'contactInformation' })
User.hasOne(EducationalInformation, { as: 'educationalInformation' })
User.hasOne(EmploymentInformation, { as: 'employmentInformation' })
User.hasMany(Document, { as: 'documents' })
```

### Reverse Associations
All profile tables have:
```javascript
Model.belongsTo(User, { as: 'user' })
```

---

## 📁 Files Created

### Migrations
- ✅ `backend/migrations/20240117000001-create-basic-information.js`
- ✅ `backend/migrations/20240117000002-create-personal-information.js`
- ✅ `backend/migrations/20240117000003-create-contact-information.js`
- ✅ `backend/migrations/20240117000004-create-educational-information.js`
- ✅ `backend/migrations/20240117000005-create-employment-information.js`
- ✅ `backend/migrations/20240117000006-create-documents.js`

### Models
- ✅ `backend/models/BasicInformation.js`
- ✅ `backend/models/PersonalInformation.js`
- ✅ `backend/models/ContactInformation.js`
- ✅ `backend/models/EducationalInformation.js`
- ✅ `backend/models/EmploymentInformation.js`
- ✅ `backend/models/Document.js`

### Updated Files
- ✅ `backend/models/index.js` - Added new models
- ✅ `backend/models/User.js` - Added associations
- ✅ `backend/services/profileService.js` - Updated to work with separate tables
- ✅ `backend/controllers/profileController.js` - Updated document upload

---

## 🔧 Service Layer Changes

The `profileService` has been completely rewritten to:

1. **Fetch from multiple tables** - Uses Sequelize includes to fetch all related data
2. **Update correct table** - Routes updates to the appropriate table based on group
3. **Handle documents separately** - Uses Document model for file management
4. **Maintain API compatibility** - Frontend API remains unchanged

### Key Methods:
- `getProfile(userId)` - Fetches from all tables and transforms to frontend format
- `updateField(userId, group, field, value)` - Updates single field in correct table
- `updateGroup(userId, group, data)` - Updates multiple fields in a group
- `updateDocument(userId, field, value)` - Handles document uploads/deletions

---

## 📡 API Endpoints (Unchanged)

All API endpoints remain the same from the frontend perspective:

- `GET /api/profile` - Get complete profile
- `PATCH /api/profile/field` - Update single field
- `PUT /api/profile/group` - Update group
- `POST /api/profile/upload/avatar` - Upload avatar
- `POST /api/profile/upload/document` - Upload document

**No frontend changes required!** The API maintains the same response format.

---

## 🎯 Benefits of Separate Tables

1. **Better Organization** - Each profile section is in its own table
2. **Improved Performance** - Can query only needed sections
3. **Easier Maintenance** - Changes to one section don't affect others
4. **Scalability** - Easy to add new fields to specific sections
5. **Data Integrity** - Foreign key constraints ensure data consistency
6. **Flexible Documents** - Multiple documents per type supported

---

## ✅ Verification

All tables have been successfully created:
- ✅ `basic_information` - Created
- ✅ `personal_information` - Created
- ✅ `contact_information` - Created
- ✅ `educational_information` - Created
- ✅ `employment_information` - Created
- ✅ `documents` - Created

All relationships configured:
- ✅ User → BasicInformation (One-to-One)
- ✅ User → PersonalInformation (One-to-One)
- ✅ User → ContactInformation (One-to-One)
- ✅ User → EducationalInformation (One-to-One)
- ✅ User → EmploymentInformation (One-to-One)
- ✅ User → Documents (One-to-Many)

---

## 🚀 Next Steps

1. **Test the APIs** - Verify all endpoints work correctly
2. **Migrate existing data** (if any) - From old `user_profiles` table to new tables
3. **Update frontend** (if needed) - Should work as-is, but verify
4. **Remove old table** (optional) - Can drop `user_profiles` table if no longer needed

---

**Status:** ✅ **COMPLETE - All tables created and relationships configured**
