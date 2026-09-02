require('dotenv').config()

const env = process.env.NODE_ENV || 'development'

const productionDb = {
  username: process.env.DB_USER || 'mekacom_pugmarkuser',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mekacom_pugmark',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  logging: false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
}

const localDb = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hrms_db',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
}

module.exports = {
  development: {
    ...localDb,
    logging: console.log,
  },
  test: {
    ...localDb,
    database: process.env.DB_NAME ? process.env.DB_NAME + '_test' : 'hrms_db_test',
    logging: false,
  },
  production: productionDb,
}

