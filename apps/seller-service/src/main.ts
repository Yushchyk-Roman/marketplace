import { NestFactory } from '@nestjs/core';
import { SellerServiceModule } from './seller-service.module';

async function bootstrap() {
  const app = await NestFactory.create(SellerServiceModule);
  await app.listen(process.env.port ?? 3001);
}
bootstrap();
