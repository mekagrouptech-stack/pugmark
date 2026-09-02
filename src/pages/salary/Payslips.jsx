import React, { useEffect } from 'react'
import { Card, Table, Button, Space } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPayslips } from '../../features/salary/salarySlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const Payslips = () => {
  const dispatch = useDispatch()
  const { payslips, loading } = useSelector((state) => state.salary)

  useEffect(() => {
    dispatch(fetchPayslips())
  }, [dispatch])

  const columns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: 'Net Salary',
      dataIndex: 'netSalary',
      key: 'netSalary',
      render: (amount) => `₹${amount}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<DownloadOutlined />}
          onClick={() => window.open(record.downloadUrl, '_blank')}
        >
          Download
        </Button>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Payslips</h1>
          <p className="page-description">Download your salary payslips</p>
        </div>

        <Card className="card-container">
          <Table
            columns={columns}
            dataSource={payslips}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default Payslips
