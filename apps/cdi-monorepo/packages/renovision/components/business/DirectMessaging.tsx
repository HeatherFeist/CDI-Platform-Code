import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../supabase';

interface DirectMessage {
    id: string;
    sender_id: string;
    recipient_id: string;
    subject: string | null;
    content: string;
    message_type: string;
    metadata: any;
    read: boolean;
    read_at: string | null;
    replied_to: string | null;
    created_at: string;
    sender?: {
        first_name: string;
        last_name: string;
        avatar_url?: string;
    };
    recipient?: {
        first_name: string;
        last_name: string;
        avatar_url?: string;
    };
}

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    data: any;
    read: boolean;
    created_at: string;
    sender?: {
        first_name: string;
        last_name: string;
    };
}

interface DirectMessagingProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DirectMessaging: React.FC<DirectMessagingProps> = ({ isOpen, onClose }) => {
    const { userProfile } = useAuth();
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('notifications');
    const [selectedMessage, setSelectedMessage] = useState<DirectMessage | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (isOpen && userProfile) {
            loadMessages();
            loadNotifications();
            setupRealtimeSubscriptions();
        }
    }, [isOpen, userProfile]);

    const loadMessages = async () => {
        if (!userProfile) return;

        try {
            const { data, error } = await supabase
                .from('direct_messages')
                .select(`
                    *,
                    sender:sender_id(first_name, last_name, avatar_url),
                    recipient:recipient_id(first_name, last_name, avatar_url)
                `)
                .or(`sender_id.eq.${userProfile.id},recipient_id.eq.${userProfile.id}`)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const loadNotifications = async () => {
        if (!userProfile) return;

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select(`
                    *,
                    sender:sender_id(first_name, last_name)
                `)
                .eq('recipient_id', userProfile.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setNotifications(data || []);
            
            // Count unread
            const unread = (data || []).filter(n => !n.read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const setupRealtimeSubscriptions = () => {
        if (!userProfile) return;

        // Subscribe to new messages
        const messageChannel = supabase
            .channel(`messages:${userProfile.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `recipient_id=eq.${userProfile.id}`
                },
                (payload) => {
                    console.log('New message received:', payload);
                    loadMessages();
                }
            )
            .subscribe();

        // Subscribe to new notifications
        const notificationChannel = supabase
            .channel(`notifications:${userProfile.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${userProfile.id}`
                },
                (payload) => {
                    console.log('New notification received:', payload);
                    loadNotifications();
                    // Could show toast notification here
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(messageChannel);
            supabase.removeChannel(notificationChannel);
        };
    };

    const markMessageAsRead = async (messageId: string) => {
        try {
            const { error } = await supabase
                .from('direct_messages')
                .update({ 
                    read: true, 
                    read_at: new Date().toISOString() 
                })
                .eq('id', messageId)
                .eq('recipient_id', userProfile?.id);

            if (error) throw error;

            // Update local state
            setMessages(prev => prev.map(msg => 
                msg.id === messageId 
                    ? { ...msg, read: true, read_at: new Date().toISOString() }
                    : msg
            ));
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    };

    const markNotificationAsRead = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ 
                    read: true, 
                    read_at: new Date().toISOString() 
                })
                .eq('id', notificationId);

            if (error) throw error;

            // Update local state
            setNotifications(prev => prev.map(notif => 
                notif.id === notificationId 
                    ? { ...notif, read: true }
                    : notif
            ));

            // Update unread count
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const sendReply = async () => {
        if (!selectedMessage || !replyContent.trim() || !userProfile) return;

        try {
            const reply = {
                sender_id: userProfile.id,
                recipient_id: selectedMessage.sender_id === userProfile.id 
                    ? selectedMessage.recipient_id 
                    : selectedMessage.sender_id,
                subject: selectedMessage.subject?.startsWith('Re:') 
                    ? selectedMessage.subject 
                    : `Re: ${selectedMessage.subject || 'Your message'}`,
                content: replyContent,
                message_type: selectedMessage.message_type,
                replied_to: selectedMessage.id,
                metadata: selectedMessage.metadata
            };

            const { error } = await supabase
                .from('direct_messages')
                .insert(reply);

            if (error) throw error;

            setReplyContent('');
            setSelectedMessage(null);
            loadMessages();
        } catch (error) {
            console.error('Error sending reply:', error);
            alert('Failed to send reply. Please try again.');
        }
    };

    const handleTaskInvitationResponse = async (notificationId: string, invitationId: string, response: 'accepted' | 'declined') => {
        try {
            // Call the database function to respond to invitation
            const { error } = await supabase.rpc('respond_to_task_invitation', {
                p_invitation_id: invitationId,
                p_status: response,
                p_response_message: response === 'accepted' 
                    ? 'I accept this task assignment.' 
                    : 'I cannot take on this task at this time.'
            });

            if (error) throw error;

            // Mark notification as read
            await markNotificationAsRead(notificationId);

            // Reload notifications
            loadNotifications();

            alert(`Task invitation ${response} successfully!`);
        } catch (error) {
            console.error('Error responding to task invitation:', error);
            alert('Failed to respond to invitation. Please try again.');
        }
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'task_invitation': return 'assignment';
            case 'task_response': return 'assignment_turned_in';
            case 'message': return 'message';
            case 'project_update': return 'update';
            default: return 'notifications';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-gray-900">Messages & Notifications</h2>
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm">
                                {unreadCount} unread
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`px-6 py-3 font-medium border-b-2 ${
                            activeTab === 'notifications'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`px-6 py-3 font-medium border-b-2 ${
                            activeTab === 'messages'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Messages
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {activeTab === 'notifications' && (
                        <div className="h-full overflow-y-auto p-6">
                            {loading ? (
                                <div className="flex justify-center items-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <span className="material-icons text-4xl mb-2 opacity-50">notifications_none</span>
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 border rounded-lg ${
                                                notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <span className={`material-icons text-2xl ${
                                                        notification.read ? 'text-gray-400' : 'text-blue-600'
                                                    }`}>
                                                        {getNotificationIcon(notification.type)}
                                                    </span>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">
                                                            {notification.title}
                                                        </h4>
                                                        <p className="text-gray-600 mt-1">
                                                            {notification.message}
                                                        </p>
                                                        {notification.sender && (
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                From: {notification.sender.first_name} {notification.sender.last_name}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {formatTime(notification.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {!notification.read && (
                                                        <button
                                                            onClick={() => markNotificationAsRead(notification.id)}
                                                            className="text-sm text-blue-600 hover:text-blue-800"
                                                        >
                                                            Mark as read
                                                        </button>
                                                    )}
                                                    {notification.type === 'task_invitation' && notification.data?.invitation_id && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleTaskInvitationResponse(
                                                                    notification.id, 
                                                                    notification.data.invitation_id, 
                                                                    'accepted'
                                                                )}
                                                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleTaskInvitationResponse(
                                                                    notification.id, 
                                                                    notification.data.invitation_id, 
                                                                    'declined'
                                                                )}
                                                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                                            >
                                                                Decline
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'messages' && (
                        <div className="h-full flex">
                            {/* Message List */}
                            <div className="w-1/2 border-r overflow-y-auto">
                                {messages.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <span className="material-icons text-4xl mb-2 opacity-50">message</span>
                                        <p>No messages yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {messages.map((message) => {
                                            const isReceived = message.recipient_id === userProfile?.id;
                                            const otherPerson = isReceived ? message.sender : message.recipient;
                                            
                                            return (
                                                <div
                                                    key={message.id}
                                                    onClick={() => {
                                                        setSelectedMessage(message);
                                                        if (isReceived && !message.read) {
                                                            markMessageAsRead(message.id);
                                                        }
                                                    }}
                                                    className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
                                                        selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                                                    } ${isReceived && !message.read ? 'bg-blue-25 border-l-4 border-l-blue-500' : ''}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {otherPerson ? `${otherPerson.first_name} ${otherPerson.last_name}` : 'Unknown'}
                                                            </p>
                                                            <p className="text-sm text-gray-600 truncate">
                                                                {message.subject || 'No subject'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {formatTime(message.created_at)}
                                                            </p>
                                                        </div>
                                                        {isReceived && !message.read && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Message Detail */}
                            <div className="w-1/2 flex flex-col">
                                {selectedMessage ? (
                                    <>
                                        <div className="p-6 border-b flex-1 overflow-y-auto">
                                            <div className="mb-4">
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {selectedMessage.subject || 'No subject'}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {formatTime(selectedMessage.created_at)}
                                                </p>
                                            </div>
                                            <div className="prose prose-sm max-w-none">
                                                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                                            </div>
                                        </div>
                                        
                                        {/* Reply Section */}
                                        <div className="p-4 border-t bg-gray-50">
                                            <textarea
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                placeholder="Type your reply..."
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                                            />
                                            <div className="flex justify-end mt-2">
                                                <button
                                                    onClick={sendReply}
                                                    disabled={!replyContent.trim()}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Send Reply
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        <div className="text-center">
                                            <span className="material-icons text-4xl mb-2 opacity-50">select_all</span>
                                            <p>Select a message to view</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DirectMessaging;