import React, { useState } from 'react'
import { Upload, Avatar, Button, message, Modal } from 'antd'
import { UserOutlined, CameraOutlined, DeleteOutlined } from '@ant-design/icons'
import { useDispatch } from 'react-redux'
import { uploadDocument } from '../../features/profile/profileSlice'

const AvatarUploader = ({ value, onUpload }) => {
  const dispatch = useDispatch()
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState('')

  const handleUpload = async (file) => {
    const isImage = file.type.startsWith('image/')
    const isLt5M = file.size / 1024 / 1024 < 5

    if (!isImage) {
      message.error('You can only upload image files!')
      return false
    }

    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!')
      return false
    }

    // Check if it's a valid image format
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg'
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG files!')
      return false
    }

    try {
      const result = await dispatch(
        uploadDocument({ field: 'avatar', file })
      ).unwrap()

      if (onUpload) {
        onUpload(result.url)
      }
      
      message.success('Profile picture uploaded successfully!')
      return false
    } catch (error) {
      message.error('Upload failed!')
      return false
    }
  }

  const handleRemove = () => {
    if (onUpload) {
      onUpload('')
    }
    message.success('Profile picture removed')
  }

  const handlePreview = () => {
    if (value) {
      setPreviewImage(value)
      setPreviewVisible(true)
    }
  }

  const uploadButton = (
    <div>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <CameraOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />
        <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 12 }}>
          Upload Photo
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <Upload
        name="avatar"
        listType="picture-circle"
        showUploadList={false}
        beforeUpload={handleUpload}
        accept="image/jpeg,image/jpg,image/png"
      >
        {value ? (
          <div style={{ position: 'relative' }}>
            <Avatar
              size={120}
              src={value}
              icon={<UserOutlined />}
              style={{ cursor: 'pointer', border: '4px solid #1890ff' }}
              onClick={(e) => {
                e.stopPropagation()
                handlePreview()
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: '#1890ff',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '2px solid #fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
              onClick={(e) => {
                e.stopPropagation()
                handlePreview()
              }}
            >
              <CameraOutlined style={{ color: '#fff', fontSize: 16 }} />
            </div>
          </div>
        ) : (
          <Avatar
            size={120}
            icon={<UserOutlined />}
            style={{ cursor: 'pointer', backgroundColor: '#1890ff' }}
          >
            {uploadButton}
          </Avatar>
        )}
      </Upload>
      
      {value && (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={handleRemove}
          size="small"
        >
          Remove Picture
        </Button>
      )}

      <div style={{ textAlign: 'center', color: '#8c8c8c', fontSize: 12, maxWidth: 200 }}>
        Supported formats: JPG, PNG
        <br />
        Max size: 5MB
      </div>

      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        centered
      >
        <img
          alt="profile preview"
          style={{ width: '100%' }}
          src={previewImage}
        />
      </Modal>
    </div>
  )
}

export default AvatarUploader
