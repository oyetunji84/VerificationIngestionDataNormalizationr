require('dotenv').config({ path: '../.env' });

const config = {

  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
   MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/integration-service', 
  NIN_PROVIDER_URL: process.env.NIN_PROVIDER_URL || 'http://localhost:4001',
  BVN_PROVIDER_URL: process.env.BVN_PROVIDER_URL || 'http://localhost:4002',
  DL_PROVIDER_URL: process.env.DL_PROVIDER_URL || 'http://localhost:4003',
  PASSPORT_PROVIDER_URL: process.env.PASSPORT_PROVIDER_URL || 'http://localhost:4004',
}

module.exports=config