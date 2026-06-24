import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Message,
  MessageDocument,
  RoomType,
  SenderRole,
} from './schemas/message.schema';
import { ProfanityFilterService } from './profanity-filter.service';
import { toPublicUploadPath } from './chat-upload';
import {
  MainRequest,
  RequestDocument,
} from 'src/request/schemas/request.schema';
import {
  Technician,
  TechnicianDocument,
} from 'src/technician/schemas/technician.schema';
import { Proposal, ProposalDocument } from 'src/post/schemas/proposal.schema';
import { Post, PostDocument, PostStatus } from 'src/post/schemas/post.schema';
import { RequestStatus } from 'src/request/enums/request-status.enum';
import { UserRole } from 'src/users/schemas/user.schema';

// ── Moderation ────────────────────────────────────────────────────────────────

// patterns واضحة → blocked فوراً، الرسالة مش بتتحفظش
const BLOCK_PATTERNS: RegExp[] = [
  // أرقام تليفون (مصري وعالمي)
  /(\+?2?01[0125]\d{8})/, // 010/011/012/015
  /(\+?\d[\d\s\-().]{7,}\d)/, // أي رقم دولي
  // واتساب / تليجرام
  /wa\.me\/\d+/i,
  /t\.me\/\S+/i,
  /telegram\.me\/\S+/i,
  // روابط تواصل اجتماعي
  /(facebook|fb|instagram|tiktok|twitter|x\.com|snapchat)\.com\/\S+/i,
  /fb\.com\/\S+/i,
  // URLs عامة (ما عدا صور مثلاً)
  /https?:\/\/\S+/i,
  // إيميلات
  /[\w.+-]+@[\w-]+\.[a-z]{2,}/i,
];

