/**
 * Employee Map Screen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { employeeService } from '@/services/employee.service';
import { Employee } from '@/types';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { PlatformMapView } from '@/components/MapView';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

export default function EmployeeMapScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState({
    latitude: 28.6139, // Default to Delhi
    longitude: 77.209,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  useEffect(() => {
    loadEmployees();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync();
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await employeeService.getEmployees({ limit: 50 });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading employee map..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        <PlatformMapView
          region={mapRegion}
          location={{
            lat: mapRegion.latitude,
            lon: mapRegion.longitude,
            address: 'Current Location',
          }}
        />
        {/* Employee Markers Overlay */}
        <View style={styles.markersOverlay}>
          {employees.slice(0, 6).map((employee, index) => {
            // Random positions for demo (in real app, use actual employee locations)
            const angle = (index * 60 * Math.PI) / 180;
            const radius = 0.02;
            return (
              <View
                key={employee.id}
                style={[
                  styles.marker,
                  {
                    left: width / 2 + Math.cos(angle) * radius * width - 25,
                    top: height / 3 + Math.sin(angle) * radius * height - 25,
                  },
                ]}
              >
                <Avatar
                  firstName={employee.firstName}
                  lastName={employee.lastName}
                  size={50}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* Employee Map Card */}
      <Card style={styles.mapCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
            <Ionicons name="people" size={24} color={colors.tint} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Employee Map</Text>
            <Text style={[styles.cardDescription, { color: colors.icon }]}>
              Where your employee you can check gps
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.error + '20' }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.cancelButtonText, { color: colors.error }]}>Cancel</Text>
        </TouchableOpacity>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  markersOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  marker: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  mapCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
