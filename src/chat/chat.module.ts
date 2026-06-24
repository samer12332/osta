import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Message, MessageSchema } from './schemas/message.schema';
import { ProfanityFilterService } from './profanity-filter.service';
import { MainRequest, RequestSchema } from 'src/request/schemas/request.schema';
import { NotificationModule } from 'src/notification/notification.module';
import {
  Technician,
  TechnicianSchema,
} from 'src/technician/schemas/technician.schema';
import { Proposal, ProposalSchema } from 'src/post/schemas/proposal.schema';
import { Post, PostSchema } from 'src/post/schemas/post.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: MainRequest.name, schema: RequestSchema },
      { name: Technician.name, schema: TechnicianSchema },
      { name: Proposal.name, schema: ProposalSchema },
      { name: Post.name, schema: PostSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    NotificationModule,
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, ProfanityFilterService],
  exports: [ChatGateway], // export عشان request.service يقدر يستخدم closeRoom
})
export class ChatModule {}
