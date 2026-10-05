/**
 * Web-specific MapView Component with Interactive Map
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { WebMap } from './WebMap';

interface MapViewProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  location?: {
    lat: number;
    lon: number;
    address: string;
  };
  onRegionChangeComplete?: (region: any) => void;
}

export const PlatformMapView: React.FC<MapViewProps> = ({
  region,
  location,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.mapContainer}>
      <WebMap
        latitude={region.latitude}
        longitude={region.longitude}
        address={location?.address}
      />
      {location && (
        <View style={styles.locationInfo}>
          <Text style={[styles.locationText, { color: colors.text }]}>
            {location.address || 'Location obtained'}
          </Text>
          <Text style={[styles.coordsText, { color: colors.icon }]}>
            {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  locationInfo: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  coordsText: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 4,
  },
});
