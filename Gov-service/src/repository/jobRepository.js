const Job = require("../model/JobModel");

const findJobByIdAndUpdate = async (jobId, state, retry_count, meta) => {
  try {
    const job = await Job.findByIdAndUpdate(jobId, {
      status: state,
      retry_count: retry_count,
      ...(meta && { meta }),
    });
    return job ?? null;
  } catch (err) {
    console.log(err);
    throw err;
  }
};
const findJobById = async (id) => {
  try {
    const job = await Job.findOne({ UserId: id });
    return job ?? null;
  } catch (error) {
    console.error("Error finding job by id:", error);
    throw error;
  }
};

const createJob = async (data) => {
  try {
    const job = await Job.create(data);
    return job ?? null;
  } catch (error) {
    console.error("Error creating job:", error);
    throw error;
  }
};

module.exports = {
  findJobById,
  createJob,
  findJobByIdAndUpdate,
};
