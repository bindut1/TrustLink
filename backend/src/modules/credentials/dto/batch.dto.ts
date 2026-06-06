import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEthereumAddress,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { CreateCredentialDto } from './create-credential.dto';

const BYTES32 = /^0x[0-9a-fA-F]{64}$/;

export class PrepareBatchDto {
  @ApiProperty({ type: [CreateCredentialDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCredentialDto)
  items: CreateCredentialDto[];
}

export class BatchSignatureDto {
  @ApiProperty()
  @IsString()
  credentialId: string;

  @ApiProperty({ description: 'EIP-712 signature (eth_signTypedData_v4)' })
  @IsString()
  signature: string;
}

export class AnchorBatchDto {
  @ApiProperty({ description: 'Merkle root anchored on-chain (bytes32)' })
  @Matches(BYTES32, { message: 'merkleRoot must be a 0x bytes32 hex' })
  merkleRoot: string;

  @ApiProperty({ description: 'Tx hash of issueBatch broadcast by the issuer' })
  @Matches(BYTES32, { message: 'txHash must be a 0x bytes32 hex' })
  txHash: string;

  @ApiProperty({ type: [BatchSignatureDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BatchSignatureDto)
  signatures: BatchSignatureDto[];
}

export class AnchorBulkDto {
  @ApiProperty({ description: 'Merkle root anchored on-chain (bytes32)' })
  @Matches(BYTES32, { message: 'merkleRoot must be a 0x bytes32 hex' })
  merkleRoot: string;

  @ApiProperty({ description: 'Tx hash of issueBatch broadcast by the issuer' })
  @Matches(BYTES32, { message: 'txHash must be a 0x bytes32 hex' })
  txHash: string;

  @ApiProperty({ description: 'Single EIP-712 signature over the batch root' })
  @IsString()
  batchSignature: string;

  @ApiProperty({ description: 'issuedAt timestamp the issuer signed (ISO)' })
  @IsString()
  issuedAt: string;
}

export class RegisterIssuerWalletDto {
  @ApiProperty({ description: "Issuer institution's MetaMask signing address" })
  @IsEthereumAddress()
  signingAddress: string;
}
