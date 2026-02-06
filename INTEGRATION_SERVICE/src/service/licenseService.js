const { makeProviderRequest } = require('../../utility/httpClient');
const config = require('../../config/environment')

const verifyLicense = async (licenseNumber) => {
  const url = `${config.DL_PROVIDER_URL}/verify`;
  const payload = { license_number: licenseNumber };
  
  console.log('Calling Drivers License provider', { licenseNumber });
  
  const response = await makeProviderRequest(url, payload, {
    providerName: 'Drivers License Provider',
  });
  

  if (response.success && response.data) {
    return response.data;
  }
  
  throw new Error('Invalid response from Drivers License provider');
};

module.exports = {
  verifyLicense
};