import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface Message {
    id: string;
    sender_id: string;
    recipient_id: string;
    message: string;
    is_read: boolean;
    created_at: string;
    sender?: {
        username: string;
        display_name: string;
        avatar_url?: string;
    };
}

interface Conversation {
    id: string;
    participant_1_id: string;
    participant_2_id: string;
    last_message_at: string;
    last_message_preview: string;
    other_user?: {
        id: string;
        username: string;
        display_name: string;
        avatar_url?: string;
        is_available_for_work: boolean;
    };
}

export default function DirectMessaging() {
    const { userId } = useParams<{ userId?: string }>();
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchConversations();
        
        // Subscribe to new messages
        const subscription = supabase
            .channel('direct_messages')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'direct_messages' },
                (payload) => {
                    if (payload.new.conversation_id === selectedConversation) {
                        setMessages(prev => [...prev, payload.new as Message]);
                        scrollToBottom();
                    }
                    // Refresh conversations to update last message
                    fetchConversations();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [selectedConversation, userProfile]);

    useEffect(() => {
        if (userId && userProfile) {
            // If userId provided in URL, find or create conversation
            findOrCreateConversation(userId);
        }
    }, [userId, userProfile]);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation);
            markMessagesAsRead(selectedConversation);
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        if (!userProfile) return;

        try {
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    *,
                    participant_1:profiles!conversations_participant_1_id_fkey(*),
                    participant_2:profiles!conversations_participant_2_id_fkey(*)
                `)
                .or(`participant_1_id.eq.${userProfile.id},participant_2_id.eq.${userProfile.id}`)
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            const conversationsWithUsers: Conversation[] = data.map((conv: any) => {
                const otherUser = conv.participant_1_id === userProfile.id 
                    ? conv.participant_2 
                    : conv.participant_1;

                return {
                    ...conv,
                    other_user: {
                        id: otherUser.id,
                        username: otherUser.username,
                        display_name: otherUser.display_name || `${otherUser.first_name} ${otherUser.last_name}`,
                        avatar_url: otherUser.avatar_url,
                        is_available_for_work: otherUser.is_available_for_work
                    }
                };
            });

            setConversations(conversationsWithUsers);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const findOrCreateConversation = async (otherUserId: string) => {
        if (!userProfile) return;

        try {
            // Try to find existing conversation
            const { data: existing, error: findError } = await supabase
                .from('conversations')
                .select('id')
                .or(`and(participant_1_id.eq.${userProfile.id},participant_2_id.eq.${otherUserId}),and(participant_1_id.eq.${otherUserId},participant_2_id.eq.${userProfile.id})`)
                .single();

            if (existing) {
                setSelectedConversation(existing.id);
                return;
            }

            // Create new conversation
            const { data: newConv, error: createError } = await supabase
                .from('conversations')
                .insert({
                    participant_1_id: userProfile.id,
                    participant_2_id: otherUserId
                })
                .select()
                .single();

            if (createError) throw createError;

            setSelectedConversation(newConv.id);
            fetchConversations(); // Refresh list
        } catch (error) {
            console.error('Error finding/creating conversation:', error);
        }
    };

    const fetchMessages = async (conversationId: string) => {
        try {
            const { data, error } = await supabase
                .from('direct_messages')
                .select(`
                    *,
                    sender:profiles!direct_messages_sender_id_fkey(username, display_name, avatar_url)
                `)
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const markMessagesAsRead = async (conversationId: string) => {
        if (!userProfile) return;

        try {
            await supabase
                .from('direct_messages')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('conversation_id', conversationId)
                .eq('recipient_id', userProfile.id)
                .eq('is_read', false);
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || !userProfile) return;

        setSending(true);
        try {
            const conversation = conversations.find(c => c.id === selectedConversation);
            if (!conversation) return;

            const recipientId = conversation.participant_1_id === userProfile.id
                ? conversation.participant_2_id
                : conversation.participant_1_id;

            const { error } = await supabase
                .from('direct_messages')
                .insert({
                    conversation_id: selectedConversation,
                    sender_id: userProfile.id,
                    recipient_id: recipientId,
                    message: newMessage.trim()
                });

            if (error) throw error;

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatMessageTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else if (diffInHours < 168) {
            return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const selectedConv = conversations.find(c => c.id === selectedConversation);

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Conversations List */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                        <button
                            onClick={() => navigate('/community')}
                            className="text-blue-600 hover:text-blue-700"
                        >
                            <span className="material-icons">add_circle</span>
                        </button>
                    </div>
                    <div className="relative">
                        <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Search messages..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="text-center py-8 px-4">
                            <span className="material-icons text-gray-400 text-5xl mb-2">chat_bubble_outline</span>
                            <p className="text-gray-600 text-sm">No conversations yet</p>
                            <button
                                onClick={() => navigate('/community')}
                                className="mt-4 text-blue-600 text-sm hover:underline"
                            >
                                Browse Community
                            </button>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv.id)}
                                className={`w-full p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left ${
                                    selectedConversation === conv.id ? 'bg-blue-50' : ''
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                                        {conv.other_user?.display_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-gray-900 truncate">
                                                {conv.other_user?.display_name}
                                            </h3>
                                            <span className="text-xs text-gray-500">
                                                {formatMessageTime(conv.last_message_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 truncate">
                                            {conv.last_message_preview || 'No messages yet'}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
                {selectedConv ? (
                    <>
                        {/* Header */}
                        <div className="bg-white border-b border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                        {selectedConv.other_user?.display_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {selectedConv.other_user?.display_name}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            @{selectedConv.other_user?.username}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/profile/${selectedConv.other_user?.username}`)}
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    <span className="material-icons">info</span>
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => {
                                const isOwn = msg.sender_id === userProfile?.id;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                                            <div
                                                className={`rounded-lg p-3 ${
                                                    isOwn
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-200 text-gray-900'
                                                }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 px-1">
                                                {formatMessageTime(msg.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="bg-white border-t border-gray-200 p-4">
                            <div className="flex gap-2">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type a message..."
                                    rows={1}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim() || sending}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className="material-icons">send</span>
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center p-8">
                        <div>
                            <span className="material-icons text-gray-400 text-6xl mb-4">chat</span>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
                            <p className="text-gray-600 mb-6">
                                Choose a conversation from the list or start a new one
                            </p>
                            <button
                                onClick={() => navigate('/community')}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Browse Community
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
