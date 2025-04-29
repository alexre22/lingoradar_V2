import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

interface CityFilterProps {
  onCitySelect: (city: string | null) => void;
  selectedCity: string | null;
}

export default function CityFilter({ onCitySelect, selectedCity }: CityFilterProps) {
  const [cities, setCities] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('city')
        .not('city', 'is', null)
        .order('city');

      if (error) throw error;

      // Get unique cities and sort them
      const uniqueCities = [...new Set(data.map(item => item.city))].sort();
      setCities(uniqueCities);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Type to search cities..."
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
      />
      
      {showResults && searchQuery.length > 0 && (
        <View style={styles.resultsContainer}>
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => {
              onCitySelect(null);
              setSearchQuery('');
              setShowResults(false);
            }}
          >
            <Text style={styles.resultText}>All Cities</Text>
          </TouchableOpacity>
          <FlatList
            data={filteredCities}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => {
                  onCitySelect(item);
                  setSearchQuery(item);
                  setShowResults(false);
                }}
              >
                <Text style={styles.resultText}>{item}</Text>
              </TouchableOpacity>
            )}
            style={styles.resultsList}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  resultsContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 200,
  },
  resultsList: {
    maxHeight: 200,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultText: {
    fontSize: 16,
    color: '#333',
  },
}); 