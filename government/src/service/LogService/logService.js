const AuditLog = require("../../../models/AuditLog.model");

class LogService {
  async getLogs(organizationId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find({ organizationId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-__v -organizationId");

    const total = await AuditLog.countDocuments({ organizationId });

    return {
      logs: logs.map((log) => ({
        id: log._id,
        type: log.verificationType,
        searchId: log.searchId,
        status: log.status,
        fieldsAccessed: log.fieldsAccessed,
        timestamp: log.timestamp,
      })),
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = new LogService();
