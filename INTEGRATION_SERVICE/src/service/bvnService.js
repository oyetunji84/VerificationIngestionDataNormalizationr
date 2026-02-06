const { makeProviderRequest } = require('../../utility/httpClient');
const config = require('../../config/environment');


const verifyBVN = async (bvn) => {
  const url = `${config.BVN_PROVIDER_URL}/verify/BVN`;
  const payload = { bvn };
  
  console.log('Calling BVN provider', { bvn });
  
  const response = await makeProviderRequest(url, payload, {
    providerName: 'BVN Provider',
  });
  

  if (response.success && response.data) {
    return response.data;
  }
  
  throw new Error('Invalid response from BVN provider');
};

module.exports = {
  verifyBVN
};