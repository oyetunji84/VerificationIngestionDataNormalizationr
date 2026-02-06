
const History = require('../models/historyModel');

const logVerification = async (logData) => {
  try {
    console.log("history being saved")
    const {
      apiKey,
      requestId,
      serviceType,
      status,
      errorMessage = null,
      errorCode = null,

    } = logData;
    
    const historyEntry = new History({
      apiKey,
      requestId,
      serviceType,
      requestedAt: new Date(),
      status,
      errorMessage,
      errorCode,
    });
    
    const saved = await historyEntry.save();
    
    console.log('Verification logged to history', { 
      serviceType,
      status 
    });
    
    return saved;
    
  } catch (error) {
    console.log('Failed to log verification to history', { 
      error: error.message,
      requestId: logData.requestId 
    });
    return null;
  }
};
const getHistoryByFilters = async (filters, pagination = {}) => {
  try {
    const {
      apiKey,
      serviceType,
      startDate,
      endDate,
      status
    } = filters;
    
    const {
      page = 1,
      limit = 20
    } = pagination;
    
    const query = {};
    
    if (apiKey) query.apiKey = apiKey;
    if (serviceType) query.serviceType = serviceType;
    if (status) query.status = status;
    
      if (startDate || endDate) {
      query.requestedAt = {};
      if (startDate) query.requestedAt.$gte = new Date(startDate);
      if (endDate) query.requestedAt.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const [results, total] = await Promise.all([
      History.find(query)
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean(),
      History.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    console.log('History query executed', { 
      filters, 
      page, 
      limit, 
      total, 
      returned: results.length 
    });
    
    return {
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
    
  } catch (error) {
    console.log('Error fetching history', { error: error.message, filters });
    throw new Error(`Failed to fetch history: ${error.message}`);
  }
};


const getVerificationStats = async (filters = {}) => {
  try {
    const {
      apiKey,
      serviceType,
      startDate,
      endDate
    } = filters;
    
    const matchQuery = {};
    
    if (apiKey) matchQuery.apiKey = apiKey;
    if (serviceType) matchQuery.serviceType = serviceType;
    
    if (startDate || endDate) {
      matchQuery.requestedAt = {};
      if (startDate) matchQuery.requestedAt.$gte = new Date(startDate);
      if (endDate) matchQuery.requestedAt.$lte = new Date(endDate);
    }
    
        const stats = await History.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalVerifications: { $sum: 1 },
          byService: {
            $push: {
              serviceType: '$serviceType',
              status: '$status'
            }
          },
          byStatus: {
            $push: '$status'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalVerifications: 1,
          byService: 1,
          byStatus: 1
        }
      }
    ]);
    
    if (stats.length === 0) {
      return {
        totalVerifications: 0,
        avgResponseTime: 0,
        byService: {},
        byStatus: {}
      };
    }
    
    const result = stats[0];
      
    const serviceCount = {};
    result.byService.forEach(item => {
      if (!serviceCount[item.serviceType]) {
        serviceCount[item.serviceType] = 0;
      }
      serviceCount[item.serviceType]++;
    });
    
    const statusCount = {};
    result.byStatus.forEach(status => {
      if (!statusCount[status]) {
        statusCount[status] = 0;
      }
      statusCount[status]++;
    });
    
    console.log('Statistics calculated', { totalVerifications: result.totalVerifications });
    
    return {
      totalVerifications: result.totalVerifications,
      avgResponseTime: result.avgResponseTime,
      byService: serviceCount,
      byStatus: statusCount
    };
    
  } catch (error) {
    console.log('Error calculating statistics', { error: error.message });
    throw new Error(`Failed to calculate statistics: ${error.message}`);
  }
};

module.exports = {
  logVerification,
  getHistoryByFilters,
  getVerificationStats
};