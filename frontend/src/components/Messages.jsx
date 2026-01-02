import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from './Navbar';
import ConversationList from './ConversationList';
import ChatBox from './ChatBox';

const Messages = () => {
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSidebarMobile, setShowSidebarMobile] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const token = user?.token;
      const { data } = await axios.get('/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
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
    setConversations([conversation, ...conversations]);
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
