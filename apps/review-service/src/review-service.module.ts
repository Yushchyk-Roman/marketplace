import { Module } from '@nestjs/common';
import { ReviewsModule } from './reviews/reviews.module';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ReviewsModule],
  controllers: [],
  providers: [],
})
export class ReviewServiceModule {}
