import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';

interface Conversation {
  user_id: string;
  name: string;
  profile_picture_url: string | null;
  last_message: string;
  last_message_time: string;
  is_unread: boolean;
  signedUrl: string | null;
}

export default function ChatScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  const getPublicUrl = async (url: string) => {
    if (!url) return null;
    
    try {
      const parts = url.split('/');
      const filePath = parts.slice(parts.indexOf('profile-pictures') + 1).join('/');
      
      const { data, error } = await supabase.storage
        .from('profile-pictures')
        .createSignedUrl(filePath, 3600);

      if (error) {
        console.error('Error getting signed URL:', error);
        return null;
      }

      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error in getPublicUrl:', error);
      return null;
    }
  };

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchConversations = async () => {
      // Get all messages where the user is sender or receiver
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Group messages by conversation partner
      const conversationsMap: { [userId: string]: Conversation } = {};
      for (const msg of messages) {
        const otherUserId = msg.sender_id === session.user.id ? msg.receiver_id : msg.sender_id;
        
        // Only update if this is the first message or a newer message
        if (!conversationsMap[otherUserId] || 
            new Date(msg.created_at) > new Date(conversationsMap[otherUserId].last_message_time)) {
          conversationsMap[otherUserId] = {
            user_id: otherUserId,
            name: '',
            profile_picture_url: null,
            last_message: msg.content,
            last_message_time: msg.created_at,
            is_unread: msg.sender_id !== session.user.id && !msg.read_at,
            signedUrl: null,
          };
        }
      }

      // Fetch profile info for all conversation partners
      const userIds = Object.keys(conversationsMap);
      if (userIds.length === 0) {
        setConversations([]);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, profile_picture_url')
        .in('id', userIds);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        return;
      }

      // Update conversations with profile info and get signed URLs
      const updatedConversations = await Promise.all(
        profiles.map(async (profile) => {
          if (conversationsMap[profile.id]) {
            const signedUrl = profile.profile_picture_url ? 
              await getPublicUrl(profile.profile_picture_url) : null;
            
            return {
              ...conversationsMap[profile.id],
              name: profile.name || 'Unknown User',
              profile_picture_url: profile.profile_picture_url,
              signedUrl,
            } as Conversation;
          }
          return null;
        })
      );

      // Filter out null values and sort by last message time
      const validConversations = updatedConversations
        .filter((conv): conv is Conversation => conv !== null)
        .sort((a, b) => 
          new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
        );

      setConversations(validConversations);
    };

    fetchConversations();
    
    // Set up real-time subscription for new messages and updates
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id})`,
        },
        (payload) => {
          // Only refresh if it's an UPDATE event (read_at changes) or INSERT event
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            fetchConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const handleConversationPress = async (userId: string) => {
    // Mark messages as read before navigating
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('receiver_id', session?.user?.id)
      .eq('sender_id', userId)
      .is('read_at', null);
    
    router.push(`/chat/${userId}`);
  };

  const renderProfileImage = (conversation: Conversation) => {
    if (conversation.signedUrl) {
      return (
        <Image
          source={{ 
            uri: conversation.signedUrl,
            cache: 'reload'
          }}
          style={styles.profileImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      );
    }
    return (
      <View style={[styles.profileImage, styles.placeholderImage]}>
        <FontAwesome name="user" size={24} color="#666" />
      </View>
    );
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
            {renderProfileImage(item)}
            <View style={styles.conversationInfo}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.lastMessage} numberOfLines={1}>{item.last_message}</Text>
            </View>
            <View style={styles.rightSection}>
              <Text style={styles.timeText}>{new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              {item.is_unread && <View style={styles.unreadDot} />}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>No conversations yet.</Text>}
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
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    marginRight: 14,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  rightSection: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2196F3',
    alignSelf: 'flex-end',
  },
}); 