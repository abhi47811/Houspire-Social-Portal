'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { SmActivity, SmUser, formatRelativeTime } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Check, CheckCheck, Bell } from 'lucide-react';

interface ActivityWithActor extends SmActivity {
  actor: SmUser;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export default function ActivityPage() {
  const { user, loading: userLoading } = useUser();
  const [activities, setActivities] = useState<ActivityWithActor[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activity');

  const supabase = createClient();

  useEffect(() => {
    if (!userLoading) {
      fetchActivities();
      if (user) {
        fetchNotifications();
      }
    }
  }, [userLoading, user]);

  // Real-time subscription for activities
  useEffect(() => {
    if (!userLoading) {
      const subscription = supabase
        .channel('sm_activity_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sm_activity',
          },
          () => {
            fetchActivities();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [userLoading]);

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      const { data, error } = await supabase
        .from('sm_activity')
        .select(
          `
          id,
          actor_id,
          action,
          entity_type,
          entity_id,
          entity_title,
          details,
          created_at,
          actor:sm_users(id,name,avatar_url)
        `
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = (data || []).map((d: any) => ({
        ...d,
        actor: Array.isArray(d.actor) ? d.actor[0] : d.actor,
      }));
      setActivities(mapped);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setNotificationsLoading(true);
      const { data, error } = await supabase
        .from('sm_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('sm_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('sm_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getActivityActionText = (activity: ActivityWithActor) => {
    const actor = activity.actor?.name || 'Someone';
    const action = activity.action || 'updated';
    const entity = activity.entity_title || 'an item';

    return `${actor} ${action} ${entity}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Activity</h1>
        <p className="text-gray-600">Stay updated on team activity and notifications</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          <TabsTrigger value="notifications" className="relative">
            My Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-6">
          {activitiesLoading ? (
            <div className="text-center py-12 text-gray-500">
              Loading activity feed...
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No activities yet
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        {activity.actor?.avatar_url && (
                          <AvatarImage
                            src={activity.actor.avatar_url}
                            alt={activity.actor.name}
                          />
                        )}
                        <AvatarFallback>
                          {getInitials(activity.actor?.name || 'User')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          {getActivityActionText(activity)}
                        </p>
                        {activity.details && (
                          <p className="text-xs text-gray-500 mt-1">
                            {JSON.stringify(activity.details)}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {formatRelativeTime(new Date(activity.created_at))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          {notificationsLoading ? (
            <div className="text-center py-12 text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No notifications yet
            </div>
          ) : (
            <div>
              {unreadCount > 0 && (
                <div className="mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllNotificationsAsRead}
                    className="gap-2"
                  >
                    <CheckCheck size={16} />
                    Mark all as read
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={
                      notification.is_read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0 mt-1">
                          {notification.is_read ? (
                            <Check className="text-gray-400" size={18} />
                          ) : (
                            <Bell className="text-blue-600" size={18} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-sm text-gray-900">
                                {notification.title}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.body}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <button
                                onClick={() =>
                                  markNotificationAsRead(notification.id)
                                }
                                className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-3">
                            {formatRelativeTime(
                              new Date(notification.created_at)
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
