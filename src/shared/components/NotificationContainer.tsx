import React, { useEffect, useState } from 'react';
import Notification from './Notification';
import { notificationService } from '../services/notification.service';
import type { NotificationData } from '../services/notification.service';

const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    const sub = notificationService.notifications$.subscribe((notification: NotificationData) => {
      setNotifications((prev) => [...prev, notification]);
    });
    return () => sub.unsubscribe();
  }, []);

  const handleClose = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <>
      {notifications.map((n) => (
        <Notification
          key={n.id}
          message={n.message}
          type={n.type}
          duration={n.duration}
          onClose={() => handleClose(n.id)}
        />
      ))}
    </>
  );
};

export default NotificationContainer; 