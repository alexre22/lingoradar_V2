import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';

export interface Profile {
  id: string;
  display_name: string;
  age: number | null;
  gender: string | null;
  city: string | null;
  bio: string | null;
  profile_picture_url: string | null;
}

export interface Language {
  id: number;
  name: string;
  code: string;
}

export interface Interest {
  id: number;
  name: string;
}

export function useProfile(session: Session | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [nativeLanguages, setNativeLanguages] = useState<number[]>([]);
  const [learningLanguages, setLearningLanguages] = useState<number[]>([]);
  const [interests, setInterests] = useState<number[]>([]);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
      fetchLanguagePreferences();
      fetchInterests();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLanguagePreferences = async () => {
    try {
      const { data: nativeData, error: nativeError } = await supabase
        .from('user_languages')
        .select('language_id')
        .eq('user_id', session?.user.id)
        .eq('is_native', true);

      if (nativeError) throw nativeError;

      const { data: learningData, error: learningError } = await supabase
        .from('user_languages')
        .select('language_id')
        .eq('user_id', session?.user.id)
        .eq('is_native', false);

      if (learningError) throw learningError;

      setNativeLanguages(nativeData?.map(item => item.language_id) || []);
      setLearningLanguages(learningData?.map(item => item.language_id) || []);
    } catch (error) {
      console.error('Error fetching language preferences:', error);
    }
  };

  const fetchInterests = async () => {
    try {
      console.log('useProfile: Fetching user interests...');
      const { data, error } = await supabase
        .from('user_interests')
        .select('interest_id')
        .eq('user_id', session?.user.id);

      if (error) {
        console.error('useProfile: Error fetching interests:', error);
        throw error;
      }
      console.log('useProfile: Fetched user interests:', data);
      setInterests(data?.map(item => item.interest_id) || []);
    } catch (error) {
      console.error('useProfile: Error in fetchInterests:', error);
    }
  };

  const updateLanguagePreferences = async (
    languageIds: number[],
    isNative: boolean
  ) => {
    try {
      // Delete existing preferences for this type
      const { error: deleteError } = await supabase
        .from('user_languages')
        .delete()
        .eq('user_id', session?.user.id)
        .eq('is_native', isNative);

      if (deleteError) throw deleteError;

      // Insert new preferences
      if (languageIds.length > 0) {
        const { error: insertError } = await supabase
          .from('user_languages')
          .insert(
            languageIds.map(languageId => ({
              user_id: session?.user.id,
              language_id: languageId,
              is_native: isNative,
            }))
          );

        if (insertError) throw insertError;
      }

      // Update local state
      if (isNative) {
        setNativeLanguages(languageIds);
      } else {
        setLearningLanguages(languageIds);
      }

      return true;
    } catch (error) {
      console.error('Error updating language preferences:', error);
      return false;
    }
  };

  const updateInterests = async (interestIds: number[]) => {
    try {
      console.log('useProfile: Updating interests with:', interestIds);
      
      // Delete existing interests
      const { error: deleteError } = await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', session?.user.id);

      if (deleteError) {
        console.error('useProfile: Error deleting interests:', deleteError);
        throw deleteError;
      }

      // Insert new interests
      if (interestIds.length > 0) {
        const { error: insertError } = await supabase
          .from('user_interests')
          .insert(
            interestIds.map(interestId => ({
              user_id: session?.user.id,
              interest_id: interestId,
            }))
          );

        if (insertError) {
          console.error('useProfile: Error inserting interests:', insertError);
          throw insertError;
        }
      }

      console.log('useProfile: Successfully updated interests');
      setInterests(interestIds);
      return true;
    } catch (error) {
      console.error('useProfile: Error in updateInterests:', error);
      return false;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session?.user.id);

      if (error) throw error;
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  const uploadProfilePicture = async (uri: string) => {
    try {
      // Convert the image to base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Get the file extension
      const fileExt = uri.split('.').pop();
      const fileName = `${session?.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${session?.user.id}/${fileName}`;

      // Upload the file to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Update the profile with the new picture URL
      await updateProfile({ profile_picture_url: publicUrl });
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  };

  // Helper function to decode base64
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  return {
    profile,
    loading,
    uploadProgress,
    nativeLanguages,
    learningLanguages,
    interests,
    updateProfile,
    uploadProfilePicture,
    updateLanguagePreferences,
    updateInterests,
    fetchProfile,
    fetchLanguagePreferences,
    fetchInterests,
  };
} 