import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from '../prisma.module';
import { JwtStrategy } from '@app/shared';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PrismaModule,PassportModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, JwtStrategy],
})
export class PaymentsModule {}