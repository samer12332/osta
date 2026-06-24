"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/api/axios";
import Navbar from "@/components/layout/technician/Navbar"
import ServiceDetailsSection from "@/components/sections/technician/services/ServiceDetailsSection";
import ServiceProposalsSection from "@/components/sections/technician/services/ServiceProposalsSection";
import SubmitProposalModal from "@/components/sections/technician/current-orders/SubmitProposalModal";
import BookingSuccess from "@/components/sections/technician/current-orders/BookingSuccess";


interface Proposal {
  _id: string;
  estimatedTime?: string;
  description?: string;
  price?: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  isMyProposal?: boolean;
  technician: {
    _id: string;
    fullName: string;
    averageRating?: number;
    totalReviews?: number;
  } | null;
}

interface PostDetails {
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

export default function TechnicianPostDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: postId } = use(params);
  const [post, setPost] = useState<PostDetails | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalsCount, setProposalsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasApplied, setHasApplied] = useState(false);

  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    api
      .get(`/posts/${postId}/proposals`)
      .then((res) => {
        const data = res.data.data;
        setPost(data.post);
        const nextProposals = data.proposals ?? [];
        setProposals(nextProposals);
        setProposalsCount(data.proposalsCount ?? 0);
        setHasApplied(nextProposals.some((proposal: Proposal) => proposal.isMyProposal));
      })
      .catch(() => setError("تعذر تحميل تفاصيل الطلب"))
      .finally(() => setLoading(false));
  }, [postId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-4 border-[var(--accent-color)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">{error || "الطلب غير موجود"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
        <Navbar />
      <ServiceDetailsSection 
        post={post} 
        proposalsCount={proposalsCount}
        hasApplied={hasApplied}
        onSubmitClick={() => setShowProposalModal(true)}
      />
      <ServiceProposalsSection
        proposals={proposals}
        postId={postId}
        postStatus={post.status}
      />

      {showProposalModal && (
        <SubmitProposalModal
          postId={postId}
          postTitle={post.title ?? post.categoryId?.name ?? "خدمة مخصصة"}
          onClose={() => setShowProposalModal(false)}
          onSuccess={() => {
            setShowProposalModal(false);
            setHasApplied(true);
            setShowSuccess(true);
          }}
        />
      )}

      {/* Success */}
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