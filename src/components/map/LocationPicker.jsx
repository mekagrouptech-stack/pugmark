import React, { useEffect, useRef } from 'react'
import { Button, Space, Typography, message } from 'antd'
import { AimOutlined, EnvironmentOutlined } from '@ant-design/icons'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const { Text } = Typography

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const DEFAULT_CENTER = [19.1136, 72.8697]

const LocationPicker = ({
  latitude,
  longitude,
  radius = 100,
  onChange,
  height = 320,
}) => {
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const circleRef = useRef(null)

  const setLocation = (lat, lng) => {
    onChange?.({ latitude: lat, longitude: lng, radius })
  }

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return

    const initLat = latitude ?? DEFAULT_CENTER[0]
    const initLng = longitude ?? DEFAULT_CENTER[1]
    const hasPin = latitude != null && longitude != null

    mapRef.current = L.map(mapEl.current, {
      center: [initLat, initLng],
      zoom: hasPin ? 16 : 12,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current)

    mapRef.current.on('click', (e) => {
      setLocation(e.latlng.lat, e.latlng.lng)
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
      circleRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (latitude == null || longitude == null) {
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
        markerRef.current = null
      }
      if (circleRef.current) {
        map.removeLayer(circleRef.current)
        circleRef.current = null
      }
      return
    }

    const latLng = [Number(latitude), Number(longitude)]

    if (!markerRef.current) {
      markerRef.current = L.marker(latLng, { draggable: true }).addTo(map)
      markerRef.current.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng()
        setLocation(lat, lng)
      })
    } else {
      markerRef.current.setLatLng(latLng)
    }

    if (!circleRef.current) {
      circleRef.current = L.circle(latLng, {
        radius: Number(radius) || 0,
        color: '#1890ff',
        fillColor: '#1890ff',
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map)
    } else {
      circleRef.current.setLatLng(latLng)
      circleRef.current.setRadius(Number(radius) || 0)
    }

    map.setView(latLng, Math.max(map.getZoom(), 15))
  }, [latitude, longitude, radius])

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      message.error('Geolocation is not supported by this browser')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(pos.coords.latitude, pos.coords.longitude)
      },
      (err) => {
        message.error(`Failed to get current location: ${err.message}`)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const clearPin = () => {
    onChange?.({ latitude: null, longitude: null, radius })
  }

  return (
    <div>
      <Space style={{ marginBottom: 8 }} wrap>
        <Button icon={<AimOutlined />} onClick={useCurrentLocation} size="small">
          Use my current location
        </Button>
        <Button onClick={clearPin} size="small" disabled={latitude == null && longitude == null}>
          Clear
        </Button>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <EnvironmentOutlined /> Click on the map to set the punch-in point, or drag the pin
        </Text>
      </Space>
      <div
        ref={mapEl}
        style={{
          height,
          width: '100%',
          borderRadius: 4,
          border: '1px solid #d9d9d9',
          zIndex: 0,
        }}
      />
      {latitude != null && longitude != null && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
          <Text strong>Selected:</Text> {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
          {radius ? <> &nbsp;·&nbsp; <Text strong>Radius:</Text> {radius} m</> : null}
        </div>
      )}
    </div>
  )
}

export default LocationPicker
