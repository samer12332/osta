"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/axios";
import { getMyPosts } from "@/api/services/post.service.client";
import OngoingOrdersSection, {
  Order,
} from "@/components/sections/client/current-orders/OngoingOrdersSection";
import LatestCompletedOrdersSection from "@/components/sections/client/current-orders/LatestCompletedOrdersSection";
import HeroSection from "@/components/sections/client/current-orders/HeroSection";
import RateScreen from "@/components/sections/client/tracking/RateScreen";
import RateSuccessScreen from "@/components/sections/client/tracking/RateSuccessScreen";
import { Post } from "@/types/post.types";
import { usePolling } from "@/hooks/usePolling";

function getOrdersFromPayload(payload: unknown): Order[] {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: Order[] }).data;
  }
  return [];
}

function getPostsFromPayload(payload: unknown): Post[] {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: Post[] }).data;
  }
  return [];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [openPosts, setOpenPosts] = useState<Post[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrderToRate, setSelectedOrderToRate] = useState<Order | null>(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [givenRating, setGivenRating] = useState(0);
  const [showRateSuccess, setShowRateSuccess] = useState(false);

  const fetchAll = useCallback(async (showLoader: boolean) => {
    if (showLoader) setLoadingOrders(true);
    try {
      const [requestsRes, postsRes] = await Promise.all([
        api.get("/requests/my"),
        getMyPosts(),
      ]);
      setOrders(getOrdersFromPayload(requestsRes.data));
      const allPosts = getPostsFromPayload(postsRes.data);
      setOpenPosts(allPosts.filter((p) => p.status === "open"));
    } catch (error) {
      console.error(error);
    } finally {
      if (showLoader) setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchAll(true);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchAll]);

  // ── Polling: بيحدث حالة الطلبات تلقائيًا كل 8 ثواني من غير ما المستخدم
  // يعمل refresh يدوي. showLoader=false عشان مايظهرش spinner كل مرة.
  usePolling(
    useCallback(() => {
      void fetchAll(false);
    }, [fetchAll]),
    8000,
  );

  useEffect(() => {
    const pendingRequestId = sessionStorage.getItem("pendingDepositRequestId");
    if (!pendingRequestId) return;
    let attempts = 0;
    const intervalId = window.setInterval(() => {
      attempts += 1;
      void fetchAll(false);
      if (attempts >= 6) {
        window.clearInterval(intervalId);
        sessionStorage.removeItem("pendingDepositRequestId");
      }
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [fetchAll]);

  useEffect(() => {
    const pendingRequestId = sessionStorage.getItem("pendingDepositRequestId");
    if (!pendingRequestId) return;
    const currentRequest = orders.find((o) => o._id === pendingRequestId);
    const isDepositConfirmed =
      currentRequest?.depositStatus === "paid" ||
      currentRequest?.status === "in_progress";
    if (isDepositConfirmed)
      sessionStorage.removeItem("pendingDepositRequestId");
  }, [orders]);

  const handleOpenRateModal = useCallback((order: Order) => {
    setSelectedOrderToRate(order);
    setRatingError("");
    setShowRateSuccess(false);
  }, []);

  const handleCloseRatingFlow = useCallback(() => {
    setSelectedOrderToRate(null);
    setRatingSubmitting(false);
    setRatingError("");
    setShowRateSuccess(false);
  }, []);

  const handleSubmitRating = useCallback(
    async (rating: number, comment: string) => {
      if (!selectedOrderToRate) return;

      setRatingSubmitting(true);
      setRatingError("");

      try {
        await api.post("/reviews", {
          requestId: selectedOrderToRate._id,
          rating,
          ...(comment.trim() ? { comment: comment.trim() } : {}),
        });
        setGivenRating(rating);
        setShowRateSuccess(true);
        await fetchAll(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "حصل خطأ، حاول تاني";
        setRatingError(message);
      } finally {
        setRatingSubmitting(false);
      }
    },
    [fetchAll, selectedOrderToRate],
  );

  return (
    <div className="min-h-screen">
      <HeroSection />
      {loadingOrders ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 rounded-full border-4 border-[var(--accent-color)] border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          <OngoingOrdersSection
            orders={orders}
            openPosts={openPosts}
            onCancelled={() => void fetchAll(false)}
          />
          <LatestCompletedOrdersSection
            orders={orders}
            onRateNow={handleOpenRateModal}
          />
        </>
      )}

      {selectedOrderToRate && !showRateSuccess && (
        <RateScreen
          technicianName={
            selectedOrderToRate.assignedTechnician?.fullName ?? "الفني"
          }
          onSubmit={handleSubmitRating}
          submitting={ratingSubmitting}
          error={ratingError}
        />
      )}

      {selectedOrderToRate && showRateSuccess && (
        <RateSuccessScreen
          rating={givenRating}
          onBackToHome={handleCloseRatingFlow}
        />
      )}
    </div>
  );
}
