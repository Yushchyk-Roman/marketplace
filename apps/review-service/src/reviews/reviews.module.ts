import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { PrismaModule, JwtStrategy } from '@app/shared';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PrismaModule, PassportModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, JwtStrategy],
})
export class ReviewsModule {}