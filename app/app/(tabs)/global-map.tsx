import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

type Location = {
  id?: number;  // Make id optional
  city: string;
  coordinates: [number, number];
  userCount: number;
};

export default function GlobalMapScreen() {
  const router = useRouter();
  const [userLocations, setUserLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        console.log('Testing Supabase connection...');

        // Fetch only the columns that exist
        const { data, error } = await supabase
          .from('cities')
          .select('city, lat, lng');
        
        console.log('Raw data from Supabase:', { data, error });
        
        if (error) {
          console.error('Error fetching data:', error);
          setError(`Error fetching data: ${error.message}`);
          return;
        }

        if (!data || data.length === 0) {
          console.log('No data found in the cities table');
          setError('No cities found in the database');
          return;
        }

        const locations: Location[] = data.map((city: any) => {
          // Replace commas with dots before parsing
          const latitude = parseFloat(city.lat.replace(',', '.'));
          const longitude = parseFloat(city.lng.replace(',', '.'));
          
          console.log('Processing city coordinates:', {
            city: city.city,
            originalLat: city.lat,
            originalLng: city.lng,
            parsedLat: latitude,
            parsedLng: longitude
          });

          // Validate the coordinates
          if (isNaN(latitude) || isNaN(longitude)) {
            console.error(`Invalid coordinates for city ${city.city}:`, { lat: city.lat, lng: city.lng });
            return null;
          }

          return {
            city: city.city,
            coordinates: [longitude, latitude] as [number, number],
            userCount: 1
          };
        })
        .filter((location): location is Location => location !== null);
        
        console.log('Final locations array:', locations);
        setUserLocations(locations);
      } catch (error) {
        console.error('Unexpected error:', error);
        setError(`Unexpected error: ${error}`);
      }
    };

    testSupabaseConnection();
  }, []);

  // Add a log to see the state changes
  useEffect(() => {
    console.log('userLocations state updated:', userLocations);
  }, [userLocations]);

  const handleMarkerPress = (city: string) => {
    // Navigate to Community tab with city filter
    router.push({
      pathname: '/(tabs)/community',
      params: { city }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Global Map</Text>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 52.0,     // Centered on Central Europe
          longitude: 13.0,    // Where most of your cities are
          latitudeDelta: 20,  // Closer zoom to see the cities better
          longitudeDelta: 20,
        }}
      >
        {userLocations.length === 0 ? (
          null
        ) : (
          userLocations.map((location) => {
            console.log('Rendering marker for city:', {
              city: location.city,
              lat: location.coordinates[1],
              lng: location.coordinates[0]
            });
            return (
              <Marker
                key={location.city}  // Use city name as key since we don't have an id
                coordinate={{
                  latitude: location.coordinates[1],
                  longitude: location.coordinates[0],
                }}
                title={location.city}
                description={`Users: ${location.userCount}`}
                onPress={() => handleMarkerPress(location.city)}
              />
            );
          })
        )}
      </MapView>
    </SafeAreaView>
  );
}

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
  error: {
    color: 'red',
    marginTop: 8,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
}); 