import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class UpdateBalanceDto {
  @ApiProperty({ example: 5000, description: 'Amount to add (positive) or deduct (negative) from balance' })
  @IsNotEmpty()
  @IsNumber()
  amount!: number;
}