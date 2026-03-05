const JobModel = require("../models/JobModel");

async function createJob(jobData) {
  return JobModel.create(jobData);
}

async function findById(jobId) {
  return JobModel.findById(jobId);
}

async function findByIdAndCompanyId(jobId, companyId) {
  return JobModel.findOne({ _id: jobId, companyId });
}

async function updateById(jobId, patch) {
  return JobModel.findByIdAndUpdate(jobId, patch, {
    new: true,
  });
}

module.exports = {
  createJob,
  findById,
  findByIdAndCompanyId,
  updateById,
};
