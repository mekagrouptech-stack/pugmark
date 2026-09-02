import React, { useState } from 'react'
import { Upload, Button, Image, Space, message } from 'antd'
import { UploadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useDispatch } from 'react-redux'
import { uploadDocument } from '../../features/profile/profileSlice'

const DocumentUploader = ({
  label,
  fieldName,
  groupName,
  value,
  multiple = false,
  accept = '.pdf,.jpg,.jpeg,.png',
}) => {
  const dispatch = useDispatch()
  const [fileList, setFileList] = useState(
    value
      ? (Array.isArray(value) ? value : [value]).map((url, index) => ({
          uid: `-${index}`,
          name: url.split('/').pop() || 'document',
          status: 'done',
          url,
        }))
      : []
  )

  const handleUpload = async (file) => {
    const isPDF = file.type === 'application/pdf'
    const isImage = file.type.startsWith('image/')
    const isLt10M = file.size / 1024 / 1024 < 10

    if (!isPDF && !isImage) {
      message.error('You can only upload PDF or Image files!')
      return false
    }

    if (!isLt10M) {
      message.error('File must be smaller than 10MB!')
      return false
    }

    try {
      const result = await dispatch(
        uploadDocument({ field: fieldName, file })
      ).unwrap()

      const newFile = {
        uid: file.uid,
        name: file.name,
        status: 'done',
        url: result.url,
      }

      if (multiple) {
        setFileList([...fileList, newFile])
      } else {
        setFileList([newFile])
      }

      message.success('Document uploaded successfully!')
      return false
    } catch (error) {
      message.error('Upload failed!')
      return false
    }
  }

  const handleRemove = (file) => {
    const newFileList = fileList.filter((item) => item.uid !== file.uid)
    setFileList(newFileList)
  }

  const handlePreview = (file) => {
    if (file.url) {
      window.open(file.url, '_blank')
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 8, fontWeight: 500, color: '#595959' }}>
        {label}
      </div>
      <Upload
        fileList={fileList}
        beforeUpload={handleUpload}
        onRemove={handleRemove}
        onPreview={handlePreview}
        multiple={multiple}
        accept={accept}
        listType="text"
      >
        <Button icon={<UploadOutlined />}>Upload {multiple ? 'Files' : 'File'}</Button>
      </Upload>
      {fileList.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {fileList.map((file) => {
            const isImage = file.url && (file.url.includes('.jpg') || file.url.includes('.jpeg') || file.url.includes('.png'))
            return (
              <div
                key={file.uid}
                style={{
                  display: 'inline-block',
                  marginRight: 8,
                  marginBottom: 8,
                  padding: 8,
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                }}
              >
                {isImage ? (
                  <Image
                    src={file.url}
                    alt={file.name}
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f0f0f0',
                      borderRadius: 4,
                    }}
                  >
                    PDF
                  </div>
                )}
                <div style={{ marginTop: 4, fontSize: 12, textAlign: 'center' }}>
                  {file.name}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DocumentUploader
