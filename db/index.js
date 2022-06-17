require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool ({
  "host": process.env.PGHOST,
  "user": process.env.USER,
  "database": process.env.DB,
  "password": process.env.PASSWORD,
  "port": process.env.PORT,
  "max": 200
});

pool.connect();

module.exports = pool;

