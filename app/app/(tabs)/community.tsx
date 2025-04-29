import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Pressable,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import UserFeed from '../../components/UserFeed';
import { FontAwesome } from '@expo/vector-icons';

interface FilterOptions {
  nativeLanguages: string[];
  learningLanguages: string[];
  interests: string[];
  city: string;
  minAge: number;
  maxAge: number;
}

export default function Community() {
  const [selectedCity, setSelectedCity] = useState('New York');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Users'); // 'Users' or 'Map'
  const [filters, setFilters] = useState<FilterOptions>({
    nativeLanguages: [],
    learningLanguages: [],
    interests: [],
    city: selectedCity,
    minAge: 18,
    maxAge: 100,
  });

  useEffect(() => {
    setFilters(prev => ({ ...prev, city: selectedCity }));
  }, [selectedCity]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.cityPickerContainer}>
          <Text style={styles.label}>City:</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedCity}
              onValueChange={setSelectedCity}
              style={styles.cityPicker}
            >
              <Picker.Item label="New York" value="New York" />
              <Picker.Item label="Los Angeles" value="Los Angeles" />
              <Picker.Item label="Chicago" value="Chicago" />
              {/* Add more cities as needed */}
            </Picker>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <FontAwesome name="sliders" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={16} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, language or interest"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'Users' && styles.activeTab]}
            onPress={() => setActiveTab('Users')}
          >
            <Text style={[styles.tabText, activeTab === 'Users' && styles.activeTabText]}>
              Users
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'Map' && styles.activeTab]}
            onPress={() => setActiveTab('Map')}
          >
            <Text style={[styles.tabText, activeTab === 'Map' && styles.activeTabText]}>
              Map
            </Text>
          </Pressable>
        </View>
      </View>

      {activeTab === 'Users' ? (
        <UserFeed filters={filters} />
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text>Map View Coming Soon</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cityPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    marginRight: 8,
  },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cityPicker: {
    height: 40,
  },
  filterButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '500',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 