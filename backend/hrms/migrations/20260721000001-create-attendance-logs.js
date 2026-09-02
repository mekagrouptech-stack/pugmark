'use strict'

/**
 * Biometric attendance (eSSL AIFace Orcus / ZKTeco ADMS "Push" protocol).
 *
 * Purely additive:
 *   - creates `attendance_logs` for raw device punches
 *   - adds `users.device_pin` (the User ID enrolled ON the device), which is
 *     what the terminal sends us. It is NOT the same thing as `employee_code`
 *     unless you happen to enrol them identically.
 *
 * Raw device punches are kept separate from `attendance_records` (the GPS/app
 * punch table) on purpose: this is an immutable audit trail of what the
 * terminal reported, deduped at the DB level.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendance_logs', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      device_serial: {
        type: Sequelize.STRING(64),
        allowNull: false,
        comment: 'SN query param sent by the terminal',
      },
      device_pin: {
        type: Sequelize.STRING(32),
        allowNull: false,
        comment: 'User ID enrolled on the device; joins to users.device_pin',
      },
      punch_time: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Device local wall-clock time, stored verbatim (no TZ shift)',
      },
      status: {
        type: Sequelize.TINYINT,
        allowNull: false,
        comment: '0=in,1=out,2=break-out,3=break-in,4=OT-in,5=OT-out',
      },
      verify_mode: {
        type: Sequelize.TINYINT,
        allowNull: false,
        comment: '1=fingerprint,4=card,15=face',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      // MUST match the rest of the schema (users is utf8mb4_unicode_ci).
      // A bare `DEFAULT CHARSET=utf8mb4` resolves to utf8mb4_general_ci on
      // MariaDB, and the users.device_pin join then dies with
      // "Illegal mix of collations".
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    })

    // Idempotency guard: the terminal re-sends whole batches whenever it does
    // not receive our `OK` reply, so INSERT IGNORE + this key is what keeps
    // duplicate punches out of the table.
    await queryInterface.addIndex('attendance_logs', ['device_serial', 'device_pin', 'punch_time', 'status'], {
      unique: true,
      name: 'uq_punch',
    })
    await queryInterface.addIndex('attendance_logs', ['device_pin', 'punch_time'], {
      name: 'idx_pin_time',
    })

    // Repair path for installs created before the collate fix above.
    await queryInterface.sequelize.query(
      'ALTER TABLE attendance_logs CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
    )

    // users.device_pin — nullable so existing rows are untouched.
    const usersTable = await queryInterface.describeTable('users')
    if (!usersTable.device_pin) {
      await queryInterface.addColumn('users', 'device_pin', {
        type: Sequelize.STRING(32),
        allowNull: true,
        comment: 'Biometric terminal User ID (enrolled on the eSSL device)',
      })
      await queryInterface.addIndex('users', ['device_pin'], {
        unique: true,
        name: 'uq_users_device_pin',
      })
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('attendance_logs')
    const usersTable = await queryInterface.describeTable('users')
    if (usersTable.device_pin) {
      await queryInterface.removeIndex('users', 'uq_users_device_pin')
      await queryInterface.removeColumn('users', 'device_pin')
    }
  },
}
