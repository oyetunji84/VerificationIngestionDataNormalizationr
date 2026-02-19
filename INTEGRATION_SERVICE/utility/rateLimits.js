module.exports = {
  endpoints: {
    'nin': {
      capacity: 1000,    // 1000 requests burst
      leakRate: 17,      // 17 req/sec = 1020/min
      description: 'NIN verification endpoint'
    },
    'bvn': {
      capacity: 500,     // 500 requests burst
      leakRate: 8.5,     // 8.5 req/sec = 510/min
      description: 'BVN verification endpoint'
    },
    'drivers-license': {
      capacity: 300,     // 300 requests burst
      leakRate: 5,       // 5 req/sec = 300/min
      description: 'Driver\'s license verification endpoint'
    },
    'passport': {
      capacity: 200,     // 200 requests burst
      leakRate: 3.3,     // 3.3 req/sec = 198/min
      description: 'Passport verification endpoint'
    }   
  },
  

  default: {
    capacity: 300,
    leakRate: 5
  }
};