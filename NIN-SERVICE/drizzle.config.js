
module.exports={
  dialect: "postgresql",
  schema: "./src/model/schema/t.js", // Path to your schema file
  out: "./src/model/migrations",             // Where migrations will be stored
  dbCredentials: {
    url: "postgresql://Ibukun:password@localhost:5432/Bank",
  },
};