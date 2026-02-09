const mongoose = require("mongoose");

const bvnRecordSchema = new mongoose.Schema(
  {
    bvn_number:          { type: String, required: true, unique: true,  },
    first_name:          { type: String},
    middle_name:         { type: String, default: null },
    last_name:           { type: String },
    date_of_birth:       { type: String},          
    gender:              { type: String},          
    phone_number:        { type: String },
    email_address:       { type: String },
    enrollment_bank:     { type: String },
    enrollment_branch:   { type: String },
    registration_date:   { type: String },
    photograph_filename: { type: String},           
  },
  { timestamps: true }
);

module.exports = mongoose.model("BVNModel", bvnRecordSchema);
