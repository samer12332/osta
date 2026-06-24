"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
    MapPin,
    Calendar,
    Clock,
    Star,
    Image as ImageIcon,
} from "lucide-react";
import {
    getPostById,
    getProposals,
    acceptProposal,
} from "@/api/services/post.service.client";
import { Post, Proposal } from "@/types/post.types";
import Navbar from "@/components/layout/client/Navbar";
import electricalIcon from "@/assets/icons/electrician.svg";
import plumbingIcon from "@/assets/icons/plumbing.svg";
import carpentryIcon from "@/assets/icons/carpentry.svg";
import acIcon from "@/assets/icons/aircondition.svg";
import defaultIcon from "@/assets/icons/electrician.svg";
import walletIcon from "@/assets/icons/wallet.svg";
import messageIcon from "@/assets/icons/message.svg";
import Image from "next/image";

// ─── Category Icon ────────────────────────────────────────────────────────────

const categoryIcons: Record<string, any> = {
    كهرباء: electricalIcon,
    سباكة: plumbingIcon,
    نجارة: carpentryIcon,
    تكييف: acIcon,
    "إصلاح أجهزة": electricalIcon,
};

function getCategoryIcon(categoryName?: string) {
    if (!categoryName) return defaultIcon;
    return categoryIcons[categoryName] ?? defaultIcon;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatEstimatedTime(time: string): string {
    const lower = time.toLowerCase().trim();

    // hours
    const hoursMatch = lower.match(/(\d+)\s*hour/);
    // minutes
    const minutesMatch = lower.match(/(\d+)\s*min/);
    // range e.g. "30-40 minutes"
    const rangeMatch = lower.match(/(\d+)\s*-\s*(\d+)\s*min/);

    if (rangeMatch) return `${rangeMatch[1]}-${rangeMatch[2]} دقيقة`;
    if (hoursMatch && minutesMatch)
        return `${hoursMatch[1]} ساعة و${minutesMatch[1]} دقيقة`;
    if (hoursMatch)
        return `${hoursMatch[1]} ${parseInt(hoursMatch[1]) === 1 ? "ساعة" : "ساعات"}`;
    if (minutesMatch) return `${minutesMatch[1]} دقيقة`;

    return time; // fallback لو الفورمات غريب
}

function getImageSrc(imagePath?: string | null): string | null {
    if (!imagePath) return null;

    const normalizedPath = imagePath.replace(/\\/g, "/");

    if (/^https?:\/\//i.test(normalizedPath)) {
        return normalizedPath;
    }

    const relativePath = normalizedPath.startsWith("/")
        ? normalizedPath
        : `/${normalizedPath}`;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

    return apiBaseUrl ? `${apiBaseUrl}${relativePath}` : relativePath;
}

function getPostFromPayload(payload: any): Post | null {
    if (payload?.data) return payload.data;
    return payload ?? null;
}

// بعد
function getProposalsFromPayload(payload: any): Proposal[] {
    // الـ API: { data: { post: {...}, proposals: [...] } }
    if (Array.isArray(payload?.data?.proposals)) return payload.data.proposals;
    // fallback
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    return [];
}

// ─── Proposal Card ──────────────────────────────────────────────────────────────

function ProposalCard({
    proposal,
    onAccept,
    accepting,
}: {
    proposal: Proposal;
    onAccept: (id: string) => void;
    accepting: string | null;
}) {
    const tech = (proposal as any).technician ?? proposal.technicianId;

    return (
        <div className="border border-gray-200 rounded-2xl p-4 bg-white">
            {/* ── Header: avatar + info + price ── */}
            <div className="flex items-center justify-between mb-4">
                {/* الاسم + تقييم + موثق */}
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#D9F06A] flex items-center justify-center shrink-0">
                        <span className="font-bold text-[var(--primary-color)] text-sm">
                            {tech?.fullName?.charAt(0) ?? "ف"}
                        </span>
                    </div>

                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2 mb-0.5">
                            <p className="font-bold text-[var(--primary-color)] text-sm">
                                {tech?.fullName}
                            </p>
                            <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                موثق
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                            <span className="font-bold text-[var(--primary-color)]">
                                {tech?.averageRating ?? 0}
                            </span>
                            <Star
                                size={11}
                                className="text-yellow-400 fill-yellow-400"
                            />
                            <span>({tech?.totalReviews ?? 0})</span>
                        </div>
                    </div>
                </div>

                {/* السعر */}
                <span className="flex items-center gap-1 text-xs font-bold bg-[var(--purple-light)] text-[var(--purple-dark)] px-3 py-1.5 rounded-full">
                    <Image
                        src={walletIcon}
                        alt="wallet"
                        width={14}
                        height={14}
                    />
                    {proposal.price} ج.م
                </span>
            </div>

            <hr className="border-gray-100 mb-4" />

            {/* ── Message ── */}
            {proposal.message && (
                <p className="text-sm text-gray-500 text-right leading-relaxed mb-5">
                    {proposal.message}
                </p>
            )}

            {/* ── Footer: accept + chat + time ── */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {/* اختيار العرض */}
                    <button
                        onClick={() => onAccept(proposal._id)}
                        disabled={accepting === proposal._id}
                        className={`px-5 h-9 rounded-full text-sm font-bold transition-all ${
                            accepting === proposal._id
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-[var(--accent-color)] text-[var(--primary-color)] hover:opacity-90"
                        }`}
                    >
                        {accepting === proposal._id
                            ? "جاري..."
                            : "اختيار العرض"}
                    </button>

                    {/* محادثة */}
                    <button className="flex items-center gap-1 px-4 h-9 rounded-full border border-gray-200 text-xs text-gray-500 font-bold hover:border-[var(--primary-color)] transition-all">
                        <Image
                            src={messageIcon}
                            alt="message"
                            width={14}
                            height={14}
                        />
                        محادثة
                    </button>
                </div>

                {/* الوقت المتوقع */}
                {proposal.estimatedTime && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock
                            size={13}
                            className="text-[var(--accent-color)]"
                        />
                        <span>
                            {formatEstimatedTime(proposal.estimatedTime)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PostDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: postId } = use(params);
    const router = useRouter();

    const [post, setPost] = useState<Post | null>(null);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<"newest" | "cheapest" | "highest">(
        "newest",
    );

    useEffect(() => {
        Promise.all([getPostById(postId), getProposals(postId)])
            .then(([postRes, proposalsRes]) => {
                setPost(getPostFromPayload(postRes.data));
                setProposals(getProposalsFromPayload(proposalsRes.data));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [postId]);

    const handleAccept = async (proposalId: string) => {
        setAccepting(proposalId);
        try {
            await acceptProposal(postId, proposalId);
            router.push("/client/orders");
        } catch (err) {
            console.error(err);
        } finally {
            setAccepting(null);
        }
    };

    const sortedProposals = [...proposals].sort((a, b) => {
        if (sortBy === "cheapest") return a.price - b.price;
        if (sortBy === "highest")
            return (
                (b.technicianId?.averageRating ?? 0) -
                (a.technicianId?.averageRating ?? 0)
            );
        return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 rounded-full border-4 border-[var(--accent-color)] border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-400">الطلب غير موجود</p>
            </div>
        );
    }

    const postImageSrc = getImageSrc(post.image);

    return (
        <>
            <Navbar />
            <div className="max-w-4xl mx-auto p-6" dir="rtl">
                <h1 className="text-2xl font-bold text-[var(--primary-color)] mb-6">
                    ملخص الطلب
                </h1>

                {/* Post details card */}
                <div className="border border-gray-100 rounded-2xl p-5 bg-white mb-8 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-[var(--purple-light)] text-[var(--purple-dark)] px-3 py-1 rounded-full">
                                خدمة مخصصة
                            </span>
                            <span className="text-xs bg-gray-50 text-gray-400 px-3 py-1 rounded-full">
                                {post.categoryId?.name}
                            </span>
                        </div>
                        {/* Category icon */}
                        <div className="w-9 h-9 rounded-full bg-[var(--secondary-color)] flex items-center justify-center shrink-0">
                            <Image
                                src={getCategoryIcon(post.categoryId?.name)}
                                alt={post.categoryId?.name ?? "خدمة"}
                                width={18}
                                height={18}
                            />
                        </div>
                    </div>

                    <h2 className="font-bold text-[var(--primary-color)] text-lg mb-3 text-right">
                        {post.title ?? post.categoryId?.name}
                    </h2>

                    <div className="bg-[#F8FAF9] rounded-xl px-4 py-3 mb-4">
                        <p className="text-xs text-gray-400 mb-1">
                            وصف المشكلة
                        </p>
                        <p className="text-sm text-gray-600 text-right leading-relaxed">
                            {post.description}
                        </p>
                    </div>

                    {/* Meta grid - 4 خانات */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="bg-[#F8FAF9] rounded-xl px-3 py-2">
                            <p className="text-xs text-gray-400 mb-1">
                                الميزانية المقترحة
                            </p>
                            <p className="flex items-center gap-1 text-sm font-bold text-[var(--primary-color)]">
                                {(post as any).budget != null ? (
                                    <>
                                        {(post as any).budget}{" "}
                                        <span className="font-normal text-xs">
                                            جنيه
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-gray-400 font-normal">
                                        —
                                    </span>
                                )}
                            </p>
                        </div>

                        <div className="bg-[#F8FAF9] rounded-xl px-3 py-2">
                            <p className="text-xs text-gray-400 mb-1">
                                تاريخ التنفيذ المفضل
                            </p>
                            <p className="flex items-center gap-1 text-sm font-bold text-[var(--primary-color)]">
                                <Calendar
                                    size={12}
                                    className="text-[var(--accent-color)]"
                                />
                                {formatDate(post.preferredDate)}
                                <span className="mr-1">
                                    {formatTime(post.preferredTime)}
                                </span>
                            </p>
                        </div>

                        <div className="bg-[#F8FAF9] rounded-xl px-3 py-2 col-span-2 sm:col-span-2">
                            <p className="text-xs text-gray-400 mb-1">
                                العنوان
                            </p>
                            <p className="flex items-center gap-1 text-sm font-bold text-[var(--primary-color)]">
                                <MapPin
                                    size={12}
                                    className="text-[var(--accent-color)]"
                                />
                                {post.address?.fullAddress}
                            </p>
                        </div>
                    </div>

                    {postImageSrc && (
                        <div>
                            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                                <ImageIcon size={12} />
                                الصور المرفقة
                            </p>
                            <div className="flex gap-2">
                                <div className="w-24 h-20 rounded-lg overflow-hidden bg-gray-100">
                                    <Image
                                        src={postImageSrc}
                                        width={96}
                                        height={80}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Proposals */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-[var(--primary-color)] flex items-center gap-2">
                        <span className="w-1 h-5 bg-[var(--primary-color)] rounded-full inline-block" />
                        عروض الفنيين
                        <span className="text-sm font-normal text-gray-400">
                            ({proposals.length})
                        </span>
                    </h2>
                    <div className="flex bg-white rounded-full p-1 border border-gray-100 gap-1">
                        <button
                            onClick={() => setSortBy("newest")}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all
              ${sortBy === "newest" ? "bg-[var(--primary-color)] text-white" : "text-gray-500"}`}
                        >
                            الأحدث
                        </button>
                        <button
                            onClick={() => setSortBy("cheapest")}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all
              ${sortBy === "cheapest" ? "bg-[var(--primary-color)] text-white" : "text-gray-500"}`}
                        >
                            أقل سعراً
                        </button>
                        <button
                            onClick={() => setSortBy("highest")}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all
              ${sortBy === "highest" ? "bg-[var(--primary-color)] text-white" : "text-gray-500"}`}
                        >
                            الأعلى تقييماً
                        </button>
                    </div>
                </div>

                {sortedProposals.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-16">
                        لا توجد عروض حتى الآن
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sortedProposals.map((proposal) => (
                            <ProposalCard
                                key={proposal._id}
                                proposal={proposal}
                                onAccept={handleAccept}
                                accepting={accepting}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
