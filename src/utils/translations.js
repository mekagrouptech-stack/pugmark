/**
 * Translations for profile field labels and dropdown options
 * Add more languages by extending the objects
 */

export const LOCALE_KEY = 'hrms_locale'

export const translations = {
  en: {
    // Field labels
    fields: {
      fullName: 'Name',
      aboutMe: 'About Me',
      gender: 'Gender',
      dateOfBirth: 'Date of Birth',
      bloodGroup: 'Blood Group',
      fathersName: "Father's Name",
      mothersName: "Mother's Name",
      spouseName: 'Spouse Name',
      placeOfBirth: 'Place of Birth',
      maritalStatus: 'Marital Status',
      dateOfMarriage: 'Date of Marriage',
      passportNumber: 'Passport Number',
      aadhaarNumber: 'Aadhaar Number',
      panNumber: 'PAN Number',
      mobileNo: 'Mobile No.',
      officialMobileNo: 'Official Mobile No.',
      personalEmailId: 'Personal Email ID',
      address: 'Current Address',
      cityTown: 'City / Town',
      pinCode: 'Pin Code',
      state: 'State',
      country: 'Country',
      permanentAddress: 'Permanent Address (As per Aadhaar Card)',
      emergencyContactPerson: 'Emergency Contact Person',
      relation: 'Relation',
      emergencyContactMobileNo: 'Emergency Contact Mobile No.',
      highestQualification: 'Highest Qualification',
      qualificationName: 'Qualification Name',
      yearOfPassing: 'Year of Passing',
      certifications: 'Certifications',
      dateOfJoining: 'Date of Joining',
      confirmationDate: 'Confirmation Date',
      employmentStatus: 'Employment Status',
      employeeCode: 'Employee Code',
      noticePeriod: 'Notice Period',
      stateTax: 'State Tax',
      compOffOvertime: 'Comp Off / Overtime',
      department: 'Department',
      workLocation: 'Work Location',
      companyId: 'Company',
      lastWorkingDate: 'Last Working Date',
      panCard: 'PAN Card',
      aadhaarCard: 'Aadhaar Card',
      cancelCheque: 'Cancel Cheque',
      photo: 'Photo (White Background)',
      passportPhotoPage: 'Passport - Photo Page',
      passportAddressPage: 'Passport - Address Page (Last Page)',
      passportBackSide: 'Passport - Back Side',
      latestMarksheet: 'Latest Marksheet',
      class: 'CLASS',
    },
    // Group titles
    groups: {
      basicInformation: 'Basic Information',
      personalInformation: 'Personal Information',
      contactInformation: 'Contact Information',
      emergencyContact: 'Emergency Contact',
      educationalInformation: 'Educational Information',
      employmentInformation: 'Employment Information',
      documents: 'Documents',
    },
    // Option labels (value -> translated label)
    options: {
      CLASS: 'CLASS',
      '1st class': '1st class',
      '2nd class': '2nd class',
      'Option 2': 'Option 2',
      Male: 'Male',
      Female: 'Female',
      Other: 'Other',
      Single: 'Single',
      Married: 'Married',
      Probation: 'Probation',
      Confirmed: 'Confirmed',
      Contract: 'Contract',
      Yes: 'Yes',
      No: 'No',
      '10th': '10th',
      '12th': '12th',
      Diploma: 'Diploma',
      ITI: 'ITI',
      Graduation: 'Graduation',
      'Post Graduation': 'Post Graduation',
      Doctorate: 'Doctorate (PhD)',
      Engineering: 'Engineering',
      HR: 'HR',
      Finance: 'Finance',
      Sales: 'Sales',
      Marketing: 'Marketing',
    },
    // Placeholders
    placeholders: {
      selectGender: 'Select gender',
      selectBloodGroup: 'Select blood group',
      selectMaritalStatus: 'Select marital status',
      selectEmploymentStatus: 'Select employment status',
      selectDepartment: 'Select department',
      selectCompany: 'Select company',
      selectQualification: 'Select qualification',
      selectOption: 'Select option',
    },
  },
  hi: {
    fields: {
      fullName: 'नाम',
      aboutMe: 'मेरे बारे में',
      gender: 'लिंग',
      dateOfBirth: 'जन्म तिथि',
      bloodGroup: 'रक्त समूह',
      fathersName: 'पिता का नाम',
      mothersName: 'माता का नाम',
      spouseName: 'जीवनसाथी का नाम',
      placeOfBirth: 'जन्म स्थान',
      maritalStatus: 'वैवाहिक स्थिति',
      dateOfMarriage: 'विवाह तिथि',
      passportNumber: 'पासपोर्ट नंबर',
      aadhaarNumber: 'आधार नंबर',
      panNumber: 'पैन नंबर',
      mobileNo: 'मोबाइल नंबर',
      officialMobileNo: 'ऑफिसियल मोबाइल नंबर',
      personalEmailId: 'Personal Email ID',
      address: 'वर्तमान पता',
      cityTown: 'शहर / कस्बा',
      pinCode: 'पिन कोड',
      state: 'राज्य',
      country: 'देश',
      permanentAddress: 'स्थायी पता (आधार कार्ड के अनुसार)',
      emergencyContactPerson: 'आपातकालीन संपर्क व्यक्ति',
      relation: 'संबंध',
      emergencyContactMobileNo: 'आपातकालीन संपर्क मोबाइल नंबर',
      highestQualification: 'उच्चतम योग्यता',
      qualificationName: 'योग्यता का नाम',
      yearOfPassing: 'पास करने का वर्ष',
      certifications: 'प्रमाणपत्र',
      dateOfJoining: 'जॉइनिंग की तारीख',
      confirmationDate: 'पुष्टि की तारीख',
      employmentStatus: 'रोजगार स्थिति',
      employeeCode: 'कर्मचारी कोड',
      noticePeriod: 'नोटिस अवधि (दिन)',
      stateTax: 'राज्य कर',
      compOffOvertime: 'Comp Off / Overtime',
      department: 'विभाग',
      workLocation: 'Work Location',
      companyId: 'कंपनी',
      lastWorkingDate: 'अंतिम कार्य दिवस',
      panCard: 'PAN Card',
      aadhaarCard: 'आधार कार्ड',
      cancelCheque: 'कैंसिल चेक',
      photo: 'फोटो (सफेद बैकग्राउंड)',
      passportPhotoPage: 'पासपोर्ट - फोटो पेज',
      passportAddressPage: 'पासपोर्ट - पता पेज (अंतिम पेज)',
      passportBackSide: 'पासपोर्ट - पिछला भाग',
      latestMarksheet: 'नवीनतम मार्कशीट',
      class: 'कक्षा',
    },
    groups: {
      basicInformation: 'मूल जानकारी',
      personalInformation: 'व्यक्तिगत जानकारी',
      contactInformation: 'संपर्क जानकारी',
      emergencyContact: 'आपातकालीन संपर्क',
      educationalInformation: 'शैक्षिक जानकारी',
      employmentInformation: 'रोजगार जानकारी',
      documents: 'दस्तावेज़',
    },
    options: {
      CLASS: 'कक्षा',
      '1st class': 'प्रथम श्रेणी',
      '2nd class': 'द्वितीय श्रेणी',
      'Option 2': 'विकल्प २',
      Male: 'पुरुष',
      Female: 'महिला',
      Other: 'अन्य',
      Single: 'अविवाहित',
      Married: 'विवाहित',
      Probation: 'प्रोबेशन',
      Confirmed: 'पुष्ट',
      Contract: 'कॉन्ट्रैक्ट',
      Yes: 'हाँ',
      No: 'नहीं',
      '10th': '10वीं',
      '12th': '12वीं',
      Diploma: 'डिप्लोमा',
      ITI: 'आईटीआई',
      Graduation: 'स्नातक',
      'Post Graduation': 'स्नातकोत्तर',
      Doctorate: 'डॉक्टरेट (पीएचडी)',
      Engineering: 'इंजीनियरिंग',
      HR: 'HR',
      Finance: 'वित्त',
      Sales: 'बिक्री',
      Marketing: 'मार्केटिंग',
    },
    placeholders: {
      selectGender: 'लिंग चुनें',
      selectBloodGroup: 'रक्त समूह चुनें',
      selectMaritalStatus: 'वैवाहिक स्थिति चुनें',
      selectEmploymentStatus: 'रोजगार स्थिति चुनें',
      selectDepartment: 'विभाग चुनें',
      selectCompany: 'कंपनी चुनें',
      selectQualification: 'योग्यता चुनें',
      selectOption: 'विकल्प चुनें',
    },
  },
}

export const getLocale = () => {
  try {
    return localStorage.getItem(LOCALE_KEY) || 'en'
  } catch {
    return 'en'
  }
}

export const setLocale = (locale) => {
  try {
    localStorage.setItem(LOCALE_KEY, locale)
    window.dispatchEvent(new Event('localechange'))
  } catch (e) {
    console.error('Failed to set locale:', e)
  }
}

export const t = (key, fallback = '') => {
  const locale = getLocale()
  const keys = key.split('.')
  let obj = translations[locale] || translations.en
  for (const k of keys) {
    obj = obj?.[k]
    if (obj === undefined) return fallback || key
  }
  return obj ?? fallback ?? key
}

export const translateField = (fieldKey) => t(`fields.${fieldKey}`) || fieldKey
export const translateGroup = (groupKey) => t(`groups.${groupKey}`) || groupKey
export const translateOption = (value) => t(`options.${value}`) || value
