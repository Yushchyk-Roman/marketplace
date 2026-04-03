import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { JwtStrategy } from '@app/shared';
import { PrismaModule } from '../prisma.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PrismaModule, PassportModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, JwtStrategy],
})
export class ReviewsModule {}