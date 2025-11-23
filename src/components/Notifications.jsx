import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";

/* small inline icons to avoid importing an icon lib */
const IconBell = ({ className = "", ...props }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconCheck = ({ className = "", ...props }) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const IconTrash = ({ className = "", ...props }) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

/* NotificationItem: memoized and receives stable callbacks */
const NotificationItem = React.memo(({ n, markAsRead, deleteNotification }) => {
  return (
    <li
      className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
        n.isRead ? "bg-gray-50" : "bg-white"
      }`}
      role="listitem"
    >
      {n.image_url ? (
        <img
          src={`${API_URL}${n.image_url}`}
          alt={n.product_name || "Notification"}
          width={48}
          height={48}
          decoding="async"
          loading="lazy"
          className="w-12 h-12 object-cover rounded-md flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 bg-gray-100 flex items-center justify-center rounded-md text-gray-400 text-xs italic flex-shrink-0">
          No Img
        </div>
      )}

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <p className="text-sm text-gray-800 font-medium truncate">{n.message}</p>
        {n.product_name && <p className="text-xs text-gray-500 truncate">Product: {n.product_name}</p>}
        {n.quantity && <p className="text-xs text-gray-500">Qty: {n.quantity}</p>}
        <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
      </div>

      <div className="flex flex-col items-end gap-1">
        {!n.isRead && (
          <button
            onClick={() => markAsRead(n.id)}
            className="text-green-600 text-xs hover:underline focus:outline-none"
            aria-label={`Mark notification ${n.id} as read`}
          >
            Mark as read
          </button>
        )}
        <button
          onClick={() => deleteNotification(n.id)}
          className="text-red-500 text-xs hover:underline flex items-center gap-1 focus:outline-none"
          aria-label={`Delete notification ${n.id}`}
        >
          <IconTrash /> Delete
        </button>
      </div>
    </li>
  );
});

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const socketRef = useRef(null);
  const dropdownRef = useRef(null);
  const audioRef = useRef(null);

  // audio init once
  useEffect(() => {
    // keep this lazy and minimal
    audioRef.current = new Audio("/notification.mp3");
    audioRef.current.preload = "auto";
  }, []);

  const playSound = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    try {
      a.currentTime = 0;
      a.play().catch(() => {
        /* ignore autoplay errors */
      });
    } catch (e) {
      /* ignore */
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications`);
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, []);

  // connect socket only when component mounts
  useEffect(() => {
    let mounted = true;

    // dynamic import so socket client code doesn't inflate initial bundle
    (async () => {
      try {
        const mod = await import("socket.io-client");
        const { io } = mod;
        const s = io(`${API_URL}`, { autoConnect: true });
        socketRef.current = s;

        s.on("connect_error", (err) => {
          // optional: report or retry logic
          console.debug("socket connect error", err);
        });

        s.on("new_notification", (notif) => {
          // prepend new notification, keep max reasonable size (e.g., 200)
          setNotifications((prev) => {
            const next = [notif, ...prev];
            return next.length > 200 ? next.slice(0, 200) : next;
          });
          playSound();
        });
      } catch (err) {
        console.error("Socket init failed:", err);
      }
    })();

    // initial fetch
    fetchNotifications();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      mounted = false;
      // cleanup socket connection
      if (socketRef.current && socketRef.current.disconnect) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [fetchNotifications, playSound]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  // stable handlers
  const markAsRead = useCallback(
    async (id) => {
      try {
        await axios.put(`${API_URL}/notifications/${id}/read`);
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      } catch (err) {
        console.error("markAsRead error:", err);
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    try {
      const unread = notifications.filter((n) => !n.isRead).map((n) => n.id);
      // small optimization: if server exposes a bulk endpoint, prefer that. Here we do Promise.all but limit concurrency if many.
      const BATCH = 10;
      for (let i = 0; i < unread.length; i += BATCH) {
        const batch = unread.slice(i, i + BATCH);
        await Promise.all(batch.map((id) => axios.put(`${API_URL}/notifications/${id}/read`)));
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("markAllAsRead error:", err);
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (id) => {
    try {
      await axios.delete(`${API_URL}/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("deleteNotification error:", err);
    }
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown((prev) => !prev)}
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
        aria-label="Notifications"
        aria-expanded={showDropdown}
      >
        <IconBell className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 max-w-full sm:w-96 bg-white shadow-lg rounded-lg overflow-hidden z-50 border">
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b bg-gray-50">
            <span className="font-semibold text-gray-700 text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-green-600 text-xs hover:underline focus:outline-none"
                aria-label="Mark all notifications as read"
                title="Mark all as read"
              >
                <IconCheck /> Mark all
              </button>
            )}
          </div>

          {/* Notification List */}
          {notifications.length === 0 ? (
            <div className="p-4 text-gray-500 text-sm text-center">No notifications</div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-200" role="list">
              {notifications.map((n) => (
                <NotificationItem key={n.id} n={n} markAsRead={markAsRead} deleteNotification={deleteNotification} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
