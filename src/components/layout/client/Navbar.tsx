"use client";

import { useState, useRef, useEffect } from "react";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  X,
  User,
  CreditCard,
  FileText,
  LogOut,
  HelpCircle,
  Ticket,
} from "lucide-react";
import logoImage from "@/assets/images/logo.svg";
import dmsIcon from "@/assets/icons/Dms.svg";
import bellIcon from "@/assets/icons/notification.svg";
import userIcon from "@/assets/icons/user.svg";

import { api } from "@/api/axios";

import { useSocket } from "@/hooks/useSocket";
import { useUnreadTotal } from "@/hooks/useUnreadTotal";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import NotificationToast from "@/components/notifications/NotificationToast";
import SupportMenuPanel from "@/components/layout/support/SupportMenuPanel";

const SUPPORT_PATH = "/client/support";

const NAV_LINKS = [
  { label: "الرئيسية", href: "/client/home" },
  { label: "الطلبات الحالية", href: "/client/orders" },
  { label: "الأقسام", href: "/client/categories" },
];

interface CurrentUser {
  fullName: string;
  email: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { token, userId, role } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [supportMenuOpen, setSupportMenuOpen] = useState(false);
  const supportMenuRef = useRef<HTMLDivElement>(null);
  const isSupportRoute = pathname.startsWith(SUPPORT_PATH);

