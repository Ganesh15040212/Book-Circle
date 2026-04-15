import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Bell, CheckCheck, XCircle, BookOpen, CheckSquare } from 'lucide-react';
import { apiFetch } from '../api';
import { toast } from 'sonner';

interface Notification {
  id: string;
  userId: string;
  type: 'new_request' | 'request_approved' | 'request_rejected';
  message: string;
  bookId: string | null;
  requestId: string | null;
  read: boolean;
  createdAt: string;
}

export const NotificationsPage: React.FC = () => {
  const { accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/notifications/index.php', {}, accessToken);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch notifications');
      setNotifications(data.notifications || []);
    } catch (error: any) {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/mark_read.php?id=${id}`, { method: 'PUT' }, accessToken);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch { }
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch('/notifications/mark_read.php?id=all', { method: 'PUT' }, accessToken);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const getIcon = (type: string, read: boolean) => {
    const opacity = read ? 'opacity-50' : '';
    switch (type) {
      case 'new_request':
        return <BookOpen className={`w-5 h-5 text-blue-600 ${opacity}`} />;
      case 'request_approved':
        return <CheckCheck className={`w-5 h-5 text-green-600 ${opacity}`} />;
      case 'request_rejected':
        return <XCircle className={`w-5 h-5 text-red-600 ${opacity}`} />;
      default:
        return <Bell className={`w-5 h-5 text-gray-600 ${opacity}`} />;
    }
  };

  const getCardStyle = (type: string, read: boolean) => {
    if (read) return 'bg-white border-gray-100';
    switch (type) {
      case 'new_request': return 'bg-blue-50 border-blue-200';
      case 'request_approved': return 'bg-green-50 border-green-200';
      case 'request_rejected': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckSquare className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No notifications yet</p>
            <p className="text-sm text-gray-500 mt-2">
              You'll be notified when someone requests your book or responds to your request.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <Card
              key={notification.id}
              className={`border ${getCardStyle(notification.type, notification.read)} transition-all hover:shadow-md cursor-pointer`}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">
                    {getIcon(notification.type, notification.read)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <Badge className="shrink-0 bg-indigo-600 text-white">New</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
