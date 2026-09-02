module.exports = (sequelize, DataTypes) => {
  const LoginOtp = sequelize.define(
    'LoginOtp',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
      },
      // Kept alongside userId so a login attempt can still be traced in the
      // logs after the account is renamed or deleted.
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      // The code itself is never stored. A leaked database row must not be
      // enough to sign in as somebody, so this holds a bcrypt hash exactly the
      // way a password would.
      otpHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'otp_hash',
      },
      // Epoch milliseconds, NOT a DATETIME. This connection runs with
      // `dateStrings: true` and `timezone: '+00:00'`, so a DATE column comes
      // back as a bare UTC string that Node then re-parses as local time — a
      // 5.5h shift under IST that made every code expire the instant it was
      // issued. An integer cannot be misparsed.
      issuedAtMs: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'issued_at_ms',
      },
      expiresAtMs: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'expires_at_ms',
      },
      // Counted server-side so a 6-digit code cannot be brute-forced: the row is
      // burned after a handful of wrong guesses regardless of how fast they come.
      attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      // Set the moment a code is accepted, which is what makes it single-use.
      consumedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'consumed_at',
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'ip_address',
      },
    },
    {
      tableName: 'login_otps',
      timestamps: true,
      underscored: true,
      indexes: [{ fields: ['user_id'] }, { fields: ['email'] }],
    }
  )

  LoginOtp.associate = (models) => {
    LoginOtp.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
  }

  return LoginOtp
}
