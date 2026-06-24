import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  MainRequest,
  RequestDocument,
} from 'src/request/schemas/request.schema';
import {
  Technician,
  TechnicianDocument,
} from 'src/technician/schemas/technician.schema';
import { RequestStatus } from 'src/request/enums/request-status.enum';
import {
  ServiceDocument,
  ServiceEntity,
} from 'src/services/schemas/service.schema';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private reviewModel: Model<ReviewDocument>,

    @InjectModel(MainRequest.name)
    private requestModel: Model<RequestDocument>,

    @InjectModel(Technician.name)
    private technicianModel: Model<TechnicianDocument>,

    @InjectModel(ServiceEntity.name)
    private serviceModel: Model<ServiceDocument>,
  ) {}

  // POST /reviews
  async create(userId: string, dto: CreateReviewDto) {
    // 1. الـ request موجودة وبتاعة الـ user ده
    const request = await this.requestModel.findOne({
      _id: dto.requestId,
      userId: new Types.ObjectId(userId),
    });
    if (!request) throw new NotFoundException('Request not found');

    // 2. لازم تكون completed
    if (request.status !== RequestStatus.COMPLETED) {
      throw new BadRequestException('You can only review a completed request');
    }

    // 3. لازم يكون فيه technician assigned
    if (!request.assignedTechnician) {
      throw new BadRequestException('No technician assigned to this request');
    }

    // 4. ما عملش review قبل كده
    const existing = await this.reviewModel.findOne({
      requestId: new Types.ObjectId(dto.requestId),
    });
    if (existing)
      throw new ConflictException('You already reviewed this request');

    // 5. جيب الـ Technician document عن طريق userId
    // assignedTechnician بيشاور على User._id
    const technician = await this.technicianModel.findOne({
      userId: request.assignedTechnician,
    });
    if (!technician)
      throw new NotFoundException('Technician profile not found');

    // 6. إنشاء الـ review
    const review = await this.reviewModel.create({
      userId: new Types.ObjectId(userId),
      technicianId: technician._id, // Technician document id
      serviceId: request.serviceId ?? null,
      requestId: new Types.ObjectId(dto.requestId),
      rating: dto.rating,
      comment: dto.comment,
    });

    // 7. تحديث الـ averageRating على الـ Technician
    await this.updateTechnicianRating(technician._id.toString());
    if (request.serviceId) {
      await this.updateServiceRating(request.serviceId.toString());
    }

    return {
      message: 'Review submitted successfully',
      data: review,
    };
  }

  // GET /reviews/technician/:id
  async findByTechnician(technicianId: string) {
    const reviews = await this.reviewModel
    .find({ technicianId: new Types.ObjectId(technicianId) })
    .populate('userId', 'fullName')
    .populate('serviceId', 'name')
    .sort({ createdAt: -1 })
    .lean();

    return {
      message: 'Technician reviews retrieved successfully',
      data: reviews,
    };
  }

  // GET /reviews/service/:id
  async findByService(serviceId: string) {
    const reviews = await this.reviewModel
    .find({ serviceId: new Types.ObjectId(serviceId) })
    .populate('userId', 'fullName')
    .populate('technicianId', 'averageRating')
    .sort({ createdAt: -1 })
    .lean();

    return {
      message: 'Service reviews retrieved successfully',
      data: reviews,
    };
  }

  // DELETE /reviews/:id
  async remove(reviewId: string, userId: string) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');

    if (review.userId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewModel.findByIdAndDelete(reviewId);

    // إعادة حساب الـ rating بعد الحذف
    await this.updateTechnicianRating(review.technicianId.toString());
    if (review.serviceId) {
      await this.updateServiceRating(review.serviceId.toString());
    }

    return { message: 'Review deleted successfully' };
  }

  // PATCH /reviews/:id
  async update(reviewId: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');

    if (review.userId.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    const updated = await this.reviewModel
    .findByIdAndUpdate(reviewId, dto, { new: true })
    .lean();

    // إعادة حساب الـ rating بعد التعديل
    await this.updateTechnicianRating(review.technicianId.toString());
    if (review.serviceId) {
      await this.updateServiceRating(review.serviceId.toString());
    }

    return { message: 'Review updated successfully', data: updated };
  }

  private async updateTechnicianRating(technicianId: string) {
    const result = await this.reviewModel.aggregate([
      { $match: { technicianId: new Types.ObjectId(technicianId) } },
      {
        $group: {
          _id: null,
          avg: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      await this.technicianModel.findByIdAndUpdate(technicianId, {
        averageRating: Math.round(result[0].avg * 10) / 10,
        totalReviews: result[0].count,
      });
    }
  }

  private async updateServiceRating(serviceId: string) {
    const result = await this.reviewModel.aggregate([
      { $match: { serviceId: new Types.ObjectId(serviceId) } },
      {
        $group: {
          _id: null,
          avg: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      await this.serviceModel.findByIdAndUpdate(serviceId, {
        averageRating: Math.round(result[0].avg * 10) / 10,
        totalRatings: result[0].count,
      });
    }
  }
}
