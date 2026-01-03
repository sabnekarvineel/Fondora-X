import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL;
import SocketContext from '../context/SocketContext';
import {
    encryptMessage,
    decryptMessage,
    getOrCreateConversationKey,
} from '../utils/encryption';
import {
    readFileAsArrayBuffer,
    encryptMedia,
    downloadAndDecryptMedia,
    revokeMediaURL,
} from '../utils/mediaEncryption';

const ChatBox = ({ conversation, onConversationUpdate, onShowSidebar, onCloseChat }) => {
    const { user } = useContext(AuthContext);
    const { socket, onlineUsers } = useContext(SocketContext);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [messages, setMessages] = useState([]);
    const [decryptedMessages, setDecryptedMessages] = useState({});
    const [decryptedMediaUrls, setDecryptedMediaUrls] = useState({});
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [typing, setTyping] = useState(false);
    const [mediaFile, setMediaFile] = useState(null);
    const [encryptionKey, setEncryptionKey] = useState(null);
    const [encryptionReady, setEncryptionReady] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editingContent, setEditingContent] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
    const [profileClicked, setProfileClicked] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const menuRef = useRef(null);
    const headerMenuRef = useRef(null);

    // Initialize encryption key for this conversation
    useEffect(() => {
        const initEncryption = async () => {
            if (conversation?._id) {
                try {
                    const key = await getOrCreateConversationKey(conversation._id);
                    setEncryptionKey(key);
                    setEncryptionReady(true);
                } catch (error) {
                    console.error('Failed to initialize encryption:', error);
                    setEncryptionReady(false);
                }
            }
        };
        initEncryption();
    }, [conversation?._id]);

    // Decrypt messages when they change or when encryption key is ready
    const decryptMessages = useCallback(async (msgs) => {
        if (!encryptionKey || !msgs.length) return;

        const decrypted = {};
        for (const msg of msgs) {
            if (msg.isEncrypted && msg.content) {
                try {
                    decrypted[msg._id] = await decryptMessage(msg.content, encryptionKey);
                } catch (error) {
                    decrypted[msg._id] = '[Unable to decrypt]';
                }
            } else {
                decrypted[msg._id] = msg.content;
            }
        }
        setDecryptedMessages(decrypted);
    }, [encryptionKey]);

    useEffect(() => {
        if (encryptionReady && messages.length > 0) {
            decryptMessages(messages);

            // Decrypt media messages
            messages.forEach(async (message) => {
                if (message.encryptedMediaUrl && message.mediaIv && !decryptedMediaUrls[message._id]) {
                    try {
                        const mediaUrl = await downloadAndDecryptMedia(
                            message.encryptedMediaUrl,
                            message.mediaIv,
                            encryptionKey,
                            message.mediaMimeType
                        );
                        setDecryptedMediaUrls((prev) => ({
                            ...prev,
                            [message._id]: mediaUrl,
                        }));
                    } catch (error) {
                        console.error('Failed to decrypt media:', error);
                    }
                }
            });
        }
    }, [messages, encryptionReady, decryptMessages, encryptionKey, decryptedMediaUrls]);

    useEffect(() => {
        if (conversation) {
            fetchMessages();
            markAsSeen();
        }
    }, [conversation]);

    useEffect(() => {
        if (socket) {
            socket.on('receiveMessage', async (message) => {
                if (message.conversation === conversation?._id) {
                    setMessages((prev) => [...prev, message]);

                    // Decrypt the new message
                    if (message.isEncrypted && encryptionKey) {
                        try {
                            const decrypted = await decryptMessage(message.content, encryptionKey);
                            setDecryptedMessages((prev) => ({
                                ...prev,
                                [message._id]: decrypted,
                            }));
                        } catch (error) {
                            setDecryptedMessages((prev) => ({
                                ...prev,
                                [message._id]: '[Unable to decrypt]',
                            }));
                        }
                    } else {
                        setDecryptedMessages((prev) => ({
                            ...prev,
                            [message._id]: message.content,
                        }));
                    }

                    markAsSeen();
                    scrollToBottom();
                }
            });

            socket.on('userTyping', ({ conversationId }) => {
                if (conversationId === conversation?._id) {
                    setTyping(true);
                }
            });

            socket.on('userStoppedTyping', ({ conversationId }) => {
                if (conversationId === conversation?._id) {
                    setTyping(false);
                }
            });

            socket.on('messageMarkedAsSeen', (messageId) => {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === messageId ? { ...msg, seen: true } : msg
                    )
                );
            });
        }

        return () => {
            if (socket) {
                socket.off('receiveMessage');
                socket.off('userTyping');
                socket.off('userStoppedTyping');
                socket.off('messageMarkedAsSeen');
            }
        };
    }, [socket, conversation, encryptionKey]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Cleanup: revoke object URLs when component unmounts or media URLs change
    useEffect(() => {
        return () => {
            Object.values(decryptedMediaUrls).forEach(url => revokeMediaURL(url));
        };
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
            if (headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
                setHeaderMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close profile when opening chat
    useEffect(() => {
        if (conversation) {
            setProfileClicked(false);
        }
    }, [conversation]);

    // Handle window resize for mobile detection
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const token = user?.token;
            const { data } = await axios.get(
                `${API}/api/messages/conversation/${conversation._id}/messages`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setMessages(data.messages);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const markAsSeen = async () => {
        try {
            const token = user?.token;
            await axios.put(
            `${API}/api/messages/${messageId}`,
            { content: encryptedContent, isEncrypted: true },
            { headers: { Authorization: `Bearer ${token}` } }
            );

        } catch (error) {
            console.error(error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim() && !mediaFile) return;
        if (!encryptionReady) {
            alert('Encryption not ready. Please wait.');
            return;
        }

        try {
            const token = user?.token;
            let encryptedMediaUrl = '';
            let mediaIv = '';
            let originalFileName = '';
            let mediaMimeType = '';
            let messageType = 'text';

            // Handle encrypted media upload
            if (mediaFile) {
              setUploadingMedia(true);
              try {
                // Read file as ArrayBuffer
                const fileBuffer = await readFileAsArrayBuffer(mediaFile);

                // Encrypt the media
                const { encrypted, iv } = await encryptMedia(fileBuffer, encryptionKey);

                // Prepare FormData for encrypted media upload
                const formData = new FormData();
                // Convert Base64 string to binary blob
                const binaryString = atob(encrypted);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                const encryptedBlob = new Blob([bytes], {
                  type: 'application/octet-stream',
                });
                // Use original filename without adding .enc extension
                // The file is already encrypted at the binary level
                formData.append('media', encryptedBlob, mediaFile.name);
                formData.append('iv', iv);
                formData.append('originalName', mediaFile.name);
                formData.append('mimeType', mediaFile.type);

                    // Upload encrypted media
                    const uploadRes = await axios.post(`${API}/api/messages/upload/encrypted-media`, formData, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    });

                    encryptedMediaUrl = uploadRes.data.encryptedUrl;
                    mediaIv = uploadRes.data.iv;
                    originalFileName = uploadRes.data.originalName;
                    mediaMimeType = uploadRes.data.mimeType;

                    // Determine message type based on MIME type
                    if (mediaFile.type.startsWith('image/')) {
                        messageType = 'image';
                    } else if (mediaFile.type.startsWith('video/')) {
                        messageType = 'video';
                    }
                } finally {
                    setUploadingMedia(false);
                }
            }

            // Encrypt the message content before sending
            const messageContent = newMessage || (messageType !== 'text' ? 'Shared Media' : '');
            const encryptedContent = await encryptMessage(messageContent, encryptionKey);

           const { data } = await axios.post(
            `${API}/api/messages/send`,
            {
                conversationId: conversation._id,
                content: encryptedContent,
                messageType,
                encryptedMediaUrl,
                mediaIv,
                originalFileName,
                mediaMimeType,
                isEncrypted: true,
                isMediaEncrypted: !!encryptedMediaUrl,
            },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
            );

            // Store decrypted version locally for immediate display
            setDecryptedMessages((prev) => ({
                ...prev,
                [data._id]: messageContent,
            }));

            // If media is encrypted, create object URL for display
            if (encryptedMediaUrl && mediaIv) {
                try {
                    const mediaUrl = await downloadAndDecryptMedia(
                        encryptedMediaUrl,
                        mediaIv,
                        encryptionKey,
                        mediaMimeType
                    );
                    setDecryptedMediaUrls((prev) => ({
                        ...prev,
                        [data._id]: mediaUrl,
                    }));
                } catch (error) {
                    console.error('Failed to decrypt media for display:', error);
                }
            }

            setMessages([...messages, data]);
            setNewMessage('');
            setMediaFile(null);

            if (socket) {
                socket.emit('sendMessage', data);
                socket.emit('stopTyping', {
                    conversationId: conversation._id,
                    receiverId: getOtherParticipant()?._id,
                });
            }

            onConversationUpdate();
        } catch (error) {
            console.error('Error sending message:', error.message || error);
            console.error('Full error:', error);
            
            // Provide more specific error messages
            let errorMessage = 'Failed to send message';
            if (error.response) {
              errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            alert(errorMessage);
        }
    };

    const handleTyping = () => {
        if (socket && conversation) {
            socket.emit('typing', {
                conversationId: conversation._id,
                receiverId: getOtherParticipant()?._id,
            });

            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stopTyping', {
                    conversationId: conversation._id,
                    receiverId: getOtherParticipant()?._id,
                });
            }, 1000);
        }
    };

    const getOtherParticipant = () => {
        return conversation?.participants?.find((p) => p._id !== user._id);
    };

    const isOnline = () => {
        const otherUser = getOtherParticipant();
        return otherUser && onlineUsers.includes(otherUser._id);
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getDisplayContent = (message) => {
        return decryptedMessages[message._id] || message.content;
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm('Delete this message?')) return;
        try {
            const token = user?.token;
            await axios.delete(`${API}/api/messages/${messageId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Failed to delete message');
        }
    };

    const handleEditMessage = async (messageId) => {
        if (!editingContent.trim()) {
            setEditingMessageId(null);
            return;
        }
        try {
            const token = user?.token;
            const encryptedContent = await encryptMessage(editingContent, encryptionKey);
            await axios.put(
                `/api/messages/${messageId}`,
                { content: encryptedContent, isEncrypted: true },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDecryptedMessages((prev) => ({
                ...prev,
                [messageId]: editingContent,
            }));
            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === messageId ? { ...msg, content: encryptedContent, edited: true } : msg
                )
            );
            setEditingMessageId(null);
            setEditingContent('');
        } catch (error) {
            console.error('Error editing message:', error);
            alert('Failed to edit message');
        }
    };

    const handleBackupChat = () => {
        try {
            const chatData = {
                conversation: conversation?.participants?.map((p) => p.name).join(', '),
                messages: messages.map((msg) => ({
                    sender: msg.sender.name,
                    content: getDisplayContent(msg),
                    time: formatTime(msg.createdAt),
                })),
            };
            const element = document.createElement('a');
            element.setAttribute(
                'href',
                'data:text/plain;charset=utf-8,' +
                    encodeURIComponent(JSON.stringify(chatData, null, 2))
            );
            element.setAttribute(
                'download',
                `chat-${conversation._id}-${new Date().toISOString().slice(0, 10)}.json`
            );
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        } catch (error) {
            console.error('Error backing up chat:', error);
            alert('Failed to backup chat');
        }
    };

    const handleCloseChat = () => {
        setHeaderMenuOpen(false);
        // Close chat completely and show sidebar
        if (onCloseChat) {
            onCloseChat();
        }
    };

    if (!conversation) {
        return (
            <div className="chat-box empty">
                <div className="empty-state">
                    <h3>Select a conversation to start messaging</h3>
                </div>
            </div>
        );
    }

    const otherUser = getOtherParticipant();

    return (
        <div className="chat-box">
            <div className={`chat-header ${profileClicked ? 'header-active' : ''}`}>
                <div 
                    className="chat-user-info-clickable"
                    onClick={() => setProfileClicked(!profileClicked)}
                >
                    <img
                        src={otherUser?.profilePhoto || '/default-avatar.png'}
                        alt={otherUser?.name}
                        className="chat-avatar"
                    />
                    <div>
                        <h3>{otherUser?.name}</h3>
                        <p className="chat-status">
                            {isOnline() ? '🟢 Online' : '⚫ Offline'}
                            {encryptionReady && <span className="encryption-badge"> E2E Encrypted</span>}
                        </p>
                    </div>
                </div>
                <div className="chat-header-menu-container" ref={headerMenuRef}>
                    <button
                        onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
                        className="chat-header-menu-btn"
                        title="More options"
                    >
                        ⋮
                    </button>
                    {headerMenuOpen && (
                        <div className="chat-header-context-menu">
                            <button
                                onClick={() => {
                                    handleBackupChat();
                                    setHeaderMenuOpen(false);
                                }}
                                className="header-menu-item"
                            >
                                Backup Chat
                            </button>
                            <button
                                onClick={() => {
                                    handleCloseChat();
                                    setHeaderMenuOpen(false);
                                }}
                                className="header-menu-item close"
                            >
                                Close Chat
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="chat-messages">
                {loading ? (
                    <div className="messages-loading">Loading messages...</div>
                ) : !encryptionReady ? (
                    <div className="messages-loading">Initializing encryption...</div>
                ) : messages.length === 0 ? (
                    <div className="no-messages">
                        <span className="encryption-notice">Messages are end-to-end encrypted</span>
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message._id}
                            className={`message ${message.sender._id === user._id ? 'sent' : 'received'
                                }`}
                        >
                            <div className="message-content">
                                {editingMessageId === message._id ? (
                                    <div className="message-edit-box">
                                        <input
                                            type="text"
                                            value={editingContent}
                                            onChange={(e) => setEditingContent(e.target.value)}
                                            className="message-edit-input"
                                            autoFocus
                                        />
                                        <div className="message-edit-actions">
                                            <button
                                                onClick={() => handleEditMessage(message._id)}
                                                className="btn-save"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingMessageId(null)}
                                                className="btn-cancel"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {message.messageType === 'image' && message.encryptedMediaUrl && (
                                            <div className="message-media-container">
                                                {decryptedMediaUrls[message._id] ? (
                                                    <img src={decryptedMediaUrls[message._id]} alt="Encrypted" className="message-image" />
                                                ) : (
                                                    <div className="media-loading">Loading encrypted media...</div>
                                                )}
                                            </div>
                                        )}
                                        {message.messageType === 'video' && message.encryptedMediaUrl && (
                                            <div className="message-media-container">
                                                {decryptedMediaUrls[message._id] ? (
                                                    <video controls className="message-video">
                                                        <source src={decryptedMediaUrls[message._id]} type={message.mediaMimeType} />
                                                    </video>
                                                ) : (
                                                    <div className="media-loading">Loading encrypted video...</div>
                                                )}
                                            </div>
                                        )}
                                        {message.messageType === 'image' && message.imageUrl && !message.encryptedMediaUrl && (
                                            <img src={message.imageUrl} alt="Message" className="message-image" />
                                        )}
                                        <p>{getDisplayContent(message)}{message.edited && <span className="edited-label"> (edited)</span>}</p>
                                        <div className="message-meta">
                                            <span className="message-time">{formatTime(message.createdAt)}</span>
                                            {message.sender._id === user._id && (
                                                <span className="message-status">
                                                    {message.seen ? '✓✓' : '✓'}
                                                </span>
                                            )}
                                        </div>
                                        {message.sender._id === user._id && (
                                            <div className="message-menu-container" ref={menuRef}>
                                                <button
                                                    onClick={() => setOpenMenuId(openMenuId === message._id ? null : message._id)}
                                                    className="message-menu-btn"
                                                    title="Message options"
                                                >
                                                    ⋮
                                                </button>
                                                {openMenuId === message._id && (
                                                    <div className="message-context-menu">
                                                        <button
                                                            onClick={() => {
                                                                setEditingMessageId(message._id);
                                                                setEditingContent(getDisplayContent(message));
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="menu-item"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                handleDeleteMessage(message._id);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="menu-item delete"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {typing && (
                    <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="chat-input-form">
                {mediaFile && (
                    <div className="image-preview">
                        <span>📎 {mediaFile.name}</span>
                        <button type="button" onClick={() => setMediaFile(null)} disabled={uploadingMedia}>
                            ×
                        </button>
                    </div>
                )}
                <div className="chat-input-group">
                    <label htmlFor="media-upload" className="attach-btn" title="Attach encrypted image or video">
                        📎
                    </label>
                    <input
                        id="media-upload"
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => setMediaFile(e.target.files[0])}
                        style={{ display: 'none' }}
                        disabled={uploadingMedia}
                    />
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                        }}
                        placeholder={encryptionReady ? "Type a message..." : "Initializing encryption..."}
                        className="chat-input"
                        disabled={!encryptionReady || uploadingMedia}
                    />
                    <button type="submit" className="send-btn" disabled={!encryptionReady || uploadingMedia}>
                        {uploadingMedia ? 'Encrypting...' : 'Send'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatBox;