  // Fetch logged-in user from GET /users/me
  useEffect(() => {
    api
      .get<{ data: CurrentUser }>("/users/me")
      .then((res) => {
        const user = res.data?.data ?? (res.data as unknown as CurrentUser);
        setCurrentUser({ fullName: user.fullName, email: user.email });
      })
      .catch(() => {
        // token invalid or expired — interceptor will handle redirect
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // لو الـ mobile menu مفتوح، متتدخلش — الـ buttons بتتحكم في نفسها
      if (menuOpen) return;

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
      if (
        supportMenuRef.current &&
        !supportMenuRef.current.contains(event.target as Node)
      ) {
        setSupportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = async () => {
    setProfileOpen(false);
    try {
      // POST /auth/logout — clears refreshToken on backend
      await api.post("/auth/logout");
    } catch {
      // proceed with local cleanup even if request fails
    } finally {
      localStorage.removeItem("access_token");
      router.push("/login");
    }
  };

  const userInitial = currentUser?.fullName?.charAt(0) ?? "؟";

  // ── NOTIFICATION STATE ──────────────────────────────────────────────────────
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  // ─────────────────────────────────────────────────────────────────────────────

  const { socket } = useSocket(token);
  const { total, refreshTotal } = useUnreadTotal(socket, userId, role);

  const { socket: notificationSocket } = useNotificationSocket(userId);
  const {
    notifications,
    isLoading,
    unreadCount,
    latestNotification,
    markAllAsRead,
    clearLatestNotification,
  } = useNotifications(notificationSocket, userId);

  const handleBellClick = () => {
    setNotificationPanelOpen((prev) => {
      const next = !prev;

      if (next && unreadCount > 0) {
        void markAllAsRead();
        clearLatestNotification();
      }
      return next;
    });
  };

  useEffect(() => {
    if (notificationPanelOpen && latestNotification) {
      clearLatestNotification();
    }
  }, [clearLatestNotification, latestNotification, notificationPanelOpen]);

  useEffect(() => {
    if (latestNotification?.type === "new_message") {
      void refreshTotal();
    }
  }, [latestNotification, refreshTotal]);
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <nav
      className="relative z-50 w-full lg:w-[90%] mx-auto bg-[#FEFEFE70]/50 backdrop-blur-md lg:rounded-full px-6 py-2 shadow-sm"
      dir="rtl"
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* اللوجو */}
          <Link href="/client/home" className="flex-shrink-0">
            <Image
              src={logoImage}
              alt="أُسطى"
              width={100}
              height={40}
              className="h-10 w-auto"
            />
          </Link>

          {/* الروابط — desktop */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm rounded-full transition-all font-medium
                ${
                  pathname === link.href
                    ? "bg-[#F6F5F1] text-[var(--primary-color)]"
                    : "text-[#112D27] hover:text-[var(--primary-color)] hover:bg-[#F6F5F1]"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* ── SUPPORT DROPDOWN ───────────────────────────────────────────── */}
            <div className="relative" ref={supportMenuRef}>
              <button
                type="button"
                onClick={() => setSupportMenuOpen((open) => !open)}
                className={`px-4 py-2 text-sm rounded-full transition-all font-medium ${
                  isSupportRoute
                    ? "bg-[#F6F5F1] text-[var(--primary-color)]"
                    : "text-[#112D27] hover:text-[var(--primary-color)] hover:bg-[#F6F5F1]"
                }`}
              >
                الدعم والمساعدة
              </button>

              {supportMenuOpen ? (
                <SupportMenuPanel
                  basePath={SUPPORT_PATH}
                  onClose={() => setSupportMenuOpen(false)}
                />
              ) : null}
            </div>
            {/* ─────────────────────────────────────────────────────────────────── */}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/client/direct-messages")}
              className="relative flex h-9 w-9 items-center justify-center rounded-full transition-all hover:bg-gray-100 hover:text-[var(--primary-color)]"
            >
              <Image src={dmsIcon} alt="DMs" width={24} height={24} />

              {total > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                  {total > 9 ? "9+" : total}
                </span>
              )}
            </button>

            {/* ── NOTIFICATION BELL ─────────────────────────────────────────────── */}
            <div className="relative">
              <button
                onClick={handleBellClick}
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all hover:text-[var(--primary-color)]"
              >
                <Image
                  src={bellIcon}
                  alt="Notifications"
                  width={20}
                  height={20}
                  className="text-gray-500 hover:text-[#112D27]"
                />

                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationPanelOpen && (
                <NotificationPanel
                  notifications={notifications}
                  isLoading={isLoading}
                  onClose={() => setNotificationPanelOpen(false)}
                  targetRoute="/client/orders"
                />
              )}
            </div>
            {/* ─────────────────────────────────────────────────────────────────────── */}

            <div className="relative" ref={profileRef}>
  <button
    onClick={() => setProfileOpen((prev) => !prev)}
    className="w-9 h-9 flex items-center justify-center rounded-full text-[#112D27] hover:bg-gray-100 transition-all text-gray-500 hover:text-[var(--primary-color)]"
  >
    <Image src={userIcon} alt="Profile" width={24} height={24} />
  </button>

  {profileOpen && (
    <div
      dir="rtl"
      className="absolute end-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-[9999]"
    >
      {/* User info */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="min-w-0 text-right">
          {currentUser ? (
            <>
              <p className="text-sm font-semibold text-[#112D27] truncate">
                {currentUser.fullName}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {currentUser.email}
              </p>
            </>
          ) : (
            <div className="space-y-1.5">
              <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
              <div className="h-2.5 w-36 bg-gray-100 rounded animate-pulse" />
            </div>
          )}
        </div>

        <div className="w-10 h-10 rounded-full text-white bg-[var(--primary-color)] flex items-center justify-center font-bold text-lg flex-shrink-0">
          {currentUser ? (
            userInitial
          ) : (
            <span className="w-5 h-5 rounded-full bg-gray-200 animate-pulse block" />
          )}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Profile */}
      <Link
        href="/client/profile"
        onClick={() => setProfileOpen(false)}
        className="flex items-center justify-between flex-row-reverse px-5 py-4 text-sm text-[#112D27] hover:bg-gray-50 transition-all"
      >
        <User size={18}  />
        <span>الملف الشخصي</span>
      </Link>

      {/* Orders */}
      <Link
        href="/client/orders-history"
        onClick={() => setProfileOpen(false)}
        className="flex items-center justify-between flex-row-reverse px-5 py-4 text-sm text-[#112D27] hover:bg-gray-50 transition-all"
      >
        <CreditCard size={18}  />
        <span>سجل الطلبات</span>
      </Link>

      {/* Invoices */}
      <Link
        href="/client/invoices"
        onClick={() => setProfileOpen(false)}
        className="flex items-center justify-between flex-row-reverse px-5 py-4 text-sm text-[#112D27] hover:bg-gray-50 transition-all"
      >
        <FileText size={18}  />
        <span>الفواتير</span>
      </Link>

      <div className="border-t border-gray-100" />

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-between flex-row-reverse px-4 py-4 text-sm text-red-500 hover:bg-red-50 transition-all"
      >
        <LogOut size={18} />
        <span>تسجيل الخروج</span>
      </button>
    </div>
  )}
</div>

            {/* زرار الموبايل */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-[#112D27] hover:bg-gray-100 transition-all text-gray-500 hover:text-[var(--primary-color)]"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="px-4 py-2.5 text-sm text-[#112D27] hover:text-[var(--primary-color)] rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              {link.label}
            </Link>
          ))}

          {/* ── SUPPORT (mobile) ──────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-[#EEF1EF] p-2">
            <button
              type="button"
              onClick={() => setSupportMenuOpen((open) => !open)}
              className={`w-full rounded-xl px-4 py-2.5 text-right text-sm font-medium transition-all ${
                isSupportRoute
                  ? "bg-[#F6F5F1] text-[var(--primary-color)]"
                  : "text-[#112D27] hover:bg-gray-50 hover:text-[var(--primary-color)]"
              }`}
            >
              الدعم و المساعدة
            </button>

            {supportMenuOpen ? (
              <div className="mt-2 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setSupportMenuOpen(false);
                    setMenuOpen(false);
                    router.push(`${SUPPORT_PATH}?tab=tickets`);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm text-[#31554B] hover:bg-[#F8FAF9]"
                >
                  <span>التذاكر</span>
                  <Ticket size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSupportMenuOpen(false);
                    setMenuOpen(false);
                    router.push(`${SUPPORT_PATH}?tab=help`);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm text-[#31554B] hover:bg-[#F8FAF9]"
                >
                  <span>مركز المساعدة</span>
                  <HelpCircle size={16} />
                </button>
              </div>
            ) : null}
          </div>
          {/* ─────────────────────────────────────────────────────────────────────── */}
        </div>
      )}

      <NotificationToast
        notification={notificationPanelOpen ? null : latestNotification}
        onClose={clearLatestNotification}
        targetRoute="/client/orders"
      />
    </nav>
  );
}