// patterns مشبوهة → بتتحفظ + AI بيفحصها
const SUSPICIOUS_PATTERNS: RegExp[] = [
  // كلمات تلميح للتواصل خارج المنصة
  /واتس|وتس|whatsapp|تيليجرام|telegram/i,
  /تليفون|موبايل|رقمي|رقمك|phone|mobile|contact/i,
  /خارج|outside|بره المنصة|off.?platform/i,
  // أرقام مكتوبة بالحروف أو مبعثرة
  /(صفر|zero).*(واحد|اتنين|تلاتة|أربعة|خمسة)/i,
];

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,

    @InjectModel(MainRequest.name)
    private requestModel: Model<RequestDocument>,

    @InjectModel(Technician.name)
    private technicianModel: Model<TechnicianDocument>,

    @InjectModel(Proposal.name)
    private proposalModel: Model<ProposalDocument>,

    @InjectModel(Post.name)
    private postModel: Model<PostDocument>,
    private readonly profanityFilter: ProfanityFilterService,
  ) {}

  // ── 1. Fixed Service Request Chat ─────────────────────────────────────────

  async validateRequestAccess(
    requestId: string,
    userId: string,
    role: UserRole,
  ): Promise<MainRequest> {
    const request = await this.requestModel.findById(requestId).lean();
    if (!request) throw new NotFoundException('Request not found');

    const allowedStatuses = [
      RequestStatus.ACCEPTED,
      RequestStatus.IN_PROGRESS,
      RequestStatus.ON_THE_WAY,
      RequestStatus.STARTED,
    ];
    if (!allowedStatuses.includes(request.status)) {
      throw new ForbiddenException(
        'Chat is only available for accepted or in-progress requests',
      );
    }

    const isClient =
      role === UserRole.CLIENT && request.userId.toString() === userId;
    const isTechnician =
      role === UserRole.TECHNICIAN &&
      request.assignedTechnician?.toString() === userId;

    if (!isClient && !isTechnician) {
      throw new ForbiddenException('You are not part of this request');
    }

    return request;
  }

  // ── 2. Custom Request Chat (Post + Proposal) ───────────────────────────────

  async validateCustomRequestAccess(
    postId: string,
    technicianId: string, // دايماً مطلوب — بيحدد الـ room
    userId: string,
    role: UserRole,
  ): Promise<void> {
    const post = await this.postModel.findById(postId).lean();
    if (!post) throw new NotFoundException('Post not found');

    // الـ post لازم تكون open أو accepted (مش cancelled)
    if (post.status === PostStatus.CANCELLED) {
      throw new ForbiddenException('This post is no longer available');
    }

    // تحقق إن الـ proposal موجودة
    const proposal = await this.proposalModel
    .findOne({
      postId: new Types.ObjectId(postId),
      technicianId: new Types.ObjectId(technicianId),
    })
    .lean();

    if (!proposal) {
      throw new ForbiddenException(
        'No proposal found for this technician on this post',
      );
    }

    // الـ client: لازم يكون صاحب الـ post
    if (role === UserRole.CLIENT) {
      if (post.userId.toString() !== userId) {
        throw new ForbiddenException('You are not the owner of this post');
      }
      return;
    }

    // الـ technician: لازم يكون صاحب الـ proposal
    if (role === UserRole.TECHNICIAN) {
      if (technicianId !== userId) {
        throw new ForbiddenException('You can only access your own chat room');
      }
      return;
    }

    throw new ForbiddenException('Unauthorized');
  }

  // ── 3. Community Chat ──────────────────────────────────────────────────────

  async validateCommunityAccess(
    categoryId: string,
    userId: string,
    role: UserRole,
  ): Promise<void> {
    if (role !== UserRole.TECHNICIAN) {
      throw new ForbiddenException('Community chat is for technicians only');
    }

    const technician = await this.technicianModel.findOne({
      userId: new Types.ObjectId(userId),
      'specialization.categoryId': new Types.ObjectId(categoryId),
    });

    if (!technician) {
      throw new ForbiddenException('You are not a member of this community');
    }
  }

  // ── 4. Support Chat ────────────────────────────────────────────────────────

  validateSupportAccess(
    targetUserId: string,
    userId: string,
    role: UserRole,
  ): void {
    if (role === UserRole.ADMIN) return;
    if (targetUserId !== userId) {
      throw new ForbiddenException('You can only access your own support chat');
    }
  }

  // ── Content Moderation ─────────────────────────────────────────────────────

  /**
   * بيشيك على الرسالة قبل ما تتحفظ.
   * لو فيها حاجة مبلوكة → بيرمي exception والرسالة مش بتتحفظش.
   * لو مشبوهة → بيرجع true عشان الـ caller يعمل AI check async.
   */
  blockContent(content: string): { blocked: boolean; suspicious: boolean } {
    this.profanityFilter.assertClean(content);

    for (const pattern of BLOCK_PATTERNS) {
      if (pattern.test(content)) {
        throw new BadRequestException(
          'Messages cannot contain phone numbers, links, or external contact information.',
        );
      }
    }

    const suspicious = SUSPICIOUS_PATTERNS.some((p) => p.test(content));
    return { blocked: false, suspicious };
  }

  /**
   * AI moderation — بيشتغل async بعد ما الرسالة اتحفظت.
   * لو الـ AI قرر إنها مشبوهة → بيعمل flag على الرسالة في الـ DB.
   */
  async moderateWithAI(
    messageId: Types.ObjectId,
    content: string,
  ): Promise<void> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 50,
          system: `You are a content moderation assistant for a home services marketplace.
Your only job is to detect if a message contains attempts to share contact information or move communication outside the platform.
This includes: phone numbers written in words, hints about WhatsApp/Telegram/social media, email addresses, or any attempt to bypass the platform.
Reply with ONLY a JSON object: {"flagged": true/false, "reason": "short reason or null"}`,
          messages: [{ role: 'user', content }],
        }),
      });

      const data = (await response.json()) as {
        content: { type: string; text: string }[];
      };
      const text = data.content.find((b) => b.type === 'text')?.text ?? '';
      const result = JSON.parse(text) as {
        flagged: boolean;
        reason: string | null;
      };

      if (result.flagged) {
        await this.messageModel.findByIdAndUpdate(messageId, {
          isFlagged: true,
          flagReason: result.reason,
        });
      }
    } catch {
      // AI moderation فشلت — مش بنوقف الـ flow، بس بنلوج
      console.error(
        `[Moderation] AI check failed for message ${messageId.toString()}`,
      );
    }
  }

  // ── Shared: Save Message ───────────────────────────────────────────────────

  async saveMessage(
    roomId: string,
    roomType: RoomType,
    senderId: string,
    senderRole: SenderRole,
    content?: string,
    imageUrl?: string | null,
  ): Promise<MessageDocument> {
    const normalizedContent = content?.trim() ?? '';
    const publicImageUrl = toPublicUploadPath(imageUrl);

    if (!normalizedContent && !publicImageUrl) {
      throw new BadRequestException('Message cannot be empty.');
    }

    const { suspicious } = normalizedContent
      ? this.blockContent(normalizedContent)
      : { suspicious: false };

    const message = await this.messageModel.create({
      roomId,
      roomType,
      senderId: new Types.ObjectId(senderId),
      senderRole,
      content: normalizedContent,
      imageUrl: publicImageUrl,
    });

    if (suspicious && normalizedContent) {
      void this.moderateWithAI(
        message._id as Types.ObjectId,
        normalizedContent,
      );
    }

    return message;
  }

  getSenderRole(role: UserRole): SenderRole {
    if (role === UserRole.CLIENT) return SenderRole.CLIENT;
    if (role === UserRole.ADMIN) return SenderRole.ADMIN;
    return SenderRole.TECHNICIAN;
  }

  async createRequestMessage(
    requestId: string,
    userId: string,
    role: UserRole,
    content?: string,
    imageUrl?: string | null,
  ) {
    await this.validateRequestAccess(requestId, userId, role);

    return this.saveMessage(
      `room_${requestId}`,
      RoomType.REQUEST,
      userId,
      this.getSenderRole(role),
      content,
      imageUrl,
    );
  }

  async createCustomRequestMessage(
    postId: string,
    technicianId: string,
    userId: string,
    role: UserRole,
    content?: string,
    imageUrl?: string | null,
  ) {
    await this.validateCustomRequestAccess(postId, technicianId, userId, role);

    return this.saveMessage(
      `custom_${postId}_${technicianId}`,
      RoomType.CUSTOM_REQUEST,
      userId,
      this.getSenderRole(role),
      content,
      imageUrl,
    );
  }

  async getRequestNotificationContext(requestId: string, senderId: string) {
    const request = await this.requestModel
      .findById(requestId)
      .select('userId assignedTechnician')
      .lean();

    if (!request || !request.assignedTechnician) {
      throw new NotFoundException('Request not found');
    }

    const clientId = request.userId.toString();
    const technicianId = request.assignedTechnician.toString();

    return {
      recipientId: senderId === clientId ? technicianId : clientId,
      requestId,
      chatVariant: 'fixed' as const,
    };
  }

  async getCustomRequestNotificationContext(
    postId: string,
    technicianId: string,
    senderId: string,
  ) {
    const post = await this.postModel.findById(postId).select('userId title').lean();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const clientId = post.userId.toString();

    return {
      recipientId: senderId === clientId ? technicianId : clientId,
      postId,
      technicianId,
      title: post.title,
      chatVariant: 'custom' as const,
    };
  }

  // ── Shared: Get Messages ───────────────────────────────────────────────────

  async getMessages(roomId: string, limit = 50) {
    return this.messageModel
    .find({ roomId })
    .sort({ createdAt: 1 }) // oldest first
    .limit(limit)
    .populate('senderId', 'fullName')
    .lean();
  }

  // ── Fixed Request Chat: History (REST) ────────────────────────────────────

  async getRequestMessages(requestId: string, userId: string, role: UserRole) {
    await this.validateRequestAccess(requestId, userId, role);

    const roomId = `room_${requestId}`;
    const messages = await this.messageModel
    .find({ roomId })
    .sort({ createdAt: 1 })
    .populate('senderId', 'fullName')
    .lean();

    await this.messageModel.updateMany(
      { roomId, senderId: { $ne: new Types.ObjectId(userId) }, isRead: false },
      { isRead: true },
    );

    return { message: 'Messages retrieved successfully', data: messages };
  }

  // ── Custom Request Chat: History (REST) ───────────────────────────────────

  async getCustomRequestMessages(
    postId: string,
    technicianId: string,
    userId: string,
    role: UserRole,
  ) {
    await this.validateCustomRequestAccess(postId, technicianId, userId, role);

    const roomId = `custom_${postId}_${technicianId}`;
    const messages = await this.messageModel
    .find({ roomId })
    .sort({ createdAt: 1 })
    .populate('senderId', 'fullName')
    .lean();

    await this.messageModel.updateMany(
      { roomId, senderId: { $ne: new Types.ObjectId(userId) }, isRead: false },
      { isRead: true },
    );

    return { message: 'Messages retrieved successfully', data: messages };
  }

  // ── Unread Count ───────────────────────────────────────────────────────────

  async getUnreadCount(roomId: string, userId: string, role: UserRole) {
    // ⚠️ كانت متثبتة على UserRole.CLIENT دايمًا — كانت بترفض الفنيين.
    // دلوقتي بتاخد الـ role الحقيقي بتاع المستخدم اللي عامل الـ request.
    if (roomId.startsWith('custom_')) {
      const [, postId, technicianId] = roomId.split('_');
      await this.validateCustomRequestAccess(
        postId,
        technicianId,
        userId,
        role,
      );
    } else {
      const requestId = roomId.split('_')[1];
      await this.validateRequestAccess(requestId, userId, role);
    }

    const count = await this.messageModel.countDocuments({
      roomId,
      senderId: { $ne: new Types.ObjectId(userId) },
      isRead: false,
    });

    // آخر رسالة في الـ room — أي طرف بعتها (مش بس الرسايل غير المقروءة)
    const lastMessage = await this.messageModel
    .findOne({ roomId })
    .sort({ createdAt: -1 })
    .select('content imageUrl createdAt senderId senderRole')
    .lean();

    return {
      count,
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            imageUrl: lastMessage.imageUrl ?? null,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.senderId.toString(),
            senderRole: lastMessage.senderRole,
          }
        : null,
    };
  }

  async markAsRead(roomId: string, userId: string) {
    await this.messageModel.updateMany(
      { roomId, senderId: { $ne: new Types.ObjectId(userId) }, isRead: false },
      { isRead: true },
    );
  }
}
