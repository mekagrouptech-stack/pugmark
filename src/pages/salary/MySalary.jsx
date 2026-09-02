import React, { useEffect, useState } from 'react'
import { Card, Empty, Spin, Button, message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSalary } from '../../features/salary/salarySlice'
import DashboardLayout from '../../layouts/DashboardLayout'
import { generateSalarySlipPdf } from '../../utils/salarySlipTemplate'
import SalaryStructureView, { COLORS } from '../../components/salary/SalaryStructureView'

const MySalary = () => {
  const dispatch = useDispatch()
  const { salary, loading } = useSelector((state) => state.salary)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    dispatch(fetchSalary())
  }, [dispatch])

  const s = salary || {}
  const hasStructure = s.hasStructure && (s.monthlyCTC || 0) > 0

  const handleDownload = async () => {
    try {
      setDownloading(true)
      await generateSalarySlipPdf(s)
      message.success('Salary slip downloaded')
    } catch (err) {
      message.error('Could not generate salary slip')
      // eslint-disable-next-line no-console
      console.error('Salary slip generation failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div
          className="page-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}
        >
          <div>
            <h1 className="page-title">My Salary</h1>
            <p className="page-description">Your CTC salary structure &amp; take-home breakdown</p>
          </div>
          {hasStructure && (
            <Button type="primary" icon={<DownloadOutlined />} loading={downloading} onClick={handleDownload}>
              Download Salary Slip
            </Button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : !hasStructure ? (
          <Card className="card-container">
            <Empty
              description={
                <span style={{ color: COLORS.sub }}>
                  Your salary structure has not been configured yet. Please contact HR.
                </span>
              }
            />
          </Card>
        ) : (
          <SalaryStructureView structure={s} />
        )}
      </div>
    </DashboardLayout>
  )
}

export default MySalary
