// ─── Shared types for posts/proposals flow ─────────────────────────────────────

export interface Post {
  _id: string;
  userId: string | { _id: string; fullName: string; phone?: string };
  categoryId: { _id: string; name: string };
  title?: string;
  description: string;
  address: {
    fullAddress: string;
    district: string;
    coordinates?: { lat: number; lng: number };
  };
  preferredDate: string;
  preferredTime: string;
  budget?: number | null; 
  isEmergency?: boolean;
  image?: string | null;
  status: "open" | "accepted" | "cancelled";
  acceptedProposal?: string | Proposal | null;
  requestId?: string | null;
  hasApplied?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Proposal {
  _id: string;
  postId: string;
  technicianId: {
    _id: string;
    fullName: string;
    averageRating?: number;
    totalReviews?: number;
    yearsOfExperience?: number;
    specialization?: { categoryId: string };
    verificationStatus?: string;
  };
  price: number;
  estimatedTime?: string;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}
