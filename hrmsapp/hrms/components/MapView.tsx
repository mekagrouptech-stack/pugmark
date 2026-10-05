/**
 * Platform-specific MapView Component
 * Only loads react-native-maps on native platforms
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

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

// Lazy load native map component
let NativeMapView: any = null;
let NativeMarker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    // Use dynamic require to prevent web bundling
    const Maps = require('react-native-maps');
    NativeMapView = Maps.default;
    NativeMarker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (e) {
    // Maps not available
  }
}

export const PlatformMapView: React.FC<MapViewProps> = ({
  region,
  location,
  onRegionChangeComplete,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Web fallback
  if (Platform.OS === 'web' || !NativeMapView) {
    return (
      <View style={[styles.mapPlaceholder, { backgroundColor: colors.icon + '10' }]}>
        <Ionicons name="map-outline" size={48} color={colors.tint} />
        <Text style={[styles.mapPlaceholderText, { color: colors.text }]}>
          {location?.address || 'Location loaded'}
        </Text>
        {location && (
          <Text style={[styles.coordsText, { color: colors.icon, marginTop: 8 }]}>
            {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
          </Text>
        )}
      </View>
    );
  }

  // Native map
  return (
    <NativeMapView
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={region}
      region={region}
      showsUserLocation={true}
      showsMyLocationButton={true}
      mapType="standard"
      onRegionChangeComplete={onRegionChangeComplete}
    >
      <NativeMarker
        coordinate={{
          latitude: region.latitude,
          longitude: region.longitude,
        }}
        title="Your Location"
        description={location?.address || 'Current location'}
        pinColor={colors.tint}
      />
    </NativeMapView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    height: 250,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  coordsText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
