"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import walletIcon from "@/assets/icons/wallet.svg";
import { api } from "@/api/axios";

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

interface Props {
  postId: string;
  postTitle: string;
  onClose: () => void;
  onSuccess: (postId: string) => void;
}

export default function SubmitProposalModal({
  postId,
  postTitle,
  onClose,
  onSuccess,
}: Props) {
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const maxMessageLength = 100;

  const handleSubmit = async () => {
    if (!price || !estimatedTime.trim()) {
      setError("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await api.post(`/posts/${postId}/proposals`, {
        price: Number(price),
        estimatedTime: estimatedTime.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      onSuccess(postId);
    } catch (err) {
      const message =
        (err as ApiError)?.response?.data?.message ?? "\u062d\u0635\u0644 \u062e\u0637\u0623\u060c \u062d\u0627\u0648\u0644 \u062a\u0627\u0646\u064a";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#F5F5F5] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 relative"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="text-right">
            <h2 className="text-xl font-bold text-[var(--primary-color)]">
              تقديم عرض
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              أدخل تفاصيل عرضك، وسيتمكن صاحب الطلب من مراجعته واختيار الفني
              المناسب.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors mt-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Post title chip */}
        <div className="flex items-center gap-2 bg-[var(--purple-light)] text-[var(--purple-dark)] rounded-2xl px-4 py-3 mb-5">
          <span className="w-2 h-2 rounded-full bg-[var(--purple-dark)] opacity-40" />
          <span className="font-bold text-base">{postTitle}</span>
        </div>

        {/* Message */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-[var(--primary-color)] text-right mb-2">
            التعليق <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= maxMessageLength)
                  setDescription(e.target.value);
              }}
              placeholder="اشرح للعميل تفاصيل تنفيذ المهمة.."
              rows={5}
              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-right outline-none resize-none placeholder:text-gray-300"
            />
            <span className="absolute bottom-3 left-3 text-xs text-gray-300">
              {description.length}/{maxMessageLength}
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-[var(--primary-color)] text-right mb-2">
            السعر المقترح <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-3 gap-3">
            <Image src={walletIcon} alt="wallet" width={20} height={20} />
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="500 جنيه"
              className="flex-1 text-right text-sm text-[var(--purple-dark)] font-bold outline-none bg-transparent placeholder:text-[var(--purple-dark)] placeholder:font-bold placeholder:opacity-60"
            />
          </div>
        </div>

        {/* Estimated time */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-[var(--primary-color)] text-right mb-2">
            مدة التنفيذ <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-3 gap-3">
            <input
              type="text"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder="مثال: ساعتين، يوم واحد..."
              className="flex-1 text-right text-sm outline-none bg-transparent placeholder:text-gray-300"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-xs text-center mb-4">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 rounded-2xl bg-[var(--purple-dark)] text-white font-bold text-base disabled:opacity-50 transition-all hover:opacity-90"
        >
          {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
        </button>
      </div>
    </div>
  );
}
