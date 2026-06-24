"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  HelpCircle,
  Menu,
  Ticket,
  WalletCards,
  X,
} from "lucide-react";
import logoImage from "@/assets/images/logo.svg";
import dmsIcon from "@/assets/icons/Dms.svg";
import bellIcon from "@/assets/icons/notification.svg";
import userIcon from "@/assets/icons/user.svg";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { useUnreadTotal } from "@/hooks/useUnreadTotal";
import { api } from "@/api/axios";
import ProfileDropdown from "@/components/sections/technician/profile/ProfileDropdown";

import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import NotificationToast from "@/components/notifications/NotificationToast";
import SupportMenuPanel from "@/components/layout/support/SupportMenuPanel";

const SUPPORT_PATH = "/technician/support";

const NAV_LINKS = [
  { label: "الطلبات الواردة", href: "/technician/orders" },
  { label: "المحلات", href: "/technician/stores" },
];

const WORK_LINKS = [
  {
    label: "العروض المعلقة",
    href: "/technician/portfolio/pending",
    icon: WalletCards,
  },
  {
    label: "العروض الحالية",
    href: "/technician/portfolio/current",
    icon: BriefcaseBusiness,
  },
];
interface CurrentUser {
  fullName: string;
  email: string;
}
export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [workMenuOpen, setWorkMenuOpen] = useState(false);
  const [supportMenuOpen, setSupportMenuOpen] = useState(false);
  const desktopWorkMenuRef = useRef<HTMLDivElement | null>(null);
  const desktopSupportMenuRef = useRef<HTMLDivElement | null>(null);
  const { token, userId, role } = useAuth();

  const isWorkRoute = pathname.startsWith("/technician/portfolio");
  const isSupportRoute = pathname.startsWith(SUPPORT_PATH);

  const { socket } = useSocket(token);
  const { total, refreshTotal } = useUnreadTotal(socket, userId, role);
  // ── PROFILE DROPDOWN ────────────────────────────────────────────────────────
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

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
    const handlePointerDown = (event: MouseEvent) => {
      // لو الـ mobile menu مفتوح، متتدخلش — الـ buttons بتتحكم في نفسها
      if (menuOpen) return;

      if (
        desktopWorkMenuRef.current &&
        !desktopWorkMenuRef.current.contains(event.target as Node)
      ) {
        setWorkMenuOpen(false);
      }
      if (
        desktopSupportMenuRef.current &&
        !desktopSupportMenuRef.current.contains(event.target as Node)
      ) {
        setSupportMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  return (
    <nav
      className="relative z-40 mx-auto w-full  bg-[#B4D4BC70]/50 px-6 py-2 shadow-sm backdrop-blur-md lg:w-[90%] lg:rounded-full overflow-visible"
      dir="rtl"
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/technician/orders" className="flex-shrink-0">
            <Image
              src={logoImage}
              alt="أُسطى"
              width={100}
              height={40}
              className="h-10 w-auto"
            />
          </Link>

          <div className="hidden items-center  gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  pathname === link.href
                    ? "bg-[#F6F5F1] text-[var(--primary-color)]"
                    : "text-[#112D27] hover:bg-[#F6F5F1] hover:text-[var(--primary-color)]"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="relative" ref={desktopWorkMenuRef}>
              <button
                type="button"
                onClick={() => setWorkMenuOpen((open) => !open)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isWorkRoute
                    ? "bg-[#F6F5F1] text-[var(--primary-color)]"
                    : "text-[#112D27] hover:bg-[#F6F5F1] hover:text-[var(--primary-color)]"
                }`}
              >
                الأعمال
              </button>

              {workMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-56 rounded-[24px] border border-[#EAECE8] bg-white p-3 shadow-[0_18px_42px_rgba(17,45,39,0.18)]">
                  <div className="flex flex-col gap-1" dir="rtl">
                    {WORK_LINKS.map((link) => {
                      const Icon = link.icon;
                      const active =
                        pathname === link.href ||
                        (link.href === "/technician/portfolio/current" &&
                          pathname === "/technician/portfolio");

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setWorkMenuOpen(false)}
                          className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-right text-base transition-all ${
                            active
                              ? "bg-[#F7FAF2] text-[var(--primary-color)]"
                              : "text-[#31554B] hover:bg-[#F8FAF9]"
                          }`}
                        >
                          <span>{link.label}</span>
                          <Icon size={18} className="text-[#31554B]" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            {/* ── SUPPORT DROPDOWN ───────────────────────────────────────────── */}
            <div className="relative" ref={desktopSupportMenuRef}>
              <button
                type="button"
                onClick={() => setSupportMenuOpen((open) => !open)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isSupportRoute
                    ? "bg-[#F6F5F1] text-[var(--primary-color)]"
                    : "text-[#112D27] hover:bg-[#F6F5F1] hover:text-[var(--primary-color)]"
                }`}
              >
                الدعم و المساعدة
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
              onClick={() => router.push("/technician/direct-messages")}
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
                className="relative flex h-9 w-9 items-center justify-center rounded-full transition-all hover:bg-gray-100 hover:text-[var(--primary-color)]"
              >
                <Image
                  src={bellIcon}
                  alt="Notifications"
                  width={20}
                  height={20}
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
                  targetRoute="/technician/orders"
                />
              )}
            </div>
            {/* ─────────────────────────────────────────────────────────────────────── */}

            <div ref={profileRef}>
              <button
                onClick={() => setProfileOpen((prev) => !prev)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#112D27] transition-all hover:bg-gray-100 hover:text-[var(--primary-color)]"
              >
                <Image src={userIcon} alt="Profile" width={28} height={28} />
              </button>

              {profileOpen && (
                <ProfileDropdown
                  currentUser={currentUser}
                  onClose={() => setProfileOpen(false)}
                  anchorRef={profileRef}
                />
              )}
            </div>

            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#112D27] transition-all hover:bg-gray-100 hover:text-[var(--primary-color)] md:hidden"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen ? (
        <div className="flex flex-col gap-2 border-t border-gray-100 bg-white px-4 py-3 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#112D27] transition-all hover:bg-gray-50 hover:text-[var(--primary-color)]"
            >
              {link.label}
            </Link>
          ))}

          <div className="rounded-2xl border border-[#EEF1EF] p-2">
            <button
              type="button"
              onClick={() => setWorkMenuOpen((open) => !open)}
              className={`w-full rounded-xl px-4 py-2.5 text-right text-sm font-medium transition-all ${
                isWorkRoute
                  ? "bg-[#F6F5F1] text-[var(--primary-color)]"
                  : "text-[#112D27] hover:bg-gray-50 hover:text-[var(--primary-color)]"
              }`}
            >
              الأعمال
            </button>

            {workMenuOpen ? (
              <div className="mt-2 flex flex-col gap-1">
                {WORK_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.href}
                      type="button"
                      onClick={() => {
                        setWorkMenuOpen(false);
                        setMenuOpen(false);
                        router.push(link.href);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm text-[#31554B] hover:bg-[#F8FAF9]"
                    >
                      <span>{link.label}</span>
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

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
        </div>
      ) : null}

      <NotificationToast
        notification={notificationPanelOpen ? null : latestNotification}
        onClose={clearLatestNotification}
        targetRoute="/technician/orders"
      />
    </nav>
  );
}
