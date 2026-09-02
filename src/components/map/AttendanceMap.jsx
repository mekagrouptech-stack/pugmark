import React, { useEffect, useRef } from 'react'
import { Card, Spin, Alert, Space, Tag, Typography } from 'antd'
import { EnvironmentOutlined, UserOutlined, HomeOutlined } from '@ant-design/icons'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { validateGeofence, formatDistance } from '../../utils/locationUtils'

const { Text } = Typography

// Fix for default marker icons in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

/**
 * AttendanceMap Component
 * Displays a map with user location, office location, and geofence circle
 */
const AttendanceMap = ({
  userLocation,
  officeLocation,
  radius = 100,
  height = 400,
  showGeofence = true,
  showDistance = true,
  onLocationChange,
  loading = false,
  error = null,
}) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})
  const circleRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map
    if (!mapInstanceRef.current) {
      const center = officeLocation
        ? [officeLocation.latitude, officeLocation.longitude]
        : userLocation
        ? [userLocation.latitude, userLocation.longitude]
        : [19.1136, 72.8697] // Default to Mumbai

      mapInstanceRef.current = L.map(mapRef.current, {
        center,
        zoom: officeLocation ? 15 : 13,
        zoomControl: true,
      })

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current)

      // Handle map clicks if onLocationChange is provided
      if (onLocationChange) {
        mapInstanceRef.current.on('click', (e) => {
          onLocationChange(e)
        })
      }
    }

    const map = mapInstanceRef.current

    // Add office marker
    if (officeLocation) {
      if (markersRef.current.office) {
        map.removeLayer(markersRef.current.office)
      }

      const officeIcon = L.divIcon({
        className: 'custom-office-marker',
        html: `<div style="
          background-color: #1890ff;
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
        <div style="
          transform: rotate(45deg);
          position: absolute;
          top: 8px;
          left: 8px;
          color: white;
          font-size: 16px;
        ">🏢</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      })

      markersRef.current.office = L.marker([officeLocation.latitude, officeLocation.longitude], {
        icon: officeIcon,
      })
        .addTo(map)
        .bindPopup(
          `<strong>${officeLocation.name || 'Office'}</strong><br/>${officeLocation.address || ''}`
        )
    }

    // Add user marker
    if (userLocation) {
      if (markersRef.current.user) {
        map.removeLayer(markersRef.current.user)
      }

      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div style="
          background-color: #52c41a;
          width: 25px;
          height: 25px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
        <div style="
          position: absolute;
          top: 5px;
          left: 5px;
          color: white;
          font-size: 14px;
        ">👤</div>`,
        iconSize: [25, 25],
        iconAnchor: [12, 12],
      })

      markersRef.current.user = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon,
      })
        .addTo(map)
        .bindPopup(
          `<strong>Your Location</strong><br/>Lat: ${userLocation.latitude.toFixed(6)}<br/>Lng: ${userLocation.longitude.toFixed(6)}`
        )

      // Center map on user location if office is not set
      if (!officeLocation) {
        map.setView([userLocation.latitude, userLocation.longitude], 15)
      }
    }

    // Add geofence circle
    if (showGeofence && officeLocation && radius) {
      if (circleRef.current) {
        map.removeLayer(circleRef.current)
      }

      circleRef.current = L.circle([officeLocation.latitude, officeLocation.longitude], {
        radius,
        color: '#1890ff',
        fillColor: '#1890ff',
        fillOpacity: 0.2,
        weight: 2,
      }).addTo(map)
    }

    // Fit bounds to show both markers
    if (userLocation && officeLocation) {
      const bounds = L.latLngBounds([
        [userLocation.latitude, userLocation.longitude],
        [officeLocation.latitude, officeLocation.longitude],
      ])
      map.fitBounds(bounds, { padding: [50, 50] })
    }

    return () => {
      // Cleanup is handled by React
    }
  }, [userLocation, officeLocation, radius, showGeofence])

  // Calculate distance if both locations are available
  const distanceInfo = userLocation && officeLocation
    ? validateGeofence(
        userLocation.latitude,
        userLocation.longitude,
        officeLocation.latitude,
        officeLocation.longitude,
        radius
      )
    : null

  return (
    <Card
      title={
        <Space>
          <EnvironmentOutlined />
          <span>Location Map</span>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      {error && (
        <Alert
          message="Location Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {distanceInfo && showDistance && (
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <UserOutlined style={{ color: '#52c41a' }} />
              <Text strong>Distance from Office:</Text>
              <Tag color={distanceInfo.isWithinRadius ? 'green' : 'red'}>
                {formatDistance(distanceInfo.distance)}
              </Tag>
            </Space>
            <Space>
              <HomeOutlined style={{ color: '#1890ff' }} />
              <Text strong>Allowed Radius:</Text>
              <Tag>{formatDistance(radius)}</Tag>
            </Space>
            <Space>
              <Text strong>Status:</Text>
              <Tag color={distanceInfo.isWithinRadius ? 'success' : 'error'}>
                {distanceInfo.isWithinRadius ? 'Within Range' : 'Outside Range'}
              </Tag>
            </Space>
          </Space>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255,255,255,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <Spin size="large" tip="Loading map..." />
          </div>
        )}
        <div
          ref={mapRef}
          style={{
            height: `${height}px`,
            width: '100%',
            borderRadius: 4,
            zIndex: 1,
          }}
        />
      </div>

      <style>{`
        .custom-office-marker,
        .custom-user-marker {
          background: transparent;
          border: none;
        }
      `}</style>
    </Card>
  )
}

export default AttendanceMap
