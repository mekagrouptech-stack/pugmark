import React, { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Spin, message, Input, Select, Card, Row, Col, Dropdown, Progress, Tooltip } from 'antd'
import { GlobalOutlined } from '@ant-design/icons'
import { fetchProfile, updateField, uploadDocument } from '../../features/profile/profileSlice'
import ProfileGroupCard from '../../components/profile/ProfileGroupCard'
import AvatarUploader from '../../components/profile/AvatarUploader'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_BASE_URL } from '../../utils/constants'
import { computeProfileCompletion, completionColor } from '../../utils/profileCompletion'
import dayjs from 'dayjs'
import { useTranslation } from '../../utils/useTranslation'
import { t } from '../../utils/translations'

const { TextArea } = Input
const { Option } = Select

// Fields an employee cannot change on their own profile
const HR_ONLY_ROLES = ['HR', 'HEAD_HR', 'ADMIN']

// Employment Information is HR-owned data. Employees can read it but only
// HR / Head HR / Admin may change it, so every field in the group is forced
// read-only for everyone else. Mirrored by HR_ONLY_FIELDS in
// backend/controllers/profileController.js, which is what actually enforces it.
const EMPLOYMENT_FIELDS = [
  'dateOfJoining',
  'confirmationDate',
  'employmentStatus',
  'employeeCode',
  'noticePeriod',
  'stateTax',
  'compOffOvertime',
  'department',
  'workLocation',
  'companyId',
  'lastWorkingDate',
]

