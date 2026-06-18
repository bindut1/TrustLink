import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class RevokeCredentialDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;

  // Tx hash of the issuer-signed `revokeLeaf` broadcast (Option B). Required when
  // the chain is configured; the backend confirms the leaf is revoked on-chain
  // before flipping any DB state.
  @ApiPropertyOptional({
    description: 'Tx hash of the issuer-signed revokeLeaf',
  })
  @IsOptional()
  @IsString()
  @Matches(/^0x[0-9a-fA-F]{64}$/, {
    message: 'txHash must be a 32-byte hex hash',
  })
  txHash?: string;
}
