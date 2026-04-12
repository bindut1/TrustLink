import { PartialType } from '@nestjs/swagger';
import { CreateCredentialTypeDto } from './create-credential-type.dto';

export class UpdateCredentialTypeDto extends PartialType(
  CreateCredentialTypeDto,
) {}
