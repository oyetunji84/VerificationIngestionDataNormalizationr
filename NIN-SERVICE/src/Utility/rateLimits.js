module.exports = {
  endpoints: {
    'verify-nin': {
      capacity: 1000,    // 1000 requests burst
      leakRate: 17,      // 17 req/sec = 1020/min
      description: 'NIN verification endpoint'
    },
  },
  

  default: {
    capacity: 300,
    leakRate: 5
  }
};