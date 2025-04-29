import React from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { FontAwesome, Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read_at?: string;
  delivered_at?: string;
}

interface ChatPartner {
  name: string;
  profile_picture_url: string | null;
  city: string | null;
}

export default function ChatRoom() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [chatPartner, setChatPartner] = useState<ChatPartner | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
      }
    };
    getSession();
  }, []);

  useEffect(() => {
    if (!currentUserId || !id) return;

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const { data: partnerData, error: partnerError } = await supabase
          .from('profiles')
          .select('name, profile_picture_url, city')
          .eq('id', id)
          .single();

        if (partnerError) {
          console.error('Error fetching chat partner:', partnerError);
          return;
        }

        setChatPartner(partnerData);
        
        if (partnerData.profile_picture_url) {
          const signedUrl = await getPublicUrl(partnerData.profile_picture_url);
          setSignedUrl(signedUrl);
        }

        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${currentUserId})`)
          .order('created_at', { ascending: false });

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          return;
        }

        // Update read status for received messages
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('receiver_id', currentUserId)
          .eq('sender_id', id)
          .is('read_at', null);

        setMessages(messagesData || []);
      } catch (error) {
        console.error('Error in fetchInitialData:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    const channel = supabase
      .channel('chat-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${id},receiver_id.eq.${currentUserId}),and(sender_id.eq.${currentUserId},receiver_id.eq.${id}))`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message;
            // If we're the receiver, mark the message as delivered
            if (newMessage.receiver_id === currentUserId) {
              await supabase
                .from('messages')
                .update({ delivered_at: new Date().toISOString() })
                .eq('id', newMessage.id);
            }
            setMessages(prev => {
              if (prev.some(msg => msg.id === newMessage.id)) {
                return prev;
              }
              return [newMessage, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as Message;
            setMessages(prev => 
              prev.map(msg => 
                msg.id === updatedMessage.id ? updatedMessage : msg
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, currentUserId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !id) return;

    try {
      const messageContent = newMessage;
      setNewMessage('');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: messageContent,
          sender_id: currentUserId,
          receiver_id: id,
          created_at: new Date().toISOString(),
          delivered_at: null, // Initially not delivered
          read_at: null // Initially not read
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        setNewMessage(messageContent);
        return;
      }

      // Add the message with initial status (single check)
      setMessages(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
  };

  const renderMessageStatus = (message: Message) => {
    if (message.sender_id === currentUserId) {
      return (
        <View style={styles.messageStatus}>
          {message.read_at ? (
            <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
          ) : (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      );
    }
    return null;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === currentUserId;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
        ]}>
          {item.content}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timeText,
            isOwnMessage ? styles.ownTimeText : styles.otherTimeText,
          ]}>
            {new Date(item.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
          {renderMessageStatus(item)}
        </View>
      </View>
    );
  };

  const renderProfileImage = () => {
    if (signedUrl) {
      return (
        <Image
          source={{ 
            uri: signedUrl,
            cache: 'reload'
          }}
          style={styles.headerProfileImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      );
    }
    return (
      <View style={[styles.headerProfileImage, styles.placeholderImage]}>
        <FontAwesome name="user" size={24} color="#666" />
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <FontAwesome name="chevron-left" size={24} color="#2196F3" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <View style={styles.profileContainer}>
              {renderProfileImage()}
              <View style={styles.profileInfo}>
                <Text style={styles.headerName}>{chatPartner?.name || 'Loading...'}</Text>
                {chatPartner?.city && (
                  <Text style={styles.locationText}>{chatPartner.city}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : (
          <>
            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              inverted
            />
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type a message..."
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !newMessage.trim() && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!newMessage.trim()}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerLeft: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 8,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 12,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  headerProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  timeText: {
    fontSize: 12,
    marginTop: 4,
  },
  ownTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimeText: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageStatus: {
    marginLeft: 4,
  },
  messageStatusContainer: {
    marginLeft: 4,
  },
  doubleCheckContainer: {
    flexDirection: 'row',
  },
  secondCheck: {
    marginLeft: -3,
  },
}); 