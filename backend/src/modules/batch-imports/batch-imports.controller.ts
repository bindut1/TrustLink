import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { User } from '../../database/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireActions } from '../auth/decorators/require-actions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { BatchImportsService } from './batch-imports.service';
import { CreateBatchImportDto } from './dto/create-batch-import.dto';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

@ApiTags('Batch Imports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller()
export class BatchImportsController {
  constructor(private readonly service: BatchImportsService) {}

  @Post('credentials/batch')
  @RequireActions('credential.batch_import')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  @ApiOperation({ summary: 'Upload an Excel file to batch-issue credentials' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['credentialTypeId', 'file'],
      properties: {
        credentialTypeId: { type: 'string', format: 'uuid' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Batch import queued for processing' })
  async upload(
    @CurrentUser() user: User,
    @Body() dto: CreateBatchImportDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.createFromUpload(user.id, dto, file);
  }

  @Get('batch-imports')
  @RequireActions('credential.batch_import')
  @ApiOperation({
    summary: "List the current issuer's batch imports (newest first)",
  })
  @ApiOkResponse({ description: 'Batch imports for the issuer' })
  async listMine(@CurrentUser() user: User) {
    return this.service.findMine(user.id);
  }

  @Get('batch-imports/:id')
  @RequireActions('credential.batch_import')
  @ApiOperation({ summary: 'Get batch import progress and error report' })
  @ApiOkResponse({ description: 'Batch import detail' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }
}
