import { Subject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationData {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

class NotificationService {
  private notificationsSubject = new Subject<NotificationData>();
  public notifications$ = this.notificationsSubject.asObservable();

  show(message: string, type: NotificationType = 'success', duration: number = 3000) {
    const notification: NotificationData = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      duration
    };
    this.notificationsSubject.next(notification);
  }

  success(message: string, duration?: number) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration?: number) {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number) {
    this.show(message, 'info', duration);
  }
}

export const notificationService = new NotificationService(); 