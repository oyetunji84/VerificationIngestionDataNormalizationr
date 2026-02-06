const { makeProviderRequest } = require('../../utility/httpClient');
const config = require('../../config/environment');


const verifyNIN = async (nin) => {
  const url = `${config.NIN_PROVIDER_URL}/verify/NIN`;
  const payload = { nin };
  
  console.log('Calling NIN provider', { nin });
  
  const response = await makeProviderRequest(url, payload, {
    providerName: 'NIN Provider',
  });
  
  if (response.success && response.data) {
    return response.data;
  }
  
  throw new Error('Invalid response from NIN provider');
};

module.exports = {
  verifyNIN
};