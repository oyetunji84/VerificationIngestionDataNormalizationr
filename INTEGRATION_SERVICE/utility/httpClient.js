const axios = require('axios');

const makeProviderRequest = async (url, payload, providerName) => {
  
  try {
    console.log(`Calling provider: ${providerName}`, { url, payload });
    
    const response = await axios.post(url, payload, {

      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`Provider response received: ${providerName}`, { 
      status: response.status,
      success: response.data?.success 
    });
    
    return response.data;
    
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 404) {
        console.log(`Record not found in ${providerName}`, { errorData });
      }
      
      console.log(`Provider error: ${providerName}`, { 
        status, 
        errorData 
      });
      
    }
    
    // Unknown error
    console.error(`Unknown provider error: ${providerName}`, { error: error.message });
   throw error(`Unknown provider error: ${providerName}`, { error: error.message })
  }
};

module.exports = {
  makeProviderRequest,
  };