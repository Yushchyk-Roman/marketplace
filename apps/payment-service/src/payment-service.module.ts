import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PaymentsModule],
  controllers: [],
  providers: [],
})
export class PaymentServiceModule {}
