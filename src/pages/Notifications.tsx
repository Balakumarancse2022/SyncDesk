import React from 'react';
import { Bell, FileEdit, AlertTriangle, CheckCircle2, Trash2, CheckCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const icons: Record<string, React.ElementType> = { 
    file: FileEdit, 
    warning: AlertTriangle, 
    success: CheckCircle2,
    info: Bell 
  };
  const colors: Record<string, string> = { 
    file: 'text-info bg-info/10', 
    warning: 'text-warning bg-warning/10', 
    success: 'text-success bg-success/10',
    info: 'text-primary bg-primary/10'
  };

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated on file changes and alerts</p>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Recent Activity
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                {unreadCount} new
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No notifications yet. You'll see updates here when there are file changes or deadline reminders.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(n => {
                const Icon = icons[n.type] || Bell;
                const colorClass = colors[n.type] || colors.info;
                return (
                  <div 
                    key={n.id} 
                    className={cn(
                      "flex items-start gap-4 p-4 border rounded-lg transition-colors",
                      n.read ? "bg-background" : "bg-muted/50"
                    )}
                    onClick={() => !n.read && markRead.mutate(n.id)}
                  >
                    <div className={cn('p-2 rounded-lg shrink-0', colorClass)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium", !n.read && "font-semibold")}>{n.title}</p>
                      {n.description && (
                        <p className="text-sm text-muted-foreground">{n.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification.mutate(n.id);
                      }}
                      disabled={deleteNotification.isPending}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
