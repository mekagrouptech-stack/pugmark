module.exports = (sequelize, DataTypes) => {
  const MaintenanceTask = sequelize.define('MaintenanceTask', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED'), allowNull: false, defaultValue: 'PENDING' },
    priority: { type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'), allowNull: false, defaultValue: 'MEDIUM' },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'due_date' },
    assignedTo: { type: DataTypes.INTEGER, allowNull: true, field: 'assigned_to', references: { model: 'users', key: 'id' } },
    createdBy: { type: DataTypes.INTEGER, allowNull: true, field: 'created_by', references: { model: 'users', key: 'id' } },
  }, { tableName: 'maintenance_tasks', timestamps: true, underscored: true })
  MaintenanceTask.associate = (models) => {
    MaintenanceTask.belongsTo(models.User, { foreignKey: 'assignedTo', as: 'assignedUser' })
    MaintenanceTask.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' })
  }
  return MaintenanceTask
}
