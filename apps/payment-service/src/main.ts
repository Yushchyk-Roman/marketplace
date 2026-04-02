import { NestFactory } from '@nestjs/core';
import { PaymentServiceModule } from './payment-service.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from '../../../libs/shared/src/common/filters/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(PaymentServiceModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Payment Service')
    .setDescription('API для обробки платежів')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.port ?? 3004);
}
bootstrap();
