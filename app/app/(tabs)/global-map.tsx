import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';

type Location = {
  id: number;
  city: string;
  coordinates: [number, number];
  userCount: number;
};

export default function GlobalMapScreen() {
  const router = useRouter();
  const [userLocations, setUserLocations] = useState<Location[]>([]);

  // This would be replaced with actual data from your backend
  useEffect(() => {
    // Mock data for demonstration
    const mockLocations: Location[] = [
      { id: 1, city: 'New York', coordinates: [-74.006, 40.7128], userCount: 5 },
      { id: 2, city: 'London', coordinates: [-0.1276, 51.5074], userCount: 3 },
      { id: 3, city: 'Tokyo', coordinates: [139.6917, 35.6895], userCount: 4 },
      { id: 4, city: 'Paris', coordinates: [2.3522, 48.8566], userCount: 2 },
      { id: 5, city: 'Berlin', coordinates: [13.4050, 52.5200], userCount: 3 },
    ];
    setUserLocations(mockLocations);
  }, []);

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
        {userLocations.map((location) => (
          <Marker
            key={location.id.toString()}
            coordinate={{
              latitude: location.coordinates[1],
              longitude: location.coordinates[0],
            }}
            title={location.city}
            description={`Users: ${location.userCount}`}
            onPress={() => handleMarkerPress(location.city)}
          />
        ))}
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
  map: {
    flex: 1,
  },
}); 