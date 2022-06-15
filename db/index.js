require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool ({
  "user": process.env.USER,
  "database": process.env.DB,
  "password": process.env.PASSWORD,
  "max": 100
});

pool.connect();

module.exports = pool;

