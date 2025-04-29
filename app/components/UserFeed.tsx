import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { supabase } from '../lib/supabase';
import { FontAwesome } from '@expo/vector-icons';

interface UserProfile {
  id: string;
  name: string;
  age: number;
  profile_picture_url: string | null;
  native_languages: string[];
  learning_languages: string[];
  interests: string[];
}

interface FilterOptions {
  nativeLanguages: string[];
  learningLanguages: string[];
  interests: string[];
  city: string;
  minAge: number;
  maxAge: number;
}

interface UserFeedProps {
  filters: FilterOptions;
}

const languageFlags: { [key: string]: string } = {
  'English': '🇺🇸',
  'Spanish': '🇪🇸',
  'French': '🇫🇷',
  'Japanese': '🇯🇵',
  // Add more languages and their flags as needed
};

export default function UserFeed({ filters }: UserFeedProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('profiles')
        .select('*');

      // Apply filters
      if (filters.nativeLanguages.length > 0) {
        query = query.contains('native_languages', filters.nativeLanguages);
      }
      if (filters.learningLanguages.length > 0) {
        query = query.contains('learning_languages', filters.learningLanguages);
      }
      if (filters.interests.length > 0) {
        query = query.contains('interests', filters.interests);
      }
      if (filters.city) {
        query = query.eq('city', filters.city);
      }
      if (filters.minAge || filters.maxAge) {
        query = query.gte('age', filters.minAge).lte('age', filters.maxAge);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }

      setProfiles(data || []);
    } catch (error) {
      console.error('Error in fetchProfiles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [filters]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfiles();
    setRefreshing(false);
  };

  const handleViewProfile = (userId: string) => {
    console.log('Viewing profile:', userId);
  };

  const renderProfileCard = ({ item }: { item: UserProfile }) => (
    <View style={styles.card}>
      <View style={styles.profileHeader}>
        {item.profile_picture_url ? (
          <Image
            source={item.profile_picture_url}
            style={styles.profileImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.profileImage, styles.placeholderImage]}>
            <FontAwesome name="user" size={30} color="#666" />
          </View>
        )}
        <View style={styles.profileContent}>
          <Text style={styles.nameAge}>{item.name}, {item.age}</Text>
          
          <View style={styles.languageRow}>
            {item.native_languages[0] && item.learning_languages[0] && (
              <Text style={styles.languages}>
                {languageFlags[item.native_languages[0]] || ''} {item.native_languages[0]} → {' '}
                {languageFlags[item.learning_languages[0]] || ''} {item.learning_languages[0]}
              </Text>
            )}
          </View>

          <View style={styles.interestsContainer}>
            {item.interests.map((interest, index) => (
              <Text key={index} style={styles.interest}>
                {interest}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.viewProfileButton}
        onPress={() => handleViewProfile(item.id)}
      >
        <Text style={styles.viewProfileText}>View Profile</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={profiles}
        renderItem={renderProfileCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContent: {
    flex: 1,
  },
  nameAge: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  languages: {
    fontSize: 14,
    color: '#333',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interest: {
    fontSize: 14,
    color: '#666',
  },
  viewProfileButton: {
    backgroundColor: '#000',
    padding: 8,
    borderRadius: 6,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  viewProfileText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
}); 