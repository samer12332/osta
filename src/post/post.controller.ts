import {
  Body, Controller, Get, Param,
  Patch, Post, Query, Req, UseGuards,
  UploadedFile, UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { RoleDecorator as Roles } from '../common/decorators/role.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { SuggestTitleDto } from './dto/suggest-title.dto';
const postStorage = diskStorage({
  destination: (req: any, file, cb) => {
    const userId = req.user.userId;
    const path = `./uploads/posts/${userId}`;
    if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
    cb(null, path);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

export const postFileInterceptor = FileInterceptor('image', {
  storage: postStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new BadRequestException('Only image files are allowed'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

@ApiTags('Posts')
@ApiBearerAuth('JWT')
@Controller('posts')
@UseGuards(AuthGuard('jwt'))
export class PostController {
  constructor(private readonly postService: PostService) {}

  // POST /posts ← CLIENT
  @ApiOperation({ summary: '[Client] Create a new post' })
  @Post()
@UseGuards(RolesGuard)
@Roles(UserRole.CLIENT)
@UseInterceptors(postFileInterceptor)
async createPost(
  @Body() dto: CreatePostDto,
  @Req() req,
  @UploadedFile() image?: Express.Multer.File,
) {
  return this.postService.createPost(req.user.userId, dto, image?.path);
}

  // GET /posts ← TECHNICIAN
  @ApiOperation({ summary: '[Technician] Get all open posts' })
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TECHNICIAN)
  findAllOpen(
    @Req() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.postService.findAllOpen(req.user.userId, +page, +limit);
  }

  // GET /posts/my ← CLIENT
  @ApiOperation({ summary: '[Client] Get my posts' })
  @Get('my')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT)
  findMyPosts(
    @Req() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.postService.findMyPosts(req.user.userId, +page, +limit);
  }

  @ApiOperation({ summary: '[Technician] Get accepted custom orders assigned to me' })
  @Get('technician/assigned')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TECHNICIAN)
  findAssignedCustomRequests(@Req() req) {
    return this.postService.findAssignedCustomRequests(req.user.userId);
  }

  @ApiOperation({ summary: '[Technician] Get pending custom proposals and accepted custom orders' })
  @Get('technician/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TECHNICIAN)
  findPendingCustomRequestsForTechnician(@Req() req) {
    return this.postService.findPendingCustomRequestsForTechnician(
      req.user.userId,
    );
  }
  // POST /posts/suggest-title ← CLIENT
  @ApiOperation({ summary: '[Client] Suggest a title from description using AI' })
  @Post('suggest-title')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT)
  async suggestTitle(@Body() dto: SuggestTitleDto) {
    const title = await this.postService.suggestTitle(dto.description);
    return { title };
  }

  // GET /posts/:id
  @ApiOperation({ summary: 'Get post by ID' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.postService.findById(id);
  }

  // POST /posts/:id/proposals ← TECHNICIAN
  @ApiOperation({ summary: '[Technician] Submit a proposal' })
  @Post(':id/proposals')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TECHNICIAN)
  submitProposal(
    @Param('id') id: string,
    @Body() dto: CreateProposalDto,
    @Req() req,
  ) {
    return this.postService.submitProposal(id, req.user.userId, dto);
  }

  // GET /posts/:id/proposals ← CLIENT OR TECHNICIAN
  @ApiOperation({ summary: ' Get proposals for a post' })
  @Get(':id/proposals')
@UseGuards(RolesGuard)
@Roles(UserRole.CLIENT, UserRole.TECHNICIAN)
getProposals(@Param('id') id: string, @Req() req) {
  return this.postService.getProposals(id, req.user.userId, req.user.role);
}

  // PATCH /posts/:id/proposals/:proposalId/accept ← CLIENT
  @ApiOperation({ summary: '[Client] Accept a proposal' })
  @Patch(':id/proposals/:proposalId/accept')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT)
  acceptProposal(
    @Param('id') id: string,
    @Param('proposalId') proposalId: string,
    @Req() req,
  ) {
    return this.postService.acceptProposal(id, proposalId, req.user.userId);
  }

  // PATCH /posts/:id/cancel ← CLIENT
  @ApiOperation({ summary: '[Client] Cancel a post' })
  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT)
  cancelPost(@Param('id') id: string, @Req() req) {
    return this.postService.cancelPost(id, req.user.userId);
  }



}
