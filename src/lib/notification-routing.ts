import { NotificationItem } from "@/hooks/useNotifications";

function getRoleBasePath(targetRoute: string): "/client" | "/technician" {
  return targetRoute.startsWith("/technician") ? "/technician" : "/client";
}

export function getNotificationRoute(
  notification: NotificationItem,
  targetRoute: string,
): string {
  const roleBasePath = getRoleBasePath(targetRoute);

  if (notification.type === "new_message") {
    const metadata = notification.metadata ?? {};
    const chatVariant =
      typeof metadata.chatVariant === "string" ? metadata.chatVariant : "fixed";

    if (chatVariant === "custom") {
      const postId =
        typeof metadata.postId === "string" ? metadata.postId : undefined;
      const technicianId =
        typeof metadata.technicianId === "string"
          ? metadata.technicianId
          : undefined;

      if (postId && technicianId) {
        const params = new URLSearchParams({ postId, technicianId });

        if (typeof metadata.title === "string" && metadata.title.trim()) {
          params.set("title", metadata.title);
        }

        if (
          typeof metadata.clientName === "string" &&
          metadata.clientName.trim()
        ) {
          params.set("clientName", metadata.clientName);
        }

        return `${roleBasePath}/direct-messages?${params.toString()}`;
      }
    }

    if (notification.requestId) {
      return `${roleBasePath}/direct-messages?requestId=${notification.requestId}`;
    }
  }

  return targetRoute;
}
