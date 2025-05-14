const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'prostovoljec-pb.mysql.database.azure.com',
  user: 'student_admin',
  password: 'Prostovoljec1',
  database: 'ProjektnaDB',
  port: 3306,
  ssl: {}
});

connection.connect((err) => {
  if (err) {
    console.error('Napaka pri povezavi:', err);
    return;
  }
  console.log('Povezan na MySQL bazo!');
});

module.exports = connection;