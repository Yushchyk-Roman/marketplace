import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@app/shared';

@Module({
  imports: [PrismaModule, PassportModule],
  controllers: [OrdersController],
  providers: [OrdersService, JwtStrategy],
})
export class OrdersModule {}
