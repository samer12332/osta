"use client";

import { useRouter } from "next/navigation";
import { Calendar, File, MapPin } from "lucide-react";
import Image from "next/image";
import walletIcon from "@/assets/icons/wallet.svg";
import imageIcon from "@/assets/icons/image.svg"

interface Post {
  _id: string;
  title?: string;
  description: string;
  budget?: number | null;
  preferredDate: string;
  preferredTime: string;
  status: string;
  image?: string | null;
  address: { fullAddress: string; district: string };
  categoryId?: { _id: string; name: string } | null;
  userId?: { _id: string; fullName: string } | null;
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
  });

const formatTime = (timeStr: string): string => {
  const clean = timeStr.replace(/\s*(AM|PM)\s*/i, "").trim();
  const [hStr, mStr] = clean.split(":");
  let h = parseInt(hStr);
  const m = mStr ?? "00";
  const label = h >= 12 ? "مساءً" : "صباحاً";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${label}`;
};

export default function ServiceDetailsSection({
  post,
  proposalsCount,
  hasApplied,
  onSubmitClick,
}: {
  post: Post;
  proposalsCount: number;
  hasApplied: boolean;
  onSubmitClick: () => void;
}) {
  const router = useRouter();
  const clientName = post.userId?.fullName ?? "عميل";
  const clientInitial = clientName.charAt(0);

  return (
    <div className="bg-white border-b border-gray-100" dir="rtl">
      <div className="section-wrapper">
        {/* Title */}
        <div className="flex items-center gap-2 mb-8">
          <span className="w-1 h-7 bg-[var(--accent-color)] rounded-full inline-block" />
          <h1 className="text-2xl font-bold text-[var(--primary-color)]">
            ملخص الطلب
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          {/* Client + badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D9F06A] flex items-center justify-center font-bold text-[var(--primary-color)]">
                {clientInitial}
              </div>
              <div className="text-right">
                <p className="font-bold text-[var(--primary-color)]">{clientName}</p>
                <p className="text-xs text-gray-400">عميل موثق</p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full text-[var(--purple-dark)] bg-[var(--purple-light)]">
              خدمة مخصصة
            </span>
          </div>

          {/* Service title */}
          <h2 className="text-xl font-bold text-[var(--primary-color)] text-right mb-4">
            {post.title ?? post.categoryId?.name ?? "خدمة مخصصة"}
          </h2>

          {/* Description */}
          <div className="bg-[#F8FAF9] rounded-xl px-4 py-3 mb-4 text-right">
            <p className="text-sm text-gray-600 leading-relaxed">{post.description}</p>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#F8FAF9] rounded-xl px-3 py-3 text-right">
              <p className="text-xs text-gray-400 mb-1">الميزانية التقديرية</p>
              <p className="flex items-center gap-1 font-bold text-[var(--primary-color)] text-sm">
                {post.budget != null ? (
                  <>
                    <Image src={walletIcon} alt="" width={14} height={14} />
                    {post.budget} جنيه
                  </>
                ) : (
                  <span className="text-gray-400 font-normal text-xs">—</span>
                )}
              </p>
            </div>

            <div className="bg-[#F8FAF9] rounded-xl px-3 py-3 text-right">
              <p className="text-xs text-gray-400 mb-1">تاريخ التنفيذ المفضل</p>
              <p className="flex items-center gap-1 font-bold text-[var(--primary-color)] text-sm">
                <Calendar size={12} className="text-[var(--accent-color)]" />
                {formatDate(post.preferredDate)}،{" "}
                <span className="font-normal text-xs text-gray-400">
                  {formatTime(post.preferredTime)}
                </span>
              </p>
            </div>

            <div className="bg-[#F8FAF9] rounded-xl px-3 py-3 text-right">
              <p className="text-xs text-gray-400 mb-1">العنوان</p>
              <p className="flex items-center gap-1 font-bold text-[var(--primary-color)] text-sm">
                <MapPin size={12} className="text-[var(--accent-color)]" />
                {post.address?.district}
              </p>
            </div>
          </div>

          {/* Image */}
          {post.image && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <Image 
                src={imageIcon}
                alt=""
                width={14}
                height={14}
              />
                الصور المرفقة
              </p>
              <div className="flex gap-2">
                <div className="w-24 h-20 rounded-xl overflow-hidden bg-gray-100">
                  <img src={post.image} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <File className="text-[var(--primary-color)]" width={14} />
              تم نشر هذا الطلب لاستقبال العروض
            </p>
            <button
              onClick={() => !hasApplied && onSubmitClick()}
              disabled={hasApplied}
              className={`flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-full ${
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
  );
}