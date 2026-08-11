"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export interface NotificationItem {
  checkId: string;
  clientName: string;
  status: "processing" | "done" | "error";
  startedAt: string;
  completedAt: string | null;
  read: boolean;
}

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  trackProcessing: (checkId: string, clientName: string) => void;
  markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const POLL_INTERVAL_MS = 5000;

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notificationsRef = useRef(notifications);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const trackProcessing = useCallback((checkId: string, clientName: string) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.checkId === checkId)) return prev;
      return [
        { checkId, clientName, status: "processing", startedAt: new Date().toISOString(), completedAt: null, read: false },
        ...prev,
      ];
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Seed any already-processing checks on first load (covers a page reload mid-run).
  useEffect(() => {
    fetch("/api/checks?status=processing")
      .then((res) => res.json())
      .then((data) => {
        const items: NotificationItem[] = (data.checks ?? []).map(
          (c: { id: string; clientName: string; createdAt: string }) => ({
            checkId: c.id,
            clientName: c.clientName,
            status: "processing" as const,
            startedAt: c.createdAt,
            completedAt: null,
            read: true,
          })
        );
        if (items.length > 0) {
          setNotifications((prev) => [...items.filter((i) => !prev.some((p) => p.checkId === i.checkId)), ...prev]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const pending = notificationsRef.current.filter((n) => n.status === "processing");
      if (pending.length === 0) return;

      const results = await Promise.all(
        pending.map(async (n) => {
          try {
            const res = await fetch(`/api/checks/${n.checkId}`);
            const data = await res.json();
            return { checkId: n.checkId, check: data.check };
          } catch {
            return null;
          }
        })
      );

      setNotifications((prev) =>
        prev.map((n) => {
          const result = results.find((r) => r?.checkId === n.checkId);
          if (!result?.check || result.check.status === "processing") return n;
          return {
            ...n,
            status: result.check.status,
            completedAt: result.check.completedAt,
            read: false,
          };
        })
      );
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, trackProcessing, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
