import React from 'react'
import { Card, Upload, Button, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import DashboardLayout from '../../layouts/DashboardLayout'

const ImportTimesheet = () => {
  const props = {
    name: 'file',
    action: '/api/timesheet/import',
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`)
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`)
      }
    },
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Import Timesheet</h1>
          <p className="page-description">Upload timesheet data from Excel/CSV file</p>
        </div>

        <Card className="card-container" style={{ maxWidth: 600 }}>
          <Upload {...props}>
            <Button icon={<UploadOutlined />}>Click to Upload</Button>
          </Upload>
          <p style={{ marginTop: 16, color: '#8c8c8c' }}>
            Supported formats: .xlsx, .xls, .csv
          </p>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default ImportTimesheet
