export enum NotificationType {
  // --- CLIENT notifications ---
  REQUEST_ACCEPTED = 'request_accepted',         // technician accepted the request
  REQUEST_CANCELLED = 'request_cancelled',        // request cancelled (by tech or admin)
  REQUEST_ON_THE_WAY = 'request_on_the_way',     // technician is on the way
  REQUEST_STARTED = 'request_started',            // technician started the work
  REQUEST_COMPLETED = 'request_completed',        // work is completed
  DEPOSIT_REFUNDED = 'deposit_refunded',          // deposit refunded to client after cancellation
  NEW_PROPOSAL = 'new_proposal',                  // technician submitted a proposal on client's post
  POST_CANCELLED = 'post_cancelled',              // client cancelled the post → notify technician

  // --- TECHNICIAN notifications ---
  DEPOSIT_PAID = 'deposit_paid',                  // client paid the deposit → technician can proceed
  REMAINING_PAID = 'remaining_paid',              // client paid the remaining amount → job fully settled
  PROPOSAL_ACCEPTED = 'proposal_accepted',        // client accepted technician's proposal
  PROPOSAL_REJECTED = 'proposal_rejected',        // client rejected technician's proposal
  NEW_MESSAGE = 'new_message',                    // new direct message in request/custom chat

  // --- SYSTEM / SCHEDULED notifications (any role) ---
  VERIFY_ACCOUNT_REMINDER = 'verify_account_reminder', // daily reminder to verify account
}
