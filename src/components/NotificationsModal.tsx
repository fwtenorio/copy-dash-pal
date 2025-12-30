import { useState } from "react";
import { Bell, Check, Trash2, X, Sparkles, AlertCircle, CreditCard, Gift, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: "update" | "promo" | "payment" | "news" | "feature";
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    title: "New Feature Released",
    description: "We've added bulk export functionality. Export your disputes in CSV, XLSX, or PDF formats.",
    timestamp: "5 minutes ago",
    read: false,
    type: "feature",
  },
  {
    id: "2",
    title: "System Maintenance",
    description: "Scheduled maintenance on Dec 10th from 2:00 AM to 4:00 AM UTC. Expect brief downtime.",
    timestamp: "1 hour ago",
    read: false,
    type: "update",
  },
  {
    id: "3",
    title: "Payment Failed",
    description: "Your subscription payment could not be processed. Please update your payment method.",
    timestamp: "3 hours ago",
    read: false,
    type: "payment",
  },
  {
    id: "4",
    title: "Black Friday Offer",
    description: "Get 30% off on annual plans! Use code BLACKFRIDAY30 at checkout. Valid until Nov 30th.",
    timestamp: "Yesterday",
    read: true,
    type: "promo",
  },
  {
    id: "5",
    title: "Platform Update v2.5",
    description: "We've improved performance and added new filters to the disputes dashboard.",
    timestamp: "2 days ago",
    read: true,
    type: "news",
  },
];

const typeIcons = {
  update: AlertCircle,
  promo: Gift,
  payment: CreditCard,
  news: Sparkles,
  feature: Rocket,
};

const typeColors = {
  update: "text-amber-500",
  promo: "text-purple-500",
  payment: "text-red-500",
  news: "text-blue-500",
  feature: "text-[#1B966C]",
};

interface NotificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNotificationsRead: () => void;
  children: React.ReactNode;
}

export function NotificationsModal({
  open,
  onOpenChange,
  onNotificationsRead,
  children,
}: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState("unread");

  const unreadNotifications = notifications.filter((n) => !n.read);
  const unreadCount = unreadNotifications.length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (unreadCount === 1) {
      onNotificationsRead();
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onNotificationsRead();
  };

  const handleDeleteNotification = (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notification && !notification.read && unreadCount === 1) {
      onNotificationsRead();
    }
  };

  const handleDeleteAll = () => {
    setNotifications([]);
    onNotificationsRead();
  };

  const displayedNotifications =
    activeTab === "unread" ? unreadNotifications : notifications;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-[420px] p-0 bg-white border border-[#E5E7EB] rounded-lg shadow-lg"
        align="end"
        sideOffset={8}
      >
        <div className="px-4 pt-4 pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[#ECFDF5] flex items-center justify-center">
                <Bell className="h-4 w-4 text-[#1B966C]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1F2937]">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-[#6B7280]">
                    {unreadCount} unread
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-3">
              <TabsList className="bg-[#F3F4F6] p-1 rounded-lg h-9">
                <TabsTrigger
                  value="unread"
                  className="px-3 py-1.5 text-xs font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-[#1F2937] data-[state=active]:shadow-sm text-[#6B7280]"
                >
                  Unread
                  {unreadCount > 0 && (
                    <span className="ml-1.5 bg-[#1B966C] text-white text-xs px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="px-3 py-1.5 text-xs font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-[#1F2937] data-[state=active]:shadow-sm text-[#6B7280]"
                >
                  All
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-[#1B966C] hover:text-[#157a5a] hover:bg-[#ECFDF5] text-xs font-medium h-7 px-2"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteAll}
                    className="text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEF2F2] text-xs font-medium h-7 px-2"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
            </div>

            <TabsContent value="unread" className="mt-0">
              <NotificationsList
                notifications={displayedNotifications}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDeleteNotification}
                emptyMessage="No unread notifications"
              />
            </TabsContent>

            <TabsContent value="all" className="mt-0">
              <NotificationsList
                notifications={displayedNotifications}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDeleteNotification}
                emptyMessage="No notifications"
              />
            </TabsContent>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface NotificationsListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  emptyMessage: string;
}

function NotificationsList({
  notifications,
  onMarkAsRead,
  onDelete,
  emptyMessage,
}: NotificationsListProps) {
  if (notifications.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="h-10 w-10 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-2">
          <Bell className="h-5 w-5 text-[#9CA3AF]" />
        </div>
        <p className="text-[#6B7280] text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="max-h-[320px] overflow-y-auto -mx-4 px-4 pb-4">
      <div className="space-y-2">
        {notifications.map((notification) => {
          const IconComponent = typeIcons[notification.type];
          const iconColor = typeColors[notification.type];
          
          return (
            <div
              key={notification.id}
              className={cn(
                "group p-3 rounded-lg border transition-all duration-200 hover:shadow-sm",
                notification.read
                  ? "bg-white border-[#E5E7EB]"
                  : "bg-[#F0FDF9] border-[#A7F3D0]"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("h-8 w-8 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0", iconColor)}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {!notification.read && (
                      <span className="h-1.5 w-1.5 bg-[#1B966C] rounded-full flex-shrink-0" />
                    )}
                    <h4 className="text-sm font-medium text-[#1F2937] truncate">
                      {notification.title}
                    </h4>
                  </div>
                  <p className="text-xs text-[#6B7280] line-clamp-2 mb-1">
                    {notification.description}
                  </p>
                  <span className="text-xs text-[#9CA3AF]">{notification.timestamp}</span>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[#6B7280] hover:text-[#1B966C] hover:bg-[#ECFDF5]"
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEF2F2]"
                    onClick={() => onDelete(notification.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
