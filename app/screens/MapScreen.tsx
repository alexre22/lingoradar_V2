import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { City, loadCitiesFromCSV } from '../lib/cities';

const MapScreen = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCities = async () => {
      try {
        console.log('Starting to load cities in MapScreen...');
        const loadedCities = await loadCitiesFromCSV();
        console.log('Cities loaded in MapScreen:', loadedCities.length);
        
        if (loadedCities.length === 0) {
          throw new Error('No cities were loaded');
        }
        
        setCities(loadedCities);
      } catch (err) {
        console.error('Error in MapScreen:', err);
        setError(err instanceof Error ? err.message : 'Failed to load cities data');
      } finally {
        setLoading(false);
      }
    };
    loadCities();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading cities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Global Map</Text>
      </View>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 20,
          longitude: 0,
          latitudeDelta: 100,
          longitudeDelta: 100,
        }}
      >
        {cities.map((city) => (
          <Marker
            key={city.id.toString()}
            coordinate={{
              latitude: city.coordinates[1],
              longitude: city.coordinates[0],
            }}
            title={city.city}
            description={`Users: ${city.userCount}`}
          />
        ))}
      </MapView>
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Cities loaded: {cities.length}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 5,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 14,
  },
});

export default MapScreen; 