import * as React from "react";
import { Bell, BellOff, BellRing, Check, ShoppingBag } from "lucide-react";
import { useAdmin } from "@/lib/admin-store";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/admin.functions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { usePushNotifications } from "@/lib/use-push";

export function NotificationBell() {
  const push = usePushNotifications();
  const { notifications, reload } = useAdmin();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead({ data: { id } });
      void reload();
    } catch (err) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      void reload();
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-card">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 sm:w-96" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-display font-bold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-primary"
              onClick={handleMarkAllRead}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <div className="flex items-start gap-3 border-b bg-muted/40 p-4">
          <div
            className={cn(
              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
              push.enabled ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            {push.enabled ? <BellRing className="size-4" /> : <BellOff className="size-4" />}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold">
              {push.enabled ? "Device alerts are ON" : "Get alerts when the site is closed"}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              {push.supported
                ? "New order alerts pop up on this phone or laptop even when the website is closed."
                : "This browser does not support background alerts. Install the site to your home screen and try again."}
            </p>
            {push.supported && (
              <div className="mt-2 flex flex-wrap gap-2">
                {push.enabled ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      disabled={push.busy}
                      onClick={() => void push.test()}
                    >
                      Send test
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px] text-muted-foreground"
                      disabled={push.busy}
                      onClick={() => void push.disable()}
                    >
                      Turn off
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="h-7 text-[11px]"
                    disabled={push.busy}
                    onClick={() => void push.enable()}
                  >
                    Enable on this device
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 p-4 text-center">
              <Bell className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "relative flex cursor-pointer gap-3 border-b p-4 transition-colors hover:bg-muted/50 last:border-0",
                    !n.isRead && "bg-primary/5"
                  )}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                >
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {n.type === "admin_new_order" ? (
                      <ShoppingBag className="size-4" />
                    ) : (
                      <Check className="size-4" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm font-semibold", !n.isRead && "text-primary")}>
                        {n.title}
                      </p>
                      <time className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </time>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {n.message}
                    </p>
                    <Link
                      to="/admin/orders"
                      search={{ q: n.orderNo }}
                      className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
                    >
                      View Order {n.orderNo}
                    </Link>
                  </div>
                  {!n.isRead && (
                    <div className="absolute right-2 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
