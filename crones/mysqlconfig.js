const mysql = require('mysql2');

function createConnection(host, user, database, password) {
  return mysql.createConnection({
    host,
    user,
    database,
    password,
    port:3306
  });
}

exports.createConnection = createConnection



