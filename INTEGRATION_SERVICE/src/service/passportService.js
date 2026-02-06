const { makeProviderRequest } = require('../../utility/httpClient');
const config = require('../../config/environment');


const verifyPassport = async (passportNumber) => {
  const url = `${config.PASSPORT_PROVIDER_URL}/verify/passport`;
  const payload = { passport_number: passportNumber };
  
  console.log('Calling Passport provider', { passportNumber });
  
  const response = await makeProviderRequest(url, payload, {
    providerName: 'Passport Provider',
  });
  
  // Return the data from provider response
  if (response.success && response.data) {
    return response.data;
  }
  
  throw new Error('Invalid response from Passport provider');
};

module.exports = {
  verifyPassport
};