const { getHistoryByFilters,  } = require('../service/historyService');
const getHistory = async (req, res, next) => {
  try {
    const company = req.company;
    const {
      serviceType,
      startDate,
      endDate,
      status,
      page,
      limit
    } = req.validatedData;
    
    console.log('History request', { 
      companyId: company._id,
      filters: {  serviceType, startDate, endDate, status }
    });
    

    const filters = {
      apiKey: req.apiKey, 
      serviceType,
      startDate,
      endDate,
      status
    };
    
      Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) delete filters[key];
    });
    
    const result = await getHistoryByFilters(filters, { page, limit });
    
    console.log('History fetched successfully', {
      companyId: company._id,
      total: result.pagination.total,
      page: result.pagination.page
    });
    
    return res.status(200).json({
      success: true,
      message: 'History retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHistory,

};