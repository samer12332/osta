import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { SendHttpMessageDto } from './dto/send-http-message.dto';
import { chatUploadOptions, deleteUploadedFile } from './chat-upload';
import { ChatGateway } from './chat.gateway';

@ApiTags('Chat')
@ApiBearerAuth('JWT')
@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @ApiOperation({ summary: 'Get message history for a request' })
  @Get(':requestId/messages')
  getMessages(
    @Param('requestId', ParseMongoIdPipe) requestId: string,
    @Req() req,
  ) {
    return this.chatService.getRequestMessages(
      requestId,
      req.user.userId,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Get unread count and last message for a request' })
  @Get(':requestId/unread')
  async getUnreadCount(
    @Param('requestId', ParseMongoIdPipe) requestId: string,
    @Req() req,
  ) {
    const roomId = `room_${requestId}`;
    // ⚠️ بنمرر req.user.role الحقيقي دلوقتي — قبل كان متثبت على client دايمًا
    const { count, lastMessage } = await this.chatService.getUnreadCount(
      roomId,
      req.user.userId,
      req.user.role,
    );
    return {
      message: 'Unread count retrieved',
      data: { count, lastMessage },
    };
  }

  @ApiOperation({ summary: 'Get message history for a custom (post) chat' })
  @Get('custom/:postId/:technicianId/messages')
  getCustomMessages(
    @Param('postId', ParseMongoIdPipe) postId: string,
    @Param('technicianId', ParseMongoIdPipe) technicianId: string,
    @Req() req,
  ) {
    return this.chatService.getCustomRequestMessages(
      postId,
      technicianId,
      req.user.userId,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Send a request chat message with optional image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', nullable: true },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @Post(':requestId/messages')
  @UseInterceptors(FileInterceptor('image', chatUploadOptions))
  async sendRequestMessage(
    @Param('requestId', ParseMongoIdPipe) requestId: string,
    @Body() body: SendHttpMessageDto,
    @UploadedFile() image: Express.Multer.File | undefined,
    @Req() req,
  ) {
    try {
      const message = await this.chatService.createRequestMessage(
        requestId,
        req.user.userId,
        req.user.role,
        body.content,
        image?.path,
      );

      await this.chatGateway.notifyRequestMessage(
        requestId,
        req.user.userId,
        message,
      );

      this.chatGateway.broadcastRequestMessage(
        requestId,
        message,
        req.user.userId,
      );

      return {
        message: 'Message sent successfully',
        data: message,
      };
    } catch (error) {
      deleteUploadedFile(image?.path);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Send a custom chat message with optional image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', nullable: true },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @Post('custom/:postId/:technicianId/messages')
  @UseInterceptors(FileInterceptor('image', chatUploadOptions))
  async sendCustomMessage(
    @Param('postId', ParseMongoIdPipe) postId: string,
    @Param('technicianId', ParseMongoIdPipe) technicianId: string,
    @Body() body: SendHttpMessageDto,
    @UploadedFile() image: Express.Multer.File | undefined,
    @Req() req,
  ) {
    try {
      const message = await this.chatService.createCustomRequestMessage(
        postId,
        technicianId,
        req.user.userId,
        req.user.role,
        body.content,
        image?.path,
      );

      await this.chatGateway.notifyCustomMessage(
        postId,
        technicianId,
        req.user.userId,
        message,
      );

      this.chatGateway.broadcastCustomMessage(
        postId,
        technicianId,
        message,
        req.user.userId,
      );

      return {
        message: 'Message sent successfully',
        data: message,
      };
    } catch (error) {
      deleteUploadedFile(image?.path);
      throw error;
    }
  }
}
