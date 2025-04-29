import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import ProfilePictureUpload from '../../components/ProfilePictureUpload';
import InterestSelector from '../../components/InterestSelector';
import LanguageSelector from '../../components/LanguageSelector';
import * as FileSystem from 'expo-file-system';

// Example city list (expand as needed)
const cities = [
  'Berlin', 'London', 'New York', 'Paris', 'Tokyo', 'Sydney', 'Toronto', 'Madrid', 'Rome', 'Istanbul'
];

// Define the profile type for better type safety
interface Profile {
  name: string;
  age: string;
  gender: string;
  city: string;
  bio: string;
  profile_picture_url: string;
  native_languages: number[];
  learning_languages: number[];
  interests: number[];
}

export default function Profile() {
  const { session, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    name: '',
    age: '',
    gender: '',
    city: '',
    bio: '',
    profile_picture_url: '',
    native_languages: [],
    learning_languages: [],
    interests: [],
  });
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch user profile from Supabase
  useEffect(() => {
    if (session && session.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    if (!session || !session.user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (error) {
      Alert.alert('Error', 'Could not load profile');
    } else if (data) {
      setProfile({
        name: data.name || '',
        age: data.age ? String(data.age) : '',
        gender: data.gender || '',
        city: data.city || '',
        bio: data.bio || '',
        profile_picture_url: data.profile_picture_url || '',
        native_languages: data.native_languages || [],
        learning_languages: data.learning_languages || [],
        interests: data.interests || [],
      });
    }
    setLoading(false);
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (uri: string): Promise<string> => {
    if (!session || !session.user) return '';
    try {
      setUploadProgress(0.1);
      
      // Read the file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Get the file extension
      const fileExt = uri.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      // Convert base64 to Uint8Array
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, bytes, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      setUploadProgress(0.7);

      // Get public URL - using the correct method
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl); // Debug log

      // Update the profile with the new picture URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          profile_picture_url: publicUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      // Update local state
      setProfile((prev) => ({ ...prev, profile_picture_url: publicUrl }));
      setUploadProgress(1);
      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Error', 'Could not upload profile picture.');
      setUploadProgress(0);
      return '';
    }
  };

  // Handle Save
  const handleSave = async () => {
    if (!session || !session.user) return;
    if (!profile.name || !profile.age || !profile.city) {
      Alert.alert('Missing Info', 'Name, age, and city are required.');
      return;
    }
    setSaving(true);
    const updates = {
      id: session.user.id,
      name: profile.name,
      age: Number(profile.age),
      gender: profile.gender,
      city: profile.city,
      bio: profile.bio,
      profile_picture_url: profile.profile_picture_url,
      native_languages: profile.native_languages,
      learning_languages: profile.learning_languages,
      interests: profile.interests,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('profiles').upsert(updates);
    setSaving(false);
    if (error) {
      Alert.alert('Error', 'Could not save profile.');
    } else {
      Alert.alert('Success', 'Profile updated!');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" /></View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>My Profile</Text>
      <ProfilePictureUpload
        currentImageUrl={profile.profile_picture_url}
        onUpload={handleProfilePictureUpload}
        uploadProgress={uploadProgress}
      />
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={profile.name}
        onChangeText={(text) => setProfile((prev) => ({ ...prev, name: text }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Age"
        value={profile.age}
        keyboardType="numeric"
        onChangeText={(text) => setProfile((prev) => ({ ...prev, age: text }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Gender (optional)"
        value={profile.gender}
        onChangeText={(text) => setProfile((prev) => ({ ...prev, gender: text }))}
      />
      {/* City Dropdown */}
      <View style={styles.dropdownContainer}>
        <Text style={styles.label}>City</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {cities.map((city) => (
            <TouchableOpacity
              key={city}
              style={[
                styles.cityChip,
                profile.city === city && styles.selectedCityChip,
              ]}
              onPress={() => setProfile((prev) => ({ ...prev, city }))}
            >
              <Text style={profile.city === city ? styles.selectedCityText : styles.cityText}>{city}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {/* Native Languages */}
      <LanguageSelector
        title="Native Languages"
        selectedLanguages={profile.native_languages}
        onSelectionChange={(langs) => setProfile((prev) => ({ ...prev, native_languages: langs }))}
        isNative
      />
      {/* Learning Languages */}
      <LanguageSelector
        title="Learning Languages"
        selectedLanguages={profile.learning_languages}
        onSelectionChange={(langs) => setProfile((prev) => ({ ...prev, learning_languages: langs }))}
      />
      {/* Interests */}
      <InterestSelector
        selectedInterests={profile.interests}
        onSelectionChange={(interests) => setProfile((prev) => ({ ...prev, interests }))}
      />
      {/* Bio */}
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Bio (optional)"
        value={profile.bio}
        onChangeText={(text) => setProfile((prev) => ({ ...prev, bio: text }))}
        multiline
      />
      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
      </TouchableOpacity>
      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  dropdownContainer: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cityChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  selectedCityChip: {
    backgroundColor: '#007AFF',
  },
  cityText: {
    color: '#333',
  },
  selectedCityText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    borderWidth: 1,
    borderColor: '#bbb',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
    width: 'auto',
    backgroundColor: 'transparent',
    alignSelf: 'center',
  },
  saveButtonText: {
    color: '#222',
    fontSize: 15,
    fontWeight: '500',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#bbb',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
    width: 'auto',
    backgroundColor: 'transparent',
    alignSelf: 'center',
  },
  logoutButtonText: {
    color: '#222',
    fontSize: 15,
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 