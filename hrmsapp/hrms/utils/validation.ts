/**
 * Validation Schemas using Yup
 */

import * as yup from 'yup';

export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Invalid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export const forgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .email('Invalid email address')
    .required('Email is required'),
});

export const resetPasswordSchema = yup.object().shape({
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export const employeeSchema = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phoneNumber: yup.string().required('Phone number is required'),
  employeeId: yup.string().required('Employee ID is required'),
  dateOfJoining: yup.string().required('Date of joining is required'),
  department: yup.string().required('Department is required'),
  designation: yup.string().required('Designation is required'),
  companyId: yup.string().required('Company is required'),
});

export const companySchema = yup.object().shape({
  name: yup.string().required('Company name is required'),
  code: yup.string().required('Company code is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phoneNumber: yup.string().required('Phone number is required'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  country: yup.string().required('Country is required'),
  zipCode: yup.string().required('Zip code is required'),
  timezone: yup.string().required('Timezone is required'),
});

export const leaveApplicationSchema = yup.object().shape({
  leaveType: yup.string().required('Leave type is required'),
  startDate: yup.string().required('Start date is required'),
  endDate: yup.string().required('End date is required'),
  reason: yup.string().required('Reason is required'),
});

export const officeLocationSchema = yup.object().shape({
  name: yup.string().required('Location name is required'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  country: yup.string().required('Country is required'),
  latitude: yup.number().required('Latitude is required'),
  longitude: yup.number().required('Longitude is required'),
  radius: yup.number().min(50, 'Radius must be at least 50 meters').required('Radius is required'),
});

export const changePasswordSchema = yup.object().shape({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
});
