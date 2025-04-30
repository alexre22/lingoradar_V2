import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import UserFeed from '../../components/UserFeed';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import CityFilter from '../../components/CityFilter';
import { useLocalSearchParams } from 'expo-router';

interface FilterOptions {
  nativeLanguages: number[];
  learningLanguages: number[];
  interests: string[];
  city: string;
  minAge: number;
  maxAge: number;
  searchQuery?: string;
}

export default function Community() {
  const { city: cityFromUrl } = useLocalSearchParams<{ city: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    nativeLanguages: [],
    learningLanguages: [],
    interests: [],
    city: cityFromUrl || '',
    minAge: 18,
    maxAge: 100,
  });
  const [languages, setLanguages] = useState<{id: number, name: string}[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  // Update filters when city from URL changes
  useEffect(() => {
    if (cityFromUrl) {
      setFilters(prev => ({
        ...prev,
        city: cityFromUrl
      }));
    }
  }, [cityFromUrl]);

  // Fetch available languages and cities
  useEffect(() => {
    async function fetchData() {
      // Fetch languages
      const { data: languagesData } = await supabase
        .from('languages')
        .select('id, name')
        .order('name');
      
      if (languagesData) {
        setLanguages(languagesData);
      }

      // Fetch cities
      const { data: citiesData } = await supabase
        .from('profiles')
        .select('city')
        .not('city', 'is', null)
        .order('city');
      
      if (citiesData) {
        const uniqueCities = [...new Set(citiesData.map(item => item.city))];
        setCities(uniqueCities);
      }
    }

    fetchData();
  }, []);

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      searchQuery: searchQuery,
    }));
  };

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or language"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <FontAwesome name="search" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.filterButton, showFilters && styles.activeFilterButton]}
          onPress={() => setShowFilters(true)}
        >
          <FontAwesome name="sliders" size={20} color={showFilters ? "#fff" : "#000"} />
        </TouchableOpacity>
      </View>

      <UserFeed filters={filters} />

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity 
                onPress={() => setShowFilters(false)}
                style={styles.closeButton}
              >
                <FontAwesome name="times" size={20} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filtersScroll}>
              {/* Native Languages */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Native Languages</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.languageContainer}>
                    {languages.map((lang) => (
                      <TouchableOpacity
                        key={lang.id}
                        style={[
                          styles.languageButton,
                          filters.nativeLanguages.includes(lang.id) && styles.selectedLanguage,
                        ]}
                        onPress={() => {
                          const newLanguages = filters.nativeLanguages.includes(lang.id)
                            ? filters.nativeLanguages.filter(id => id !== lang.id)
                            : [...filters.nativeLanguages, lang.id];
                          handleFilterChange('nativeLanguages', newLanguages);
                        }}
                      >
                        <Text style={[
                          styles.languageText,
                          filters.nativeLanguages.includes(lang.id) && styles.selectedLanguageText
                        ]}>
                          {lang.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Learning Languages */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Learning Languages</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.languageContainer}>
                    {languages.map((lang) => (
                      <TouchableOpacity
                        key={lang.id}
                        style={[
                          styles.languageButton,
                          filters.learningLanguages.includes(lang.id) && styles.selectedLanguage,
                        ]}
                        onPress={() => {
                          const newLanguages = filters.learningLanguages.includes(lang.id)
                            ? filters.learningLanguages.filter(id => id !== lang.id)
                            : [...filters.learningLanguages, lang.id];
                          handleFilterChange('learningLanguages', newLanguages);
                        }}
                      >
                        <Text style={[
                          styles.languageText,
                          filters.learningLanguages.includes(lang.id) && styles.selectedLanguageText
                        ]}>
                          {lang.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* City */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>City</Text>
                <CityFilter 
                  onCitySelect={(city) => handleFilterChange('city', city)}
                  selectedCity={filters.city}
                />
              </View>

              {/* Age Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Age Range</Text>
                <View style={styles.ageContainer}>
                  <TextInput
                    style={styles.ageInput}
                    placeholder="Min"
                    keyboardType="numeric"
                    value={filters.minAge.toString()}
                    onChangeText={(value) => handleFilterChange('minAge', parseInt(value) || 18)}
                  />
                  <Text style={styles.ageSeparator}>-</Text>
                  <TextInput
                    style={styles.ageInput}
                    placeholder="Max"
                    keyboardType="numeric"
                    value={filters.maxAge.toString()}
                    onChangeText={(value) => handleFilterChange('maxAge', parseInt(value) || 100)}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#2196F3',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#2196F3',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  filtersScroll: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedLanguage: {
    backgroundColor: '#2196F3',
  },
  languageText: {
    color: '#666',
  },
  selectedLanguageText: {
    color: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
  },
  ageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: 'center',
  },
  ageSeparator: {
    marginHorizontal: 12,
    fontSize: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 