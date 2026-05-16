import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBalanceDto {
  @ApiProperty({ description: 'Сума для зміни балансу (може бути відʼємною для списання)', example: 150.5 })
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}