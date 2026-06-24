"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { NotificationItem } from "@/hooks/useNotifications";
import { getNotificationRoute } from "@/lib/notification-routing";

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "الآن";
  if (diffMin < 60)
    return `منذ ${diffMin} ${diffMin === 1 ? "دقيقة" : "دقائق"}`;
  if (diffHour < 24)
    return `منذ ${diffHour} ${diffHour === 1 ? "ساعة" : "ساعات"}`;
  return `منذ ${diffDay} ${diffDay === 1 ? "يوم" : "أيام"}`;
}

interface NotificationPanelProps {
  notifications: NotificationItem[];
  isLoading: boolean;
  onClose: () => void;
  targetRoute: string;
}

export default function NotificationPanel({
  notifications,
  isLoading,
  onClose,
  targetRoute,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleNotificationClick = (notification: NotificationItem) => {
    onClose();
    router.push(getNotificationRoute(notification, targetRoute));
  };

  return (
    <div
      ref={panelRef}
      dir="rtl"
      className="absolute left-0 top-12 z-50 flex max-h-56 w-80 flex-col overflow-hidden rounded-3xl bg-white shadow-lg shadow-black/10 ring-1 ring-black/5"
    >
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-[#112D27]">الإشعارات</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-400">
            جارٍ التحميل...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-400">
            لا توجد إشعارات حتى الآن
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notification) => (
              <button
                key={notification._id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={`flex w-full flex-col items-start gap-1 px-4 py-3 text-right transition-colors duration-300 hover:bg-[#F6F5F1] ${
                  notification.isRead
                    ? "bg-white"
                    : "bg-[#F6F5F1] shadow-[inset_3px_0_0_var(--primary-color)]"
                }`}
              >
                <span className="flex w-full items-center gap-2">
                  {!notification.isRead && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary-color)]" />
                  )}
                  <span
                    className={`text-sm leading-snug ${
                      notification.isRead
                        ? "font-medium text-[#112D27]/80"
                        : "font-semibold text-[#112D27]"
                    }`}
                  >
                    {notification.title}
                  </span>
                </span>

                <span className="line-clamp-2 break-words text-xs leading-snug text-gray-500">
                  {notification.body}
                </span>

                <span className="text-[11px] text-gray-400">
                  {formatRelativeTime(notification.createdAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
