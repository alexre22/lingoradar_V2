import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

interface ProfilePictureUploadProps {
  currentImageUrl: string | null;
  onUpload: (uri: string) => Promise<string>;
  uploadProgress: number;
}

export default function ProfilePictureUpload({
  currentImageUrl,
  onUpload,
  uploadProgress,
}: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(currentImageUrl);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    setImageUrl(currentImageUrl);
    setImageError(false);
    if (currentImageUrl) {
      getSignedUrl(currentImageUrl);
    }
  }, [currentImageUrl]);

  const getSignedUrl = async (url: string) => {
    try {
      // Extract the file path from the URL
      // The URL format is: https://[project].supabase.co/storage/v1/object/public/profile-pictures/[user_id]/[filename]
      const parts = url.split('/');
      const filePath = parts.slice(parts.indexOf('profile-pictures') + 1).join('/');
      
      console.log('Attempting to get signed URL for path:', filePath); // Debug log

      const { data, error } = await supabase.storage
        .from('profile-pictures')
        .createSignedUrl(filePath, 3600);

      if (error) {
        console.error('Error getting signed URL:', error);
        console.error('Attempted file path:', filePath); // Debug log
        setImageError(true);
        return;
      }

      if (data?.signedUrl) {
        console.log('Generated signed URL:', data.signedUrl); // Debug log
        setSignedUrl(data.signedUrl);
      }
    } catch (error) {
      console.error('Error in getSignedUrl:', error);
      setImageError(true);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        setImageError(false);
        const uploadedUrl = await onUpload(result.assets[0].uri);
        console.log('Uploaded URL:', uploadedUrl);
        setImageUrl(uploadedUrl);
        await getSignedUrl(uploadedUrl);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageError = (error: any) => {
    console.error('Image loading error:', error);
    console.error('Failed URL:', signedUrl);
    setImageError(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage} disabled={isUploading}>
        <View style={styles.imageContainer}>
          {signedUrl && !imageError ? (
            <Image
              source={signedUrl}
              style={styles.image}
              contentFit="cover"
              transition={200}
              onError={handleImageError}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.placeholder}>
              <FontAwesome name="user" size={40} color="#666" />
            </View>
          )}
          
          {isUploading && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color="#fff" />
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${uploadProgress * 100}%` },
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
      {imageError && (
        <Text style={styles.errorText}>Failed to load image. Tap to try again.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    position: 'absolute',
    bottom: 20,
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  errorText: {
    color: 'red',
    marginTop: 8,
    fontSize: 12,
  },
}); 