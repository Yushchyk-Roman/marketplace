import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '@app/shared/common/enums/order-status.enum';

export class UpdateOrderDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PAID })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}