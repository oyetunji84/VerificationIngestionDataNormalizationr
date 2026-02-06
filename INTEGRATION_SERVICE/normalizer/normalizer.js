const { normalizeImageField } = require('../utility/imageUtil');
const { getCurrentTimestamp,normalizeDateToStandard } = require('../utility/dateUtils');


const ninNormalize = async (ninResponse) => {
  try {
    console.log('Normalizing NIN response');
    
    const normalized = {
      firstName: ninResponse.firstName || null,
      middleName: ninResponse.middleName || null,
      lastName: ninResponse.lastName || null,
      dateOfBirth: ninResponse.dob || null,
      
      gender: ninResponse.gender === 'M' ? 'Male' : ninResponse.gender === 'F' ? 'Female' : null,
      
      email: ninResponse.email || null,
      phone: ninResponse.phone || null,
      address: ninResponse.residentialAddress || null,
      stateOfOrigin: ninResponse.stateOfOrigin || null,
      
      documentNumber: ninResponse.ninNumber || null,
      documentType: 'NIN',
      
      photo: await normalizeImageField(ninResponse.image, 'NIN'),
      
      verifiedAt: getCurrentTimestamp(),
      status: 'success'
    };
    
    
    if (ninResponse.image && !normalized.photo) {
      normalized.status = 'partial';
      console.log('NIN photo normalization failed, returning partial status');
    }
    
    console.log('NIN normalization complete', { status: normalized.status });
    
    return normalized;
    
  } catch (error) {
    console.log('Error normalizing NIN response', { error: error.message });
    throw new Error(`Failed to normalize NIN response: ${error.message}`);
  }
};


const bvnNormalize = async (bvnResponse) => {
  try {
    console.log('Normalizing BVN response');
    

    const normalized = {
      firstName: bvnResponse.first_name || null,
      middleName: bvnResponse.middle_name || null,
      lastName: bvnResponse.last_name || null,
      dateOfBirth: normalizeDateToStandard(bvnResponse.date_of_birth) || null,
      gender: bvnResponse.gender || null,
      email: bvnResponse.email_address || null,
      phone: bvnResponse.phone_number,
      address: null,
      stateOfOrigin: null,
      documentNumber: bvnResponse.bvn_number || null,
      documentType: 'BVN',
      photo: await normalizeImageField(bvnResponse.photograph, 'BVN'),
      verifiedAt: getCurrentTimestamp(),
      status: 'success'
    };
    
    if (bvnResponse.photograph && !normalized.photo) {
      normalized.status = 'partial';
      console.log('BVN photo fetch/conversion failed, returning partial status');
    }
    
    console.log('BVN normalization complete', { 
      status: normalized.status,
      photoFetched: !!normalized.photo
    });
    
    return normalized;
    
  } catch (error) {
    console.error('Error normalizing BVN response', { error: error.message });
    throw new Error(`Failed to normalize BVN response: ${error.message}`);
  }
};

const licenseNormalize = async (licenseResponse) => {
  try {
    console.log('Normalizing Drivers License response');
    
    const normalized = {
      firstName: licenseResponse.FirstName || null,
      middleName: licenseResponse.MiddleName || null,
      lastName: licenseResponse.LastName || null,
    dateOfBirth: normalizeDateToStandard(licenseResponse.BirthDate) || null,
     gender: licenseResponse.Gen?.toLowerCase() === 'm' ? 'Male' : 
              licenseResponse.Gen?.toLowerCase() === 'f' ? 'Female' : null,
      email: null,
      phone: null,    
      address: licenseResponse.ResidentialAddr || null,
      stateOfOrigin: licenseResponse.StateOfIssue || null,
      documentNumber: licenseResponse.LicenseNo || null,
      documentType: 'DRIVERS_LICENSE',
      photo: await normalizeImageField(licenseResponse.PhotoBase64, 'DRIVERS_LICENSE'),
      verifiedAt: getCurrentTimestamp(),
      status: 'success'
    };
    
    // Check if photo normalization failed
    if (licenseResponse.PhotoBase64 && !normalized.photo) {
      normalized.status = 'partial';
      console.log('Drivers License photo normalization failed, returning partial status');
    }
    
    console.log('Drivers License normalization complete', { status: normalized.status });
    
    return normalized;
    
  } catch (error) {
    console.log('Error normalizing Drivers License response', { error: error.message });
    throw new Error(`Failed to normalize Drivers License response: ${error.message}`);
  }
};



const extractFirstName = (givenNames) => {
  if (!givenNames) return null;
  const names = givenNames.trim().split(" ");
  return names[0] || null;
};


const extractMiddleName = (givenNames) => {
  if (!givenNames) return null;
  const names = givenNames.trim().split(" ");
  return names.length > 1 ? names.slice(1).join(' ') : null;
};


const passportNormalize = async (passportResponse) => {
  try {
    console.log('Normalizing Passport response');
    

    const normalized = {
      firstName: extractFirstName(passportResponse.givenNames) || null,
      middleName: extractMiddleName(passportResponse.givenNames) || null,
      lastName: passportResponse.surname || null,
      dateOfBirth: normalizeDateToStandard(passportResponse.dateOfBirth) || null,
      gender: passportResponse.sex || null,
      email: null,
      phone: null,
      address: null,
      stateOfOrigin: null,
      
      documentNumber: passportResponse.passportNumber || null,
      documentType: 'PASSPORT',
      

      photo: await normalizeImageField(passportResponse.photo, 'PASSPORT'),
      
      verifiedAt: getCurrentTimestamp(),
      status: 'success'
    };
    
    if (passportResponse.photo && !normalized.photo) {
      normalized.status = 'partial';
      console.log('Passport photo fetch/conversion failed, returning partial status');
    }
    
    console.log('Passport normalization complete', { 
      status: normalized.status,
      photoFetched: !!normalized.photo
    });
    
    return normalized;
    
  } catch (error) {
    console.log('Error normalizing Passport response', { error: error.message });
    throw new Error(`Failed to normalize Passport response: ${error.message}`);
  }
};

module.exports = {
  bvnNormalize, 
  ninNormalize,
  licenseNormalize,
  passportNormalize
};
