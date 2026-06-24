"use client";

import { useEffect, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { api } from "@/api/axios";
import { playMessageBeep } from "./useMessageSound";
import { playAudioFile, playToneSequence, setupAudioUnlock } from "@/lib/audio";

export interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  type: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// ── NOTIFICATION SOUND ────────────────────────────────────────────────────────

function playNotificationBeep() {
  playAudioFile("/sounds/notification.wav", 0.55);
  playToneSequence([
    { frequency: 880, offset: 0, duration: 0.15, gain: 0.3 },
    { frequency: 1100, offset: 0.15, duration: 0.2, gain: 0.3 },
  ]);
}

export function useNotifications(
  socket: Socket | null,
  currentUserId: string | null,
) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [latestNotification, setLatestNotification] =
    useState<NotificationItem | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const refreshList = useCallback(async () => {
    if (!currentUserId) {
      setNotifications([]);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.get("/notifications", {
        params: { page: 1, limit: 20 },
      });
      setNotifications(res.data?.data ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  // Initial load
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshList();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshList]);

  useEffect(() => setupAudioUnlock(), []);

  useEffect(() => {
    if (!socket || !currentUserId) return;

    const onNewNotification = (payload: NotificationItem) => {
      setNotifications((prev) => [payload, ...prev]);
      setLatestNotification(payload);
      if (payload.type === "new_message") {
        playMessageBeep();
      } else {
        playNotificationBeep();
      }
    };

    socket.on("notification", onNewNotification);

    return () => {
      socket.off("notification", onNewNotification);
    };
  }, [socket, currentUserId]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await api.patch("/notifications/read-all");
    } catch {}
  }, []);

  const clearLatestNotification = useCallback(() => {
    setLatestNotification(null);
  }, []);

  return {
    notifications,
    isLoading,
    unreadCount,
    latestNotification,
    refreshList,
    markAllAsRead,
    clearLatestNotification,
  };
}
