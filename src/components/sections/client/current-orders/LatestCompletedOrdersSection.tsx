"use client";

import { Star, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Order } from "./OngoingOrdersSection";

type ReviewLikeOrder = Order & {
  review?: { rating: number; comment?: string } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// ─── Completed Card ───────────────────────────────────────────────────────────

function CompletedOrderCard({
  order,
  onRateNow,
}: {
  order: Order;
  onRateNow: (order: Order) => void;
}) {
  const technicianName = order.assignedTechnician?.fullName ?? "—";
  const finalCost = order.totalPrice ?? null;

  // الـ API بيبعت "review" مش "clientReview"
  const clientRating =
    order.clientReview?.rating ?? (order as ReviewLikeOrder).review?.rating ?? null;

  // صورة الخدمة من serviceId.image
  const serviceImage = order.serviceId?.image ?? null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex gap-4" dir="rtl">
      
      {/* المحتوى */}
      <div className="flex-1 text-right">
        <h4 className="font-bold text-[var(--primary-color)] text-base mb-1">
          {order.serviceId?.name}
        </h4>
        <p className="text-sm text-gray-400 mb-3">
          {formatDate(order.createdAt)}
        </p>

        <div className="flex gap-5 mb-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-gray-400">الفني</p>
            <p className="font-bold text-[var(--primary-color)] text-sm">
              {technicianName}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-gray-400">التكلفة النهائية</p>
            {finalCost ? (
              <p className="font-bold text-[var(--primary-color)] text-lg">
                {finalCost}{" "}
                <span className="text-sm font-normal">جنيه</span>
              </p>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>
        </div>

        {/* النجوم */}
        <div className="flex items-center gap-1 justify-end">
          <span className="text-xs text-gray-400 ml-1">تقييمك</span>
          {clientRating !== null ? (
            [1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={14}
                className={
                  star <= Math.round(clientRating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-200 fill-gray-200"
                }
              />
            ))
          ) : (
            <button
              type="button"
              className="text-xs text-[var(--primary-color)] font-bold underline underline-offset-2"
              onClick={(e) => {
                e.stopPropagation();
                onRateNow(order);
              }}
            >
              قيّم الآن
            </button>
          )}
        </div>
      </div>

      {/* صورة الخدمة */}
      <div className="w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
        {serviceImage ? (
<Image
  src={serviceImage}
  alt={order.serviceId?.name ?? ""}
  width={112}
  height={112}
  className="w-full h-full object-cover"
/>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-300 text-xs text-center px-2">
              {order.categoryId?.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

interface Props {
  orders: Order[];
  onRateNow: (order: Order) => void;
}

export default function LatestCompletedOrdersSection({
  orders,
  onRateNow,
}: Props) {
  const completedOrders = orders.filter((o) => o.status === "completed");


  return (
    <div className="section-wrapper">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--primary-color)] flex items-center gap-2">
          <span className="w-1 h-6 bg-[var(--primary-color)] rounded-full inline-block" />
          آخر الطلبات المكتملة
        </h2>
        <Link
          href="/client/orders-history"
          className="flex items-center gap-1 text-sm text-[var(--primary-color)] font-medium hover:opacity-70 transition-opacity"
        >
          عرض الكل
          <ArrowLeft size={16} />
        </Link>
      </div>

      {completedOrders.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-10">
          لا توجد طلبات مكتملة
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {completedOrders.map((order) => (
            <CompletedOrderCard
              key={order._id}
              order={order}
              onRateNow={onRateNow}
            />
          ))}
        </div>
      )}
    </div>
  );
}
