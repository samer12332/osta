

export enum NotificationType {
  // Client-facing
  REQUEST_ACCEPTED = 'request_accepted',
  REQUEST_CANCELLED = 'request_cancelled',
  REQUEST_ON_THE_WAY = 'request_on_the_way',
  REQUEST_STARTED = 'request_started',
  REQUEST_COMPLETED = 'request_completed',
  DEPOSIT_REFUNDED = 'deposit_refunded',
  NEW_PROPOSAL = 'new_proposal',
  POST_CANCELLED = 'post_cancelled',

  // Technician-facing
  DEPOSIT_PAID = 'deposit_paid',
  REMAINING_PAID = 'remaining_paid',
  PROPOSAL_ACCEPTED = 'proposal_accepted',
  PROPOSAL_REJECTED = 'proposal_rejected',
  NEW_MESSAGE = 'new_message',

  // System
  VERIFY_ACCOUNT_REMINDER = 'verify_account_reminder',
}

export interface AppNotification {
  _id: string;
  title: string;
  body: string;
  type: NotificationType;
  requestId?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  data: AppNotification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
