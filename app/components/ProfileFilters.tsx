import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';

interface FilterOptions {
  nativeLanguages: string[];
  learningLanguages: string[];
  interests: string[];
  city: string;
  minAge: number;
  maxAge: number;
}

interface ProfileFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  availableLanguages: string[];
  availableCities: string[];
}

export default function ProfileFilters({
  onFilterChange,
  availableLanguages,
  availableCities,
}: ProfileFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    nativeLanguages: [],
    learningLanguages: [],
    interests: [],
    city: '',
    minAge: 18,
    maxAge: 100,
  });

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <ScrollView style={styles.container} horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Native Languages</Text>
        <View style={styles.languageContainer}>
          {availableLanguages.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.filterButton,
                filters.nativeLanguages.includes(lang) && styles.selectedButton,
              ]}
              onPress={() => {
                const newLanguages = filters.nativeLanguages.includes(lang)
                  ? filters.nativeLanguages.filter((l) => l !== lang)
                  : [...filters.nativeLanguages, lang];
                handleFilterChange('nativeLanguages', newLanguages);
              }}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filters.nativeLanguages.includes(lang) && styles.selectedButtonText,
                ]}
              >
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Learning Languages</Text>
        <View style={styles.languageContainer}>
          {availableLanguages.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.filterButton,
                filters.learningLanguages.includes(lang) && styles.selectedButton,
              ]}
              onPress={() => {
                const newLanguages = filters.learningLanguages.includes(lang)
                  ? filters.learningLanguages.filter((l) => l !== lang)
                  : [...filters.learningLanguages, lang];
                handleFilterChange('learningLanguages', newLanguages);
              }}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filters.learningLanguages.includes(lang) && styles.selectedButtonText,
                ]}
              >
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Age Range</Text>
        <View style={styles.ageRangeContainer}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  filterSection: {
    marginRight: 16,
    minWidth: 200,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedButton: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 12,
  },
  selectedButtonText: {
    color: '#fff',
  },
  ageRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    width: 60,
    textAlign: 'center',
  },
  ageSeparator: {
    marginHorizontal: 8,
    fontSize: 16,
    color: '#666',
  },
}); 