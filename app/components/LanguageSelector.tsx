import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { supabase } from '../lib/supabase';

interface Language {
  id: number;
  name: string;
  code: string;
}

interface LanguageSelectorProps {
  title: string;
  selectedLanguages: number[];
  onSelectionChange: (languageIds: number[]) => void;
  isNative?: boolean;
}

export default function LanguageSelector({
  title,
  selectedLanguages,
  onSelectionChange,
  isNative = false,
}: LanguageSelectorProps) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('id, name, code')
        .order('name');

      if (error) throw error;
      setLanguages(data || []);
    } catch (error) {
      console.error('Error fetching languages:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = (languageId: number) => {
    const newSelection = selectedLanguages.includes(languageId)
      ? selectedLanguages.filter(id => id !== languageId)
      : [...selectedLanguages, languageId];
    onSelectionChange(newSelection);
  };

  if (loading) {
    return <Text>Loading languages...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chipContainer}>
        {languages.map((language) => (
          <Chip
            key={language.id}
            selected={selectedLanguages.includes(language.id)}
            onPress={() => toggleLanguage(language.id)}
            style={styles.chip}
            mode="outlined"
          >
            {language.name}
          </Chip>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    margin: 4,
  },
}); 