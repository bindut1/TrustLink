import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "./api";
import { getAccessToken } from "./auth-storage";
import type { NotificationItem } from "@/types/notification";

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await fetch(`${API_BASE_URL}/notifications`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

// ───────────── SSE hook ─────────────
// Native EventSource — browser handles reconnection + SSE framing natively.
// Token passed as ?token= query param because EventSource doesn't support headers.

export function useNotificationStream(enabled: boolean): {
  notifications: NotificationItem[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
} {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const esRef = useRef<EventSource | null>(null);

  // Initial fetch — load existing notifications
  useEffect(() => {
    if (!enabled) return;
    fetchNotifications().then((list) => setNotifications(list));
  }, [enabled]);

  // SSE stream — stays open, browser auto-reconnects on drop
  useEffect(() => {
    if (!enabled) return;
    const token = getAccessToken();
    if (!token) return;

    const url = `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data as string);
        // NestJS @Sse wraps payload as { data: <actual object> }
        const notif: NotificationItem =
          raw && typeof raw === "object" && "data" in raw ? raw.data : raw;
        // Ignore heartbeat pings
        if (!notif || typeof notif !== "object" || !("id" in notif)) return;
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });
      } catch {
        // non-JSON heartbeat or malformed frame — skip
      }
    };

    es.onerror = () => {
      // EventSource automatically reconnects — no manual action needed.
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [enabled]);

  function markRead(id: string) {
    markNotificationRead(id).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }

  function markAllRead() {
    markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return { notifications, unreadCount, markRead, markAllRead };
}
