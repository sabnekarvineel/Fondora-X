import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from './Navbar';
import ConversationList from './ConversationList';
import ChatBox from './ChatBox';

// ✅ ADD THIS (only new line)
const API = import.meta.env.VITE_API_URL;

const Messages = () => {
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSidebarMobile, setShowSidebarMobile] = useState(true);

  // ✅ WAIT for user before fetching
  useEffect(() => {
    if (user?.token) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const token = user?.token;

      const { data } = await axios.get(
        `${API}/api/messages/conversations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ✅ ALWAYS SET ARRAY
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);

    // Hide sidebar on mobile when conversation is selected
    if (window.innerWidth <= 768) {
      setShowSidebarMobile(false);
    }
  };

  const handleNewConversation = (conversation) => {
    setConversations((prev) => [conversation, ...prev]);
    setSelectedConversation(conversation);

    // Hide sidebar on mobile when new conversation is started
    if (window.innerWidth <= 768) {
      setShowSidebarMobile(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="messages-container">
        <div className="messages-layout">
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleConversationSelect}
            onNewConversation={handleNewConversation}
            loading={loading}
            showOnMobile={showSidebarMobile}
            onHideMobile={() => setShowSidebarMobile(false)}
          />

          <ChatBox
            conversation={selectedConversation}
            onConversationUpdate={fetchConversations}
            onShowSidebar={() => setShowSidebarMobile(true)}
            onCloseChat={() => {
              setSelectedConversation(null);
              setShowSidebarMobile(true);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Messages;
