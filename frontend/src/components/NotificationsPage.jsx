import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import NotificationContext from '../context/NotificationContext';
import Navbar from './Navbar';

const NotificationsPage = () => {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useContext(NotificationContext);

  const [filter, setFilter] = useState('all');

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'follow':
        return '👤';
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'message':
        return '✉️';
      case 'profile_view':
        return '👁️';
      case 'investor_interest':
        return '💼';
      case 'post_share':
        return '🔄';
      case 'post_tag':
        return '🏷️';
      default:
        return '🔔';
    }
  };

  const getNotificationLink = (notification) => {
    if (notification.link) return notification.link;
    if (notification.post?._id) return `/feed?post=${notification.post._id}`;
    if (notification.sender?._id) return `/profile/${notification.sender._id}`;
    return '/dashboard';
  };

  const formatTime = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="notifications-page">
          <div className="notifications-header">
            <h1>Notifications</h1>
            <div className="notifications-controls">
              <div className="filter-buttons">
                <button
                  className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button
                  className={filter === 'unread' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('unread')}
                >
                  Unread
                </button>
              </div>
              {filteredNotifications.some(n => !n.read) && (
                <button onClick={markAllAsRead} className="mark-all-read-btn">
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="notifications-list-page">
            {filteredNotifications.length === 0 ? (
              <div className="no-notifications">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <Link
                  key={notification._id}
                  to={getNotificationLink(notification)}
                  className={`notification-item-page ${!notification.read ? 'unread' : ''}`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification._id);
                    }
                  }}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-sender">
                      <img
                        src={notification.sender?.profilePhoto || '/default-avatar.png'}
                        alt={notification.sender?.name}
                        className="notification-avatar"
                      />
                      <div className="notification-text">
                        <span className="notification-name">{notification.sender?.name}</span>
                        <p className="notification-message">{notification.message}</p>
                      </div>
                    </div>
                    <div className="notification-meta">
                      <span className="notification-time">{formatTime(notification.createdAt)}</span>
                      {!notification.read && <span className="unread-dot"></span>}
                    </div>
                  </div>
                  <button
                    className="notification-delete"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                  >
                    ×
                  </button>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
