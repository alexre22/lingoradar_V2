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
import { useRouter } from 'expo-router';
import CityFilter from './CityFilter';

interface UserProfile {
  id: string;
  name: string;
  age: number;
  profile_picture_url: string | null;
  native_languages: number[];
  learning_languages: number[];
  interests: string[];
  city: string;
}

interface FilterOptions {
  nativeLanguages: number[];
  learningLanguages: number[];
  interests: string[];
  city: string | null;
  minAge: number;
  maxAge: number;
  searchQuery?: string;
}

interface UserFeedProps {
  filters: FilterOptions;
}

interface ProfileCardProps {
  item: UserProfile;
  onMessage: (userId: string) => void;
  languages: { [key: number]: string };
}

const ProfileCard: React.FC<ProfileCardProps> = ({ item, onMessage, languages }) => {
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState(item.profile_picture_url);

  const handleImageError = (error: any) => {
    console.error('Image loading error:', error);
    console.error('Failed URL:', imageUrl);
    setImageError(true);
  };

  const retryImageLoad = () => {
    setImageError(false);
    const timestamp = new Date().getTime();
    setImageUrl(`${item.profile_picture_url}?t=${timestamp}`);
  };

  return (
    <View style={styles.profileCard}>
      {/* Upper Half - Profile Info */}
      <View style={styles.upperHalf}>
        {/* Profile Picture */}
        {!imageError && imageUrl ? (
          <Image
            source={{ 
              uri: imageUrl,
              cache: 'reload'
            }}
            style={styles.profileImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            onError={handleImageError}
            onLoad={() => console.log('Image loaded successfully:', imageUrl)}
          />
        ) : (
          <TouchableOpacity 
            style={[styles.profileImage, styles.placeholderImage]}
            onPress={retryImageLoad}
          >
            <FontAwesome name="user" size={32} color="#666" />
            {imageError && (
              <Text style={styles.retryText}>Tap to retry</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <Text style={styles.nameText}>{item.name || 'Anonymous'}{item.age ? `, ${item.age}` : ''}</Text>
          {item.city && (
            <Text style={styles.locationText}>{item.city}</Text>
          )}
        </View>

        {/* Message Button */}
        <TouchableOpacity
          style={styles.messageButton}
          onPress={() => onMessage(item.id)}
        >
          <FontAwesome name="paper-plane" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Lower Half - Languages and Interests */}
      <View style={styles.lowerHalf}>
        <View style={styles.lowerLeftSection}>
          {/* Languages Section */}
          <View style={styles.languageSection}>
            <Text style={styles.sectionTitle}>Native:</Text>
            <View style={styles.chipContainer}>
              {item.native_languages?.map(langId => (
                <View key={`native-${langId}`} style={styles.chip}>
                  <Text style={styles.chipText}>
                    {languages[langId] || ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.languageSection}>
            <Text style={styles.sectionTitle}>Learning:</Text>
            <View style={styles.chipContainer}>
              {item.learning_languages?.map(langId => (
                <View key={`learning-${langId}`} style={[styles.chip, styles.learningChip]}>
                  <Text style={styles.chipText}>
                    {languages[langId] || ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Interests Section on Right */}
        {item.interests && item.interests.length > 0 && (
          <View style={styles.lowerRightSection}>
            <Text style={styles.sectionTitle}>Interests:</Text>
            <View style={styles.chipContainer}>
              {item.interests.map((interest, index) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApply, currentFilters }) => {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);

  const handleCitySelect = (city: string | null) => {
    setFilters(prev => ({ ...prev, city }));
  };

  if (!visible) return null;

  return (
    <View style={styles.modal}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filters</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <FontAwesome name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterContent}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>City</Text>
            <CityFilter 
              onCitySelect={handleCitySelect}
              selectedCity={filters.city}
            />
          </View>
        </View>

        <View style={styles.modalFooter}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.applyButton]}
            onPress={() => onApply(filters)}
          >
            <Text style={[styles.buttonText, styles.applyButtonText]}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function UserFeed({ filters }: UserFeedProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [languages, setLanguages] = useState<{[key: number]: string}>({});
  const [interests, setInterests] = useState<{[key: number]: string}>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>(filters);
  const router = useRouter();

  // Fetch languages and interests mapping
  useEffect(() => {
    async function fetchData() {
      // Fetch languages
      const { data: languagesData } = await supabase
        .from('languages')
        .select('id, name');
      
      if (languagesData) {
        const langMap = languagesData.reduce((acc: {[key: number]: string}, lang) => {
          acc[lang.id] = lang.name;
          return acc;
        }, {});
        setLanguages(langMap);
      }

      // Fetch interests
      const { data: interestsData } = await supabase
        .from('interests')
        .select('id, name');
      
      if (interestsData) {
        const interestMap = interestsData.reduce((acc: {[key: number]: string}, interest) => {
          acc[interest.id] = interest.name;
          return acc;
        }, {});
        setInterests(interestMap);
      }
    }
    fetchData();
  }, []);

  const getPublicUrl = async (url: string) => {
    if (!url) {
      console.log('No URL provided to getPublicUrl');
      return null;
    }
    
    try {
      // Extract the file path from the URL
      const parts = url.split('/');
      const filePath = parts.slice(parts.indexOf('profile-pictures') + 1).join('/');
      
      console.log('Attempting to get signed URL for path:', filePath);

      const { data, error } = await supabase.storage
        .from('profile-pictures')
        .createSignedUrl(filePath, 3600);

      if (error) {
        console.error('Error getting signed URL:', error);
        console.error('Attempted file path:', filePath);
        return null;
      }

      if (data?.signedUrl) {
        console.log('Generated signed URL:', data.signedUrl);
        return data.signedUrl;
      }

      return null;
    } catch (error) {
      console.error('Error in getPublicUrl:', error);
      return null;
    }
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data: currentUser } = await supabase.auth.getUser();
      
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser.user?.id); // Don't show current user

      if (filters.city) {
        query = query.eq('city', filters.city);
      }
      if (filters.minAge || filters.maxAge) {
        query = query.gte('age', filters.minAge).lte('age', filters.maxAge);
      }
      if (filters.nativeLanguages.length > 0) {
        query = query.overlaps('native_languages', filters.nativeLanguages);
      }
      if (filters.learningLanguages.length > 0) {
        query = query.overlaps('learning_languages', filters.learningLanguages);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }

      // Client-side filtering for search
      let filteredData = data || [];
      
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        filteredData = filteredData.filter(profile => 
          profile.name?.toLowerCase().includes(searchLower) ||
          profile.native_languages?.some((lang: number) => languages[lang]?.toLowerCase().includes(searchLower)) ||
          profile.learning_languages?.some((lang: number) => languages[lang]?.toLowerCase().includes(searchLower))
        );
      }

      // Process profile pictures and interests
      const processedData = await Promise.all(
        filteredData.map(async (profile) => {
          const profilePictureUrl = profile.profile_picture_url ? 
            await getPublicUrl(profile.profile_picture_url) : null;
          
          // Convert interest IDs to names
          const interestNames = profile.interests?.map((id: number) => interests[id]).filter(Boolean) || [];
          
          return {
            ...profile,
            profile_picture_url: profilePictureUrl,
            interests: interestNames
          };
        })
      );

      setProfiles(processedData);
    } catch (error) {
      console.error('Error in fetchProfiles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [filters, languages]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfiles();
    setRefreshing(false);
  };

  const handleMessage = (userId: string) => {
    router.push(`/chat/${userId}`);
  };

  const handleCitySelect = (city: string | null) => {
    filters.city = city;
    fetchProfiles();
  };

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setCurrentFilters(newFilters);
    setShowFilterModal(false);
    fetchProfiles();
  };

  const renderProfileCard = ({ item }: { item: UserProfile }) => (
    <ProfileCard 
      item={item} 
      onMessage={handleMessage} 
      languages={languages} 
    />
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        currentFilters={currentFilters}
      />

      <FlatList
        data={profiles}
        renderItem={renderProfileCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.profileList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileList: {
    padding: 12,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  upperHalf: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 10,
  },
  lowerHalf: {
    flex: 1,
    paddingTop: 2,
    flexDirection: 'row',
  },
  lowerLeftSection: {
    flex: 1,
    marginRight: 12,
  },
  lowerRightSection: {
    flex: 1,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#f0f0f0',
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  nameText: {
    fontSize: 21,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
  },
  messageButton: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  languageSection: {
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  chip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: {
    fontSize: 12,
    color: '#333',
  },
  learningChip: {
    backgroundColor: '#f0f0f0',
  },
  retryText: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  filterContent: {
    maxHeight: '70%',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
  },
  filterButtonText: {
    fontSize: 16,
    color: '#333',
  },
  cityFilterContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  applyButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  applyButtonText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
}); 