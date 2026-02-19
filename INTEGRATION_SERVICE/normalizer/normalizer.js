const { normalizeImage } = require('../utility/imageUtil');
const moment = require('moment');
const normalizeDateToStandard = (dateString) => {
    if (!dateString) return null;
    return moment(dateString).format('DD-MM-YYYY')
}
const normalizeGender =(value) => {
        if (!value) return null;
        const lower = value.toLowerCase();
        return lower === 'm' ? 'Male' : lower === 'f' ? 'Female' : null;
      }
const extractFirstName = (givenNames) => givenNames ? givenNames.split(' ')[0] || null : null;
const extractMiddleName = (givenNames) => {
  if (!givenNames) return null;
  const parts = givenNames.trim().split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ') : null;
};
const documentTypeConfigs = {
  NIN: {
    fields: {
      firstName: 'firstName',
      middleName: 'middleName',
      lastName: 'lastName',
      dateOfBirth: { source: 'dateOfBirth', transform: normalizeDateToStandard },
      gender: { source: 'gender', transform: normalizeGender },
      email: 'email',
      phone: 'phone',
      address: 'residentialAddress',
      stateOfOrigin: 'stateOfOrigin',
      documentNumber: 'ninNumber',
    },
    photoField: 'image',
    documentType: 'NIN',
  },
  BVN: {
    fields: {
      firstName: 'first_name',
      middleName: 'middle_name',
      lastName: 'last_name',
      dateOfBirth: { source: 'date_of_birth', transform: normalizeDateToStandard },
      gender: { source: 'gender', transform: normalizeGender },
      email: 'email_address',
      phone: 'phone_number',
      address: null,
      stateOfOrigin: null,
      documentNumber: 'bvn_number',
    },
    photoField: 'photograph',
    documentType: 'BVN',
  },
  DRIVERS_LICENSE: {
    fields: {
      firstName: 'FirstName',
      middleName: 'MiddleName',
      lastName: 'LastName',
      dateOfBirth: { source: 'BirthDate', transform: normalizeDateToStandard },
      gender: { source: 'Gen', transform: normalizeGender },
      email: null,
      phone: null,
      address: 'ResidentialAddr',
      stateOfOrigin: 'StateOfIssue',
      documentNumber: 'LicenseNo',
    },
    photoField: 'PhotoBase64',
    documentType: 'DRIVERS_LICENSE',
  },
  PASSPORT: {
    fields: {
      firstName: { source: 'givenNames', transform: extractFirstName },
      middleName: { source: 'givenNames', transform: extractMiddleName },
      lastName: 'surname',
      dateOfBirth: { source: 'dateOfBirth', transform: normalizeDateToStandard },
      gender: 'sex',
      email: null,
      phone: null,
      address: null,
      stateOfOrigin: null,
      documentNumber: 'passportNumber',
    },
    photoField: 'photo',
    documentType: 'PASSPORT',
  }
};
const normalizeDocument = async (documentType, response) => {
  try {
    console.log(`Normalizing ${documentType} response`);

    const config = documentTypeConfigs[documentType];
    if (!config) {
      throw new Error(`Unsupported document type: ${documentType}`);
    }

    const normalized = {
      firstName: null,
      middleName: null,
      lastName: null,
      dateOfBirth: null,
      gender: null,
      email: null,
      phone: null,
      address: null,
      stateOfOrigin: null,
      documentNumber: null,
      documentType: config.documentType,
      photo: null,
    };

    // Map fields using config
    for (const [targetField, sourceDef] of Object.entries(config.fields)) {
      if (sourceDef === null) {
        normalized[targetField] = null;
        continue;
      }

      let sourceKey, transform;
      if (typeof sourceDef === 'string') {
        sourceKey = sourceDef;
        transform = null;
      } else {
        sourceKey = sourceDef.source;
        transform = sourceDef.transform;
      }

      let value = response[sourceKey] !== undefined ? response[sourceKey] : null;

      if (transform && value !== null) {
        try {
          value = transform(value);
        } catch (err) {
          console.log(`Transform failed for ${targetField}`, { error: err.message });
          value = null;
        }
      }

      normalized[targetField] = value;
    }

    // Handle photo
    const photoField = config.photoField;
    if (photoField && response[photoField]) {
      try {
        normalized.photo = await normalizeImage(response[photoField]);
      } catch (err) {
        console.log(`Photo normalization failed for ${documentType}`, { error: err.message });
        normalized.photo = null;
      }
    }

    console.log(`${documentType} normalization complete`);
    return normalized;
  } catch (error) {
    console.log(`Error normalizing ${documentType} response`, { error: error.message });
  }
};
module.exports = { normalizeDocument };