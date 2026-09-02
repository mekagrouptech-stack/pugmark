require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { sequelize } = require('../config/database')

async function run() {
  try {
    await sequelize.authenticate()
    const dbName = sequelize.config.database

    // users.hr_head_id
    const [userCols] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'hr_head_id'`,
      { replacements: [dbName] }
    )
    if (userCols.length === 0) {
      await sequelize.query('ALTER TABLE users ADD COLUMN hr_head_id INT NULL')
      console.log('Added hr_head_id to users')
    }

    // leaves columns
    const [leaveCols] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'leaves' AND COLUMN_NAME = 'hr_head_id'`,
      { replacements: [dbName] }
    )
    if (leaveCols.length === 0) {
      await sequelize.query('ALTER TABLE leaves ADD COLUMN hr_head_id INT NULL')
      await sequelize.query('ALTER TABLE leaves ADD COLUMN manager_approved_by INT NULL')
      await sequelize.query('ALTER TABLE leaves ADD COLUMN manager_approved_at DATETIME NULL')
      console.log('Added hr_head_id, manager_approved_by, manager_approved_at to leaves')
    } else {
      console.log('Leaves columns already exist')
    }
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}
run()
