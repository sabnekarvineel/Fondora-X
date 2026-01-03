import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL;
import SocketContext from '../context/SocketContext';
import { decryptMessage, getStoredConversationKey } from '../utils/encryption';

const ConversationList = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  onNewConversation,
  loading,
  showOnMobile,
  onHideMobile,
}) => {
  const { user } = useContext(AuthContext);
  const { onlineUsers } = useContext(SocketContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [decryptedMessages, setDecryptedMessages] = useState({});
  const navigate = useNavigate();

  // Decrypt last message for each conversation
  useEffect(() => {
    const decryptLastMessages = async () => {
      const decrypted = {};
      
      for (const conversation of conversations) {
        if (conversation.lastMessage?.content) {
          try {
            const key = await getStoredConversationKey(conversation._id);
            if (key) {
              const decryptedText = await decryptMessage(conversation.lastMessage.content, key);
              decrypted[conversation._id] = decryptedText;
            } else {
              decrypted[conversation._id] = '[Encrypted message]';
            }
          } catch (error) {
            console.error(`Failed to decrypt message for conversation ${conversation._id}:`, error);
            decrypted[conversation._id] = '[Unable to decrypt]';
          }
        }
      }
      
      setDecryptedMessages(decrypted);
    };

    if (conversations.length > 0) {
      decryptLastMessages();
    }
  }, [conversations]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length > 0) {
      setSearching(true);
      try {
        const token = user?.token;
        const { data } = await axios.get(`${API}/api/search/users`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { query },
        });
        setSearchResults(data.users || []);
      } catch (error) {
        console.error(error);
      }
      setSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const handleUserClick = async (userId) => {
    try {
      const token = user?.token;
      const { data } = await axios.get(`${API}/api/messages/conversation/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onNewConversation(data);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error(error);
    }
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants?.find((p) => p._id !== user._id);
  };

  const isOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  if (loading) {
    return <div className={`conversations-sidebar ${showOnMobile ? 'show-mobile' : 'hide-mobile'}`}>Loading...</div>;
  }

  return (
    <div className={`conversations-sidebar ${showOnMobile ? 'show-mobile' : 'hide-mobile'}`}>
      <div className="conversations-header">
        <h2>Messages</h2>
      </div>

      <div className="conversation-search">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search users..."
        />
      </div>

      {searchQuery && (
        <div className="search-results-list">
          {searching ? (
            <div className="searching">Searching...</div>
          ) : searchResults.length > 0 ? (
            searchResults.map((user) => (
              <div
                key={user._id}
                className="search-result-item"
                onClick={() => handleUserClick(user._id)}
              >
                <img
                  src={user.profilePhoto || '/default-avatar.png'}
                  alt={user.name}
                  className="conversation-avatar"
                />
                <div className="conversation-info">
                  <h4>{user.name}</h4>
                  <p className="user-role">{user.role}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">No users found</div>
          )}
        </div>
      )}

      <div className="conversations-list">
        {conversations.length === 0 ? (
          <div className="no-conversations">No conversations yet. Search for users to start chatting!</div>
        ) : (
          conversations.map((conversation) => {
            const otherUser = getOtherParticipant(conversation);
            return (
              <div
                key={conversation._id}
                className={`conversation-item ${
                  selectedConversation?._id === conversation._id ? 'active' : ''
                }`}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="avatar-container">
                  <img
                    src={otherUser?.profilePhoto || '/default-avatar.png'}
                    alt={otherUser?.name}
                    className="conversation-avatar"
                  />
                  {isOnline(otherUser?._id) && <div className="online-indicator" />}
                </div>
                <div className="conversation-info">
                   <h4>{otherUser?.name}</h4>
                   <p className="last-message">
                     {decryptedMessages[conversation._id] || conversation.lastMessage?.content || 'No messages yet'}
                   </p>
                 </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;
