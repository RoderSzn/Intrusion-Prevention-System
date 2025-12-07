const path = require('path');

module.exports = {
  development: {
    path: path.join(__dirname, '../database/ips.db'),
    options: {
      verbose: console.log
    }
  },
  production: {
    path: process.env.DB_PATH || path.join(__dirname, '../database/ips.db'),
    options: {}
  },
  test: {
    path: ':memory:',
    options: {}
  }
};