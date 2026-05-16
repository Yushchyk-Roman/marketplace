import {
  Module,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { FilesModule } from './files/files.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    FilesModule,
  ],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {
  configure(consumer: MiddlewareConsumer) {
    const sellerUrl = process.env.SELLER_SERVICE_URL || 'http://localhost:3001';
    const catalogUrl = process.env.CATALOG_SERVICE_URL || 'http://localhost:3002';
    const orderUrl = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
    const paymentUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';
    const reviewUrl = process.env.REVIEW_SERVICE_URL || 'http://localhost:3005';

    consumer
      .apply(
        createProxyMiddleware({
          target: sellerUrl,
          changeOrigin: true,
          on: {
            proxyReq: fixRequestBody,
          }
        }),
      )
      .forRoutes(
        { path: '/users', method: RequestMethod.ALL },
        { path: '/users/*', method: RequestMethod.ALL },
        { path: '/auth', method: RequestMethod.ALL },
        { path: '/auth/*', method: RequestMethod.ALL },
      );

    consumer
      .apply(
        createProxyMiddleware({
          target: catalogUrl,
          changeOrigin: true,
          on: {
            proxyReq: fixRequestBody,
          },
        }),
      )
      .forRoutes(
        { path: '/products', method: RequestMethod.ALL },
        { path: '/products/*', method: RequestMethod.ALL },
      );

    consumer
      .apply(
        createProxyMiddleware({
          target: orderUrl,
          changeOrigin: true,
          on: {
            proxyReq: fixRequestBody,
          }
        }),
      )
      .forRoutes(
        { path: '/orders', method: RequestMethod.ALL },
        { path: '/orders/*', method: RequestMethod.ALL },
      );

    consumer
      .apply(
        createProxyMiddleware({
          target: paymentUrl,
          changeOrigin: true,
          on: {
            proxyReq: fixRequestBody,
          }
        }),
      )
      .forRoutes(
        { path: '/payments', method: RequestMethod.ALL },
        { path: '/payments/*', method: RequestMethod.ALL },
      );

    consumer
      .apply(
        createProxyMiddleware({
          target: reviewUrl,
          changeOrigin: true,
          on: {
            proxyReq: fixRequestBody,
          }
        }),
      )
      .forRoutes(
        { path: '/reviews', method: RequestMethod.ALL },
        { path: '/reviews/*', method: RequestMethod.ALL },
      );
  }
}