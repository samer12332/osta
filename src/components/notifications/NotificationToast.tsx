"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { NotificationItem } from "@/hooks/useNotifications";
import { getNotificationRoute } from "@/lib/notification-routing";

interface NotificationToastProps {
  notification: NotificationItem | null;
  onClose: () => void;
  targetRoute: string;
}

export default function NotificationToast({
  notification,
  onClose,
  targetRoute,
}: NotificationToastProps) {
  const router = useRouter();

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onClose();
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [notification, onClose]);

  if (!notification) {
    return null;
  }

  const handleOpen = () => {
    router.push(getNotificationRoute(notification, targetRoute));
    onClose();
  };

  return (
    <div
      dir="rtl"
      className="fixed left-4 top-24 z-[120] w-[min(24rem,calc(100vw-2rem))] rounded-3xl border border-[#E7ECE8] bg-white/95 p-4 shadow-[0_18px_48px_rgba(17,45,39,0.16)] backdrop-blur"
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close notification"
        >
          <X size={16} />
        </button>

        <button
          type="button"
          onClick={handleOpen}
          className="flex flex-1 flex-col items-start gap-1 text-right"
        >
          <span className="text-xs font-medium text-[var(--primary-color)]">
            إشعار جديد
          </span>
          <span className="text-sm font-semibold text-[#112D27]">
            {notification.title}
          </span>
          <span className="line-clamp-2 text-xs leading-5 text-gray-500">
            {notification.body}
          </span>
        </button>
      </div>
    </div>
  );
}
