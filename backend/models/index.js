const { Sequelize, DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

// Import models
const User = require('./User')
const Office = require('./Office')
const AttendanceRecord = require('./AttendanceRecord')
const AttendanceLog = require('./AttendanceLog')
const UserOffice = require('./UserOffice')
const UserProfile = require('./UserProfile')
const BasicInformation = require('./BasicInformation')
const PersonalInformation = require('./PersonalInformation')
const ContactInformation = require('./ContactInformation')
const EducationalInformation = require('./EducationalInformation')
const EmploymentInformation = require('./EmploymentInformation')
const Document = require('./Document')
const Payroll = require('./Payroll')
const Company = require('./Company')
const ChatMessage = require('./ChatMessage')
const DAR = require('./DAR')
const DarProject = require('./DarProject')
const DarClient = require('./DarClient')
const ReimbursementRequest = require('./ReimbursementRequest')
const ReimbursementExpenseItem = require('./ReimbursementExpenseItem')
const Leave = require('./Leave')
const LeaveApproval = require('./LeaveApproval')
const RolePermission = require('./RolePermission')
const AttendanceRequest = require('./AttendanceRequest')
const ExtraEarning = require('./ExtraEarning')
const InvoiceEmployee = require('./InvoiceEmployee')
const EmployeeInvoice = require('./EmployeeInvoice')
const SalaryHead = require('./SalaryHead')
const SalaryStructure = require('./SalaryStructure')
const MaintenanceTask = require('./MaintenanceTask')
const Role = require('./Role')
const Department = require('./Department')
const Notice = require('./Notice')
const NoticeRecipient = require('./NoticeRecipient')
const LeaveBalanceAdjustment = require('./LeaveBalanceAdjustment')
const LoginOtp = require('./LoginOtp')

// Initialize models
const models = {
  User: User(sequelize, DataTypes),
  Office: Office(sequelize, DataTypes),
  AttendanceRecord: AttendanceRecord(sequelize, DataTypes),
  AttendanceLog: AttendanceLog(sequelize, DataTypes),
  AttendanceRequest: AttendanceRequest(sequelize, DataTypes),
  UserOffice: UserOffice(sequelize, DataTypes),
  UserProfile: UserProfile(sequelize, DataTypes),
  BasicInformation: BasicInformation(sequelize, DataTypes),
  PersonalInformation: PersonalInformation(sequelize, DataTypes),
  ContactInformation: ContactInformation(sequelize, DataTypes),
  EducationalInformation: EducationalInformation(sequelize, DataTypes),
  EmploymentInformation: EmploymentInformation(sequelize, DataTypes),
  Document: Document(sequelize, DataTypes),
  Payroll: Payroll(sequelize, DataTypes),
  Company: Company(sequelize, DataTypes),
  ChatMessage: ChatMessage(sequelize, DataTypes),
  DAR: DAR(sequelize, DataTypes),
  DarProject: DarProject(sequelize, DataTypes),
  DarClient: DarClient(sequelize, DataTypes),
  ReimbursementRequest: ReimbursementRequest(sequelize, DataTypes),
  ReimbursementExpenseItem: ReimbursementExpenseItem(sequelize, DataTypes),
  Leave: Leave(sequelize, DataTypes),
  LeaveApproval: LeaveApproval(sequelize, DataTypes),
  RolePermission: RolePermission(sequelize, DataTypes),
  ExtraEarning: ExtraEarning(sequelize, DataTypes),
  InvoiceEmployee: InvoiceEmployee(sequelize, DataTypes),
  EmployeeInvoice: EmployeeInvoice(sequelize, DataTypes),
  SalaryHead: SalaryHead(sequelize, DataTypes),
  SalaryStructure: SalaryStructure(sequelize, DataTypes),
  MaintenanceTask: MaintenanceTask(sequelize, DataTypes),
  Role: Role(sequelize, DataTypes),
  Department: Department(sequelize, DataTypes),
  Notice: Notice(sequelize, DataTypes),
  NoticeRecipient: NoticeRecipient(sequelize, DataTypes),
  LeaveBalanceAdjustment: LeaveBalanceAdjustment(sequelize, DataTypes),
  LoginOtp: LoginOtp(sequelize, DataTypes),
}

// Define associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models)
  }
})

module.exports = {
  sequelize,
  Sequelize,
  ...models,
}