const MyProfile = () => {
  const dispatch = useDispatch()
  const { profileData, loading } = useSelector((state) => state.profile)
  const { user } = useSelector((state) => state.auth)
  const [companies, setCompanies] = useState([])
  const { locale, setLocale, translateField, translateGroup, translateOption } = useTranslation()
  const canEditHrOnlyFields = HR_ONLY_ROLES.includes(String(user?.role || '').toUpperCase())

  useEffect(() => {
    dispatch(fetchProfile())
    fetchCompanies()
  }, [dispatch])

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('hrms_token')
      const response = await fetch(`${API_BASE_URL}/companies?isActive=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setCompanies(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const handleFieldUpdate = async (groupName, fieldName, value) => {
    try {
      await dispatch(updateField({ group: groupName, field: fieldName, value })).unwrap()
      message.success('Field updated successfully!')
    } catch (error) {
      message.error('Failed to update field')
    }
  }

  const handleAvatarUpload = async (url) => {
    try {
      await dispatch(updateField({ group: 'basicInformation', field: 'avatar', value: url })).unwrap()
    } catch (error) {
      message.error('Failed to update avatar')
    }
  }

  const fieldConfigs = useMemo(() => {
    const base = {
      fullName: { type: 'text', placeholder: 'Enter name' },
      aboutMe: { type: 'textarea', rows: 4, placeholder: 'Tell us about yourself', colSpan: 24 },
      gender: {
        type: 'select',
        options: [
          { value: 'Male', label: translateOption('Male') },
          { value: 'Female', label: translateOption('Female') },
          { value: 'Other', label: translateOption('Other') },
        ],
      },
      dateOfBirth: { type: 'date', placeholder: 'Select date of birth' },
      bloodGroup: {
        type: 'select',
        options: [
          { value: 'A+', label: 'A+' },
          { value: 'A-', label: 'A-' },
          { value: 'B+', label: 'B+' },
          { value: 'B-', label: 'B-' },
          { value: 'O+', label: 'O+' },
          { value: 'O-', label: 'O-' },
          { value: 'AB+', label: 'AB+' },
          { value: 'AB-', label: 'AB-' },
        ],
      },
      fathersName: { type: 'text', placeholder: "Enter father's name" },
      mothersName: { type: 'text', placeholder: "Enter mother's name" },
      spouseName: { type: 'text', placeholder: "Enter spouse name" },
      placeOfBirth: { type: 'text', placeholder: 'Enter place of birth' },
      maritalStatus: {
        type: 'select',
        options: [
          { value: 'Single', label: translateOption('Single') },
          { value: 'Married', label: translateOption('Married') },
        ],
      },
      dateOfMarriage: { type: 'date', placeholder: 'Select date of marriage' },
      passportNumber: { type: 'text', placeholder: 'Enter passport number' },
      aadhaarNumber: { type: 'number', placeholder: 'Enter Aadhaar number' },
      panNumber: { type: 'text', placeholder: 'Enter PAN number' },
      mobileNo: { type: 'number', placeholder: 'Enter mobile number' },
      officialMobileNo: {
        type: 'number',
        placeholder: 'Enter official mobile number',
        disabled: !canEditHrOnlyFields,
      },
      personalEmailId: { type: 'email', placeholder: 'Enter personal email' },
      address: { type: 'textarea', rows: 3, placeholder: 'Enter current address', colSpan: 24 },
      cityTown: { type: 'text', placeholder: 'Enter city/town' },
      pinCode: { type: 'number', placeholder: 'Enter pin code' },
      state: { type: 'text', placeholder: 'Enter state' },
      country: { type: 'text', placeholder: 'Enter country' },
      permanentAddress: {
        type: 'textarea',
        rows: 3,
        placeholder: 'Enter permanent address as per Aadhaar card',
        colSpan: 24,
      },
      emergencyContactPerson: { type: 'text', placeholder: 'Enter emergency contact person' },
      relation: { type: 'text', placeholder: 'Enter relation' },
      emergencyContactMobileNo: { type: 'number', placeholder: 'Enter emergency contact mobile number' },
      highestQualification: {
        type: 'select',
        options: [
          { value: '10th', label: translateOption('10th') },
          { value: '12th', label: translateOption('12th') },
          { value: 'Diploma', label: translateOption('Diploma') },
          { value: 'ITI', label: translateOption('ITI') },
          { value: 'Graduation', label: translateOption('Graduation') },
          { value: 'Post Graduation', label: translateOption('Post Graduation') },
          { value: 'Doctorate', label: translateOption('Doctorate') },
          { value: 'Other', label: translateOption('Other') },
        ],
      },
      qualificationName: {
        type: 'text',
        placeholder: 'e.g. B.Tech Computer Science',
      },
      yearOfPassing: { type: 'year', placeholder: 'Select year' },
      certifications: { type: 'textarea', rows: 4, placeholder: 'Enter certifications', colSpan: 24 },
      dateOfJoining: { type: 'date', placeholder: 'Select date of joining' },
      confirmationDate: { type: 'date', placeholder: 'Select confirmation date' },
      employmentStatus: {
        type: 'select',
        options: [
          { value: 'Probation', label: translateOption('Probation') },
          { value: 'Confirmed', label: translateOption('Confirmed') },
          { value: 'Contract', label: translateOption('Contract') },
        ],
      },
      employeeCode: { type: 'text', placeholder: 'Enter employee code', disabled: true },
      noticePeriod: { type: 'number', placeholder: 'Enter notice period (days)' },
      stateTax: { type: 'text', placeholder: 'Enter state tax' },
      compOffOvertime: {
        type: 'select',
        options: [
          { value: 'Yes', label: translateOption('Yes') },
          { value: 'No', label: translateOption('No') },
        ],
      },
      department: {
        type: 'select',
        options: [
          { value: 'Engineering', label: translateOption('Engineering') },
          { value: 'HR', label: translateOption('HR') },
          { value: 'Finance', label: translateOption('Finance') },
          { value: 'Sales', label: translateOption('Sales') },
          { value: 'Marketing', label: translateOption('Marketing') },
        ],
      },
      workLocation: { type: 'text', placeholder: 'Enter work location' },
      companyId: {
        type: 'select',
        options: companies.map((c) => ({ value: c.id, label: c.companyName })),
      },
      lastWorkingDate: { type: 'date', placeholder: 'Select last working date' },
      panCard: { type: 'document', accept: '.pdf,.jpg,.jpeg,.png' },
      aadhaarCard: { type: 'document', accept: '.pdf,.jpg,.jpeg,.png' },
      cancelCheque: { type: 'document', accept: '.pdf,.jpg,.jpeg,.png' },
      photo: { type: 'document', accept: '.jpg,.jpeg,.png' },
      passportPhotoPage: { type: 'document', accept: '.pdf,.jpg,.jpeg,.png' },
      passportAddressPage: { type: 'document', accept: '.pdf,.jpg,.jpeg,.png' },
      passportBackSide: { type: 'document', accept: '.pdf,.jpg,.jpeg,.png' },
      latestMarksheet: { type: 'document', accept: '.pdf,.jpg,.jpeg,.png' },
    }

    const configs = {}
    Object.keys(base).forEach((key) => {
      const cfg = { ...base[key], label: translateField(key) }
      if (cfg.type === 'select' && !cfg.placeholder) {
        const phKey = key === 'gender' ? 'selectGender' : key === 'bloodGroup' ? 'selectBloodGroup'
          : key === 'maritalStatus' ? 'selectMaritalStatus' : key === 'employmentStatus' ? 'selectEmploymentStatus'
          : key === 'department' ? 'selectDepartment' : key === 'companyId' ? 'selectCompany'
          : key === 'highestQualification' ? 'selectQualification' : 'selectOption'
        cfg.placeholder = t(`placeholders.${phKey}`)
      }
      if (EMPLOYMENT_FIELDS.includes(key) && !canEditHrOnlyFields) {
        cfg.disabled = true
      }
      configs[key] = cfg
    })
    return configs
  }, [locale, companies, translateField, translateOption, canEditHrOnlyFields])

  const groups = useMemo(() => [
    {
      title: translateGroup('basicInformation'),
      groupName: 'basicInformation',
      fields: [
        'fullName',
        'aboutMe',
        'gender',
        'dateOfBirth',
        'bloodGroup',
        // Contact details, merged in from the old Contact Information section
        'mobileNo',
        'officialMobileNo',
        'personalEmailId',
        'address',
        'cityTown',
        'pinCode',
        'state',
        'country',
        'permanentAddress',
      ],
    },
    {
      title: translateGroup('emergencyContact'),
      groupName: 'emergencyContact',
      fields: ['emergencyContactPerson', 'relation', 'emergencyContactMobileNo'],
    },
    {
      title: translateGroup('personalInformation'),
      groupName: 'personalInformation',
      fields: [
        'fathersName',
        'mothersName',
        'spouseName',
        'placeOfBirth',
        'maritalStatus',
        'dateOfMarriage',
        'passportNumber',
        'aadhaarNumber',
        'panNumber',
      ],
    },
    {
      title: translateGroup('educationalInformation'),
      groupName: 'educationalInformation',
      fields: [
        'highestQualification',
        'qualificationName',
        'yearOfPassing',
        'certifications',
      ],
    },
    {
      title: 'Employment Information',
      groupName: 'employmentInformation',
      hrOnly: true,
      fields: [
        'dateOfJoining',
        'confirmationDate',
        'employmentStatus',
        'employeeCode',
        'noticePeriod',
        'stateTax',
        'compOffOvertime',
        'department',
        'workLocation',
        'companyId',
        'lastWorkingDate',
      ],
    },
    {
      title: translateGroup('documents'),
      groupName: 'documents',
      fields: [
        'panCard',
        'aadhaarCard',
        'cancelCheque',
        'photo',
        'passportPhotoPage',
        'passportAddressPage',
        'passportBackSide',
        'latestMarksheet',
      ],
    },
  ], [translateGroup])

  const completion = useMemo(
    () => computeProfileCompletion(profileData, groups, fieldConfigs),
    [profileData, groups, fieldConfigs]
  )

  const incompleteGroups = Object.values(completion.perGroup).filter((g) => g.percent < 100)

  if (loading && !profileData) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">My Profile</h1>
            <p className="page-description">Manage your profile information</p>
          </div>
          <Dropdown
            menu={{
              items: [
                { key: 'en', label: 'English', onClick: () => setLocale('en') },
                { key: 'hi', label: 'हिन्दी', onClick: () => setLocale('hi') },
              ],
            }}
            placement="bottomRight"
          >
            <span style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <GlobalOutlined /> {locale === 'hi' ? 'हिन्दी' : 'English'}
            </span>
          </Dropdown>
        </div>

        <Card className="card-container" style={{ marginBottom: 24 }}>
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} sm={24} md={6} style={{ textAlign: 'center' }}>
              <AvatarUploader
                value={profileData?.basicInformation?.avatar}
                onUpload={handleAvatarUpload}
              />
            </Col>
            <Col xs={24} sm={24} md={11}>
              <div>
                <h2 style={{ marginBottom: 8, fontSize: 24, fontWeight: 600 }}>
                  {user?.name || 'User Name'}
                </h2>
                <div style={{ color: '#8c8c8c', marginBottom: 4 }}>
                  <strong>Email:</strong> {user?.email || 'N/A'}
                </div>
                <div style={{ color: '#8c8c8c', marginBottom: 4 }}>
                  <strong>Employee Code:</strong> {user?.employeeCode || 'N/A'}
                </div>
                <div style={{ color: '#8c8c8c', marginBottom: 4 }}>
                  <strong>Department:</strong> {user?.department || 'N/A'}
                </div>
                <div style={{ color: '#8c8c8c', marginBottom: 4 }}>
                  <strong>Report To:</strong> {user?.reportingManagerName || user?.reportTo || 'Head of Department'}
                </div>
                <div style={{ color: '#8c8c8c' }}>
                  <strong>Date of Joining:</strong> {profileData?.employmentInformation?.dateOfJoining ? dayjs(profileData.employmentInformation.dateOfJoining).format('DD MMM YYYY') : 'N/A'}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={24} md={7}>
              <div
                style={{
                  background: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: 12,
                  padding: '18px 12px',
                  textAlign: 'center',
                }}
              >
                <Progress
                  type="circle"
                  size={110}
                  percent={completion.percent}
                  strokeColor={completionColor(completion.percent)}
                  format={(percent) => (
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 600,
                        color: completionColor(completion.percent),
                      }}
                    >
                      {percent}%
                    </span>
                  )}
                />
                <div style={{ marginTop: 12, fontWeight: 600 }}>Profile Completeness</div>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                  {completion.filled} of {completion.total} details added
                </div>
                {incompleteGroups.length > 0 ? (
                  <Tooltip
                    title={
                      <div>
                        {incompleteGroups.map((group) => (
                          <div key={group.title}>
                            {group.title}: {group.total - group.filled} left
                          </div>
                        ))}
                      </div>
                    }
                  >
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: '#faad14',
                        cursor: 'help',
                        textDecoration: 'underline dotted',
                      }}
                    >
                      {completion.total - completion.filled} details pending
                    </div>
                  </Tooltip>
                ) : (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#52c41a' }}>
                    Your profile is complete
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Card>

        {groups.map((group) => (
          <ProfileGroupCard
            key={group.groupName}
            title={group.title}
            groupName={group.groupName}
            fields={group.fields}
            profileData={profileData || {}}
            onFieldUpdate={handleFieldUpdate}
            fieldConfigs={fieldConfigs}
            canEdit={group.hrOnly ? canEditHrOnlyFields : true}
            completion={completion.perGroup[group.groupName]}
          />
        ))}
      </div>
    </DashboardLayout>
  )
}

export default MyProfile
