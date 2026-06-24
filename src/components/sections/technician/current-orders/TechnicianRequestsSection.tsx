"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Users, Eye } from "lucide-react";
import { api } from "@/api/axios";
import walletIcon from "@/assets/icons/wallet.svg";
import arrowIcon from "@/assets/icons/arrow.svg";
import Button from "@/components/ui/Button";
import Image from "next/image";
import SubmitProposalModal from "@/components/sections/technician/current-orders/SubmitProposalModal";
import BookingSuccess from "@/components/sections/technician/current-orders/BookingSuccess";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "popular" | "custom";

interface PendingRequest {
  _id: string;
  userId: { _id: string; fullName: string; phone?: string } | null;
  categoryId: { _id: string; name: string };
  serviceId: {
    _id: string;
    name: string;
    description?: string;
    priceRange?: { min: number; max: number };
  };
  preferredDate: string;
  preferredTime: string;
  status: string;
  depositAmount: number;
  address: {
    fullAddress: string;
    district: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
  notes: string;
  createdAt: string;
}

interface CustomPost {
  _id: string;
  userId: { _id: string; fullName: string; phone?: string } | null;
  categoryId: { _id: string; name: string } | null;
  title?: string;
  description: string;
  address: { fullAddress: string; district: string };
  preferredDate: string;
  preferredTime: string;
  budget?: number | null;
  status: "open" | "accepted" | "cancelled";
  createdAt: string;
  proposalCount: number;
  hasApplied?: boolean;
}

type CustomPostsResponseItem = CustomPost & {
  proposalsCount?: number;
  proposals?: unknown[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// ─── RequestCard (popular) ────────────────────────────────────────────────────

function RequestCard({
  request,
  onAccept,
  accepting,
}: {
  request: PendingRequest;
  onAccept: (id: string) => void;
  accepting: string | null;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4" dir="rtl">
      {request.serviceId?.priceRange && (
        <div className="flex justify-start mb-3">
          <span className="flex items-center gap-1 text-xs font-bold bg-[var(--secondary-color)] text-[var(--primary-color)] px-3 py-1.5 rounded-full">
            <Image src={walletIcon} alt="wallet" width={14} height={14} />
            {request.serviceId.priceRange.min}–{request.serviceId.priceRange.max} ج.م
          </span>
        </div>
      )}

      <h3 className="font-bold text-[var(--primary-color)] text-base mb-2 text-right">
        {request.serviceId?.name}
      </h3>

      {request.serviceId?.description && (
        <p className="text-sm text-gray-400 text-right mb-2 leading-relaxed">
          {request.serviceId.description}
        </p>
      )}

      {request.notes && (
        <p className="text-sm text-right mb-4 leading-relaxed">
          <span className="text-gray-400">ملاحظة : </span>
          <span className="text-gray-500">{request.notes}</span>
        </p>
      )}

      {request.userId && (
        <div className="flex flex-row-reverse items-center justify-between rounded-xl bg-[#F8FAF9] p-4">
          <button
            onClick={() => onAccept(request._id)}
            disabled={accepting === request._id}
            className={`h-10 min-w-[110px] rounded-full text-sm font-bold transition-all ${
              accepting === request._id
                ? "bg-gray-200 text-gray-400"
                : "bg-[var(--accent-color)] text-[var(--primary-color)]"
            }`}
          >
            {accepting === request._id ? "جارٍ التقديم..." : "تقديم"}
          </button>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D9F06A] flex items-center justify-center shrink-0">
              <span className="font-bold text-[var(--primary-color)]">
                {request.userId.fullName?.charAt(0) ?? "؟"}
              </span>
            </div>
            <div className="text-right">
              <h3 className="font-bold text-[var(--primary-color)] text-base">
                {request.userId.fullName}
              </h3>
              <p className="text-xs text-gray-500 mb-2">عميل موثق</p>
              <div className="flex items-center justify-end gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <MapPin size={13} className="text-[var(--accent-color)]" />
                  <span>{request.address?.district}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={13} className="text-[var(--accent-color)]" />
                  <span>{formatDate(request.preferredDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CustomPostCard ───────────────────────────────────────────────────────────

function CustomPostCard({
  post,
  onSubmit,
}: {
  post: CustomPost;
  onSubmit: (id: string, title: string) => void;
}) {
  const router = useRouter();
  const hasApplied = Boolean(post.hasApplied);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4" dir="rtl">
      {post.budget != null && (
        <div className="flex justify-start mb-3">
          <span className="flex items-center gap-1 text-xs font-bold bg-[var(--secondary-color)] text-[var(--primary-color)] px-3 py-1.5 rounded-full">
            <Image src={walletIcon} alt="wallet" width={14} height={14} />
            {post.budget} ج.م
          </span>
        </div>
      )}

      <h3 className="font-bold text-[var(--primary-color)] text-base mb-2 text-right">
        {post.title ?? post.categoryId?.name ?? "خدمة مخصصة"}
      </h3>

      {post.description && (
        <p className="text-sm text-gray-400 text-right mb-4 leading-relaxed line-clamp-2">
          {post.description}
        </p>
      )}

      {post.userId && (
        <div className="bg-[#F8FAF9] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D9F06A] flex items-center justify-center shrink-0">
              <span className="font-bold text-[var(--primary-color)]">
                {post.userId.fullName?.charAt(0) ?? "؟"}
              </span>
            </div>
            <div className="text-right flex-1">
              <h4 className="font-bold text-[var(--primary-color)] text-base">
                {post.userId.fullName}
              </h4>
              <p className="text-xs text-gray-500 mb-2">عميل موثق</p>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <MapPin size={13} className="text-[var(--accent-color)]" />
                    <span>{post.address?.district}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={13} className="text-[var(--accent-color)]" />
                    <span>{formatDate(post.preferredDate)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={13} className="text-[var(--accent-color)]" />
                    <span>{post.proposalCount} عروض</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/technician/services/${post._id}`)}
                    className="flex items-center gap-1 px-4 h-10 rounded-full border border-gray-200 text-sm text-gray-600 font-bold hover:border-[var(--primary-color)] transition-all"
                  >
                    <Eye size={16} className="text-gray-400" />
                    عرض التفاصيل
                  </button>

                  <button
                    onClick={() =>
                      !hasApplied &&
                      onSubmit(post._id, post.title ?? post.categoryId?.name ?? "خدمة مخصصة")
                    }
                    disabled={hasApplied}
                    className={`min-w-[90px] h-10 rounded-full font-bold text-sm transition-all ${
                      hasApplied
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-[var(--accent-color)] text-[var(--primary-color)]"
                    }`}
                  >
                    {hasApplied ? "تم التقديم" : "تقديم"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TipCard ──────────────────────────────────────────────────────────────────

function TipCard() {
  return (
    <div
      className="rounded-2xl p-5 text-white h-fit"
      style={{ background: "linear-gradient(to bottom, #1C4B41, #112D27)" }}
      dir="rtl"
    >
      <div className="flex mb-3">
        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">نصيحة احترافية</span>
      </div>
      <h3 className="font-bold text-lg mb-2 text-right leading-snug">
        عروض مفضلة = فرص قبول أعلى
      </h3>
      <p className="text-sm text-white/80 text-right leading-relaxed mb-4">
        اكتب عرضاً واضحاً يوضح خطوات العمل، الوقت المتوقع، والمواد المستخدمة لزيادة ثقة العميل.
      </p>
      <Button fullWidth className="flex items-center justify-center gap-2">
        اعرف المزيد
        <Image src={arrowIcon} alt="other" width={14} height={14} />
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TechnicianRequestsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("popular");

  // popular
  const [popularRequests, setPopularRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  // custom
  const [customPosts, setCustomPosts] = useState<CustomPost[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(false);

  // modals
  const [proposalModal, setProposalModal] = useState<{ postId: string; postTitle: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // ─── fetch popular ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "popular") return;
    api
      .get("/requests/pending")
      .then((res) => setPopularRequests(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTab]);

// ─── fetch custom ───────────────────────────────────────────────────────────
useEffect(() => {
  if (activeTab !== "custom") return;
  api
    .get("/posts")
    .then((res) => {
      const posts: CustomPostsResponseItem[] = res.data.data ?? [];
      // الـ proposalCount جاي مباشرة من الـ API
      const withCounts: CustomPost[] = posts.map((post) => ({
        ...post,
        proposalCount: post.proposalsCount ?? post.proposals?.length ?? 0,
        hasApplied: Boolean(post.hasApplied),
      }));
      setCustomPosts(withCounts);
    })
    .catch(console.error)
    .finally(() => setLoadingCustom(false));
}, [activeTab]);

  // ─── handlers ───────────────────────────────────────────────────────────────

  const handleAccept = async (requestId: string) => {
    setAccepting(requestId);
    try {
      await api.patch(`/requests/${requestId}/accept`);
      setPopularRequests((prev) => prev.filter((r) => r._id !== requestId));
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setAccepting(null);
    }
  };

  const handleOpenProposalModal = (postId: string, postTitle: string) => {
    setProposalModal({ postId, postTitle });
  };

  const handleProposalSuccess = (postId: string) => {
    setProposalModal(null);
    setCustomPosts((prev) => prev.filter((p) => p._id !== postId));
    setShowSuccess(true);
  };

  // ─── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f7f7f5] p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Content — ٣/٤ */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="mb-6">
            <div className="flex w-full rounded-full bg-[#E9EEEA] p-1">
              <button
                onClick={() => {
                  setLoading(true);
                  setActiveTab("popular");
                }}
                className={`h-12 flex-1 rounded-full text-base font-bold transition-all ${
                  activeTab === "popular"
                    ? "border-2 border-[var(--accent-color)] bg-[var(--primary-color)] text-white"
                    : "text-[var(--primary-color)]"
                }`}
              >
                الخدمات الشائعة
              </button>
              <button
                onClick={() => {
                  setLoadingCustom(true);
                  setActiveTab("custom");
                }}
                className={`h-12 flex-1 rounded-full text-base font-bold transition-all ${
                  activeTab === "custom"
                    ? "border-2 border-[var(--accent-color)] bg-[var(--primary-color)] text-white"
                    : "text-[var(--primary-color)]"
                }`}
              >
                الخدمات المخصصة
              </button>
            </div>
          </div>

          {/* Popular */}
          {activeTab === "popular" && (
            <>
              {!loading && (
                <p className="mb-4 text-sm text-gray-400" dir="rtl">
                  عرض {popularRequests.length} طلب خدمة متاح
                </p>
              )}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--accent-color)] border-t-transparent" />
                </div>
              ) : popularRequests.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-20">لا توجد طلبات متاحة الآن</p>
              ) : (
                popularRequests.map((req) => (
                  <RequestCard
                    key={req._id}
                    request={req}
                    onAccept={handleAccept}
                    accepting={accepting}
                  />
                ))
              )}
            </>
          )}

          {/* Custom */}
          {activeTab === "custom" && (
            <>
              {!loadingCustom && (
                <p className="text-sm text-gray-400 mb-4" dir="rtl">
                  عرض {customPosts.length} خدمة مخصصة متاحة
                </p>
              )}
              {loadingCustom ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 rounded-full border-4 border-[var(--accent-color)] border-t-transparent animate-spin" />
                </div>
              ) : customPosts.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-20">لا توجد خدمات مخصصة متاحة الآن</p>
              ) : (
                customPosts.map((post) => (
                  <CustomPostCard
                    key={post._id}
                    post={post}
                    onSubmit={handleOpenProposalModal}
                  />
                ))
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <TipCard />
        </div>
      </div>

      {/* SubmitProposalModal */}
      {proposalModal && (
        <SubmitProposalModal
          postId={proposalModal.postId}
          postTitle={proposalModal.postTitle}
          onClose={() => setProposalModal(null)}
          onSuccess={handleProposalSuccess}
        />
      )}

      {/* BookingSuccess */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm">
            <BookingSuccess onClose={() => setShowSuccess(false)} />
          </div>
        </div>
      )}
    </div>
  );
}