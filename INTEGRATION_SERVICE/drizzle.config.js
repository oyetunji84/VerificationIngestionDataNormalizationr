module.exports = {
  dialect: "postgresql",
  schema: "./src/models/schema/t.js", // Path to your schema file
  out: "./src/model/migrations", // Where migrations will be stored
  dbCredentials: {
    url: "postgresql://Ibukun:password@localhost:5432/ibkverify",
  },
};
