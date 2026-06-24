"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/api/axios";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { mapRequestsToRooms } from "@/lib/mapRequestsToRooms";
import { Room } from "@/types/chat.types";
import { AssignedRequest } from "@/types/request.types";
import Navbar from "@/components/layout/client/Navbar";
import DirectMessagesLayout from "@/components/sections/client/direct-messages/DirectMessagesLayout";
import RoomList from "@/components/sections/client/direct-messages/RoomList";
import ChatWindow from "@/components/sections/client/direct-messages/ChatWindow";

export default function ClientDirectMessagesPage() {
  const { userId, token, isReady } = useAuth();
  const { socket } = useSocket(token);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestIdFromUrl = searchParams.get("requestId");
  const postIdFromUrl = searchParams.get("postId");
  const technicianIdFromUrl = searchParams.get("technicianId");
  const titleFromUrl = searchParams.get("title");
  const clientNameFromUrl = searchParams.get("clientName");

  const customRoomFromUrl = useMemo<Room | null>(
    () =>
      postIdFromUrl && technicianIdFromUrl
        ? {
            id: `custom_${postIdFromUrl}_${technicianIdFromUrl}`,
            variant: "custom",
            otherPartyName: clientNameFromUrl ?? "الفني",
            initials: (clientNameFromUrl ?? "الفني").slice(0, 2),
            title: titleFromUrl ?? "خدمة مخصصة",
            unreadCount: 0,
            postId: postIdFromUrl,
            technicianId: technicianIdFromUrl,
          }
        : null,
    [clientNameFromUrl, postIdFromUrl, technicianIdFromUrl, titleFromUrl],
  );

  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  const handleSelectRoom = useCallback(
    (room: Room) => {
      setActiveRoom(room);

      const params = new URLSearchParams(searchParams.toString());

      if (room.variant === "custom" && room.postId && room.technicianId) {
        params.delete("requestId");
        params.set("postId", room.postId);
        params.set("technicianId", room.technicianId);
        params.set("title", room.title);
        params.set("clientName", room.otherPartyName);
      } else if (room.requestId) {
        params.delete("postId");
        params.delete("technicianId");
        params.delete("title");
        params.delete("clientName");
        params.set("requestId", room.requestId);
      } else {
        return;
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const refreshRooms = useCallback(
    async (silent = false) => {
      if (!isReady) return;
      if (!token || !userId) {
        if (!silent) setIsLoadingRooms(false);
        return;
      }

      if (!silent) setIsLoadingRooms(true);
      setRoomsError(null);

      try {
        const res = await api.get("/requests/my");
        const requests: AssignedRequest[] = res.data.data ?? [];
        const mapped = await mapRequestsToRooms(requests, "client");

        setRooms(mapped);
        setActiveRoom((prev) => {
          if (customRoomFromUrl) {
            return customRoomFromUrl;
          }

          if (requestIdFromUrl) {
            return mapped.find((room) => room.requestId === requestIdFromUrl) ?? null;
          }

          if (!prev) return null;
          return mapped.find((room) => room.id === prev.id) ?? null;
        });
      } catch (error) {
        const message =
          error instanceof Error && error.message === "Network Error"
            ? "تعذر الاتصال بالخادم حالياً. تأكد أن الـ backend يعمل ثم حاول مرة أخرى."
            : "تعذر تحميل المحادثات حالياً.";

        setRoomsError(message);
        if (!silent) {
          setRooms([]);
          setActiveRoom(null);
        }
      } finally {
        if (!silent) setIsLoadingRooms(false);
      }
    },
    [customRoomFromUrl, isReady, requestIdFromUrl, token, userId]
  );

  useEffect(() => {
    if (!isReady) return;

    const timeoutId = window.setTimeout(() => {
      void refreshRooms();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isReady, refreshRooms]);

  useEffect(() => {
    if (!socket || !isReady || !token || !userId) return;

    const syncRooms = () => {
      void refreshRooms(true);
    };

    socket.on("newMessage", syncRooms);
    socket.on("newCustomMessage", syncRooms);
    socket.on("messagesRead", syncRooms);
    socket.on("roomClosed", syncRooms);
    socket.on("customRoomClosed", syncRooms);

    return () => {
      socket.off("newMessage", syncRooms);
      socket.off("newCustomMessage", syncRooms);
      socket.off("messagesRead", syncRooms);
      socket.off("roomClosed", syncRooms);
      socket.off("customRoomClosed", syncRooms);
    };
  }, [isReady, refreshRooms, socket, token, userId]);

  return (
    <DirectMessagesLayout
      navbar={<Navbar />}
      chatWindow={
        !isReady || !userId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-[#7CB342] border-t-transparent animate-spin" />
          </div>
        ) : (
          <ChatWindow
            socket={socket}
            room={activeRoom}
            currentUserId={userId}
            onHistoryLoaded={() => {
              void refreshRooms(true);
            }}
          />
        )
      }
      roomList={
        isLoadingRooms || !isReady ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#7CB342] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : roomsError ? (
          <div className="flex-1 flex items-center justify-center px-6 text-center text-sm text-[#A05A5A]">
            {roomsError}
          </div>
        ) : (
          <RoomList
            rooms={rooms}
            activeRoomId={activeRoom?.id ?? null}
            onSelect={handleSelectRoom}
          />
        )
      }
    />
  );
}
