const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  },
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

connection.connect((err) => {
  if (err) {
    console.error('Napaka pri povezavi:', err);
    return;
  }
  console.log('Povezan na MySQL bazo!');
});

module.exports = connection;

