const pkg = require("pg")
const { drizzle } = require('drizzle-orm/node-postgres');
const schema= require("../model/schema/t")
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});


const db = drizzle(pool, { schema })
async function postgresDb() {
  try {

    const res = await pool.query('SELECT NOW()');
    const res1 = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables
        WHERE table_schema='public'
      `);
  
      console.log('✅ Tables in database:');
      console.log(res1)
      res1.rows.forEach(row => console.log(' -', row.table_name));
    console.log('Database connected:', res.rows[0]);
    console.log("POSTGRESS CONNECTED")
  } catch (err) {
    console.error('Database connection error:', err);
  } 
}

module.exports={postgresDb, db, pool}
