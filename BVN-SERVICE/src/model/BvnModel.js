const mongoose = require("mongoose");

const bvnRecordSchema = new mongoose.Schema(
  {
    bvn_number:          { type: String, required: true, unique: true,  },
    first_name:          { type: String, required: true },
    middle_name:         { type: String, default: null },
    last_name:           { type: String, required: true },
    date_of_birth:       { type: String, required: true },          
    gender:              { type: String, required: true ,  enum: ['Male', 'Female']},          
    phone_number:        { type: String, default: null },
    email_address:       { type: String, default: null },
    enrollment_bank:     { type: String, default: null },
    enrollment_branch:   { type: String, default: null },
    registration_date:   { type: String, default: null },
    photograph_filename: { type: String, default: null },           
  },
  { timestamps: true }
);

module.exports = mongoose.model("BVNModel", bvnRecordSchema);
