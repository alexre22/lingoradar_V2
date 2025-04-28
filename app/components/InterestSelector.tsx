import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity, Text } from 'react-native';
import { supabase } from '../lib/supabase';

interface Interest {
  id: number;
  name: string;
}

interface InterestSelectorProps {
  selectedInterests: number[];
  onSelectionChange: (interests: number[]) => void;
}

const MAX_INTERESTS = 5;

export default function InterestSelector({
  selectedInterests,
  onSelectionChange,
}: InterestSelectorProps) {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('interests')
        .select('id, name')
        .order('name');

      if (error) {
        setError(error.message);
        throw error;
      }

      if (!data || data.length === 0) {
        setError('No interests available');
      } else {
        setInterests(data);
      }
    } catch (error) {
      setError('Failed to load interests');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interestId: number) => {
    if (selectedInterests.includes(interestId)) {
      const newSelection = selectedInterests.filter(id => id !== interestId);
      onSelectionChange(newSelection);
    } else {
      if (selectedInterests.length >= MAX_INTERESTS) {
        Alert.alert(
          'Maximum Interests Reached',
          `You can only select up to ${MAX_INTERESTS} interests. Please remove one to add another.`
        );
        return;
      }
      const newSelection = [...selectedInterests, interestId];
      onSelectionChange(newSelection);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading interests...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Interests</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {interests.map((interest) => (
          <TouchableOpacity
            key={interest.id}
            style={[
              styles.interestChip,
              selectedInterests.includes(interest.id) && styles.selectedChip,
            ]}
            onPress={() => toggleInterest(interest.id)}
          >
            <Text
              style={[
                styles.interestText,
                selectedInterests.includes(interest.id) && styles.selectedText,
              ]}
            >
              {interest.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scrollView: {
    flexDirection: 'row',
  },
  interestChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedChip: {
    backgroundColor: '#007AFF',
  },
  interestText: {
    color: '#333',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
  },
}); 