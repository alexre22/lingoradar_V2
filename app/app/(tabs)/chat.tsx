import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { Session } from '@supabase/supabase-js';

interface Conversation {
  user_id: string;
  name: string;
  last_message?: string;
  last_message_time?: string;
}

export default function ChatScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Fetch conversations (for now, just fetch all profiles as potential chat partners)
    const fetchConversations = async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name')
        .neq('id', session?.user?.id);

      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }

      const conversationList = profiles.map((profile: any) => ({
        user_id: profile.id,
        name: profile.name || 'Unknown User',
      }));

      setConversations(conversationList);
    };

    if (session) {
      fetchConversations();
    }
  }, [session]);

  const handleConversationPress = (userId: string) => {
    router.push(`/chat/${userId}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.user_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => handleConversationPress(item.user_id)}
          >
            <View>
              <Text style={styles.userName}>{item.name}</Text>
              {item.last_message && (
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.last_message}
                </Text>
              )}
            </View>
            {item.last_message_time && (
              <Text style={styles.timeText}>{item.last_message_time}</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
}); 