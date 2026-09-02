module.exports = (sequelize, DataTypes) => {
  const DAR = sequelize.define(
    'DAR',
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
        references: {
          model: 'users',
          key: 'id',
        },
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: 'Date of the activity (YYYY-MM-DD)',
      },
      projectName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'project_name',
      },
      workLocation: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'work_location',
      },
      workLocationLatitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        field: 'work_location_latitude',
      },
      workLocationLongitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        field: 'work_location_longitude',
      },
      activityDescription: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'activity_description',
      },
      taskCategory: {
        type: DataTypes.ENUM('EXECUTION', 'PLANNING', 'MEETING', 'INSPECTION', 'DOCUMENTATION', 'OTHER'),
        allowNull: false,
        field: 'task_category',
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'start_time',
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'end_time',
      },
      totalHours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'total_hours',
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      issuesFaced: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'issues_faced',
      },
      status: {
        type: DataTypes.ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'submitted_at',
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'approved_by',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'approved_at',
      },
      rejectedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'rejected_by',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      rejectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'rejected_at',
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'rejection_reason',
      },
      managerComments: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'manager_comments',
      },
    },
    {
      tableName: 'dars',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['user_id', 'date'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['date'],
        },
        {
          fields: ['approved_by'],
        },
      ],
    }
  )

  // Associations
  DAR.associate = (models) => {
    DAR.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    })
    DAR.belongsTo(models.User, {
      foreignKey: 'approvedBy',
      as: 'approver',
    })
    DAR.belongsTo(models.User, {
      foreignKey: 'rejectedBy',
      as: 'rejector',
    })
  }

  return DAR
}
