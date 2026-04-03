import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from '../prisma.module';
import { JwtStrategy } from '@app/shared';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PrismaModule, PassportModule],
  controllers: [ProductsController],
  providers: [ProductsService, JwtStrategy],
  exports: [ProductsService],
})
export class ProductsModule {}