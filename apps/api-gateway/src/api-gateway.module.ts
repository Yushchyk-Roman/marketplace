import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { FilesModule } from './files/files.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

// @Module({
//   imports: [
//     ConfigModule.forRoot({ isGlobal: true }),
//     ThrottlerModule.forRoot([{
//       ttl: 60000,
//       limit: 100,
//     }]),
//     PrismaModule,
//     AuthModule,
//     UsersModule,
//     ProductsModule,
//     OrdersModule,
//     PaymentsModule,
//     ReviewsModule,
//     FilesModule,
//   ],
//   providers: [
//     {
//       provide: APP_GUARD,
//       useClass: ThrottlerGuard,
//     },
//   ],
// })
// export class AppModule {}

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
    // 3001 - seller service
    // users, auth
    consumer
      .apply(
        createProxyMiddleware({
          target: 'http://localhost:3001',
          changeOrigin: true,
          on: {
            proxyReq: fixRequestBody,
          }
        }),
      )
      .forRoutes(
        { path: '/users', method: RequestMethod.ALL },
        { path: '/users/*path', method: RequestMethod.ALL },
        { path: '/auth', method: RequestMethod.ALL },
        { path: '/auth/*path', method: RequestMethod.ALL },
      );

    // 3002 - catalog service
    // products
    consumer
      .apply(
        createProxyMiddleware({
          target: 'http://localhost:3002',
          changeOrigin: true,
          on: {
            proxyReq: fixRequestBody,
          },
        }),
      )
      .forRoutes(
        { path: '/products', method: RequestMethod.ALL },
        { path: '/products/*path', method: RequestMethod.ALL },
      );

    // 3003 - order service
    // orders
    consumer
      .apply(
        createProxyMiddleware({
          target: 'http://localhost:3003',
          changeOrigin: true,
          on: {
            proxyReq: fixRequestBody,
          }
        }),
      )
      .forRoutes(
        { path: '/orders', method: RequestMethod.ALL },
        { path: '/orders/*path', method: RequestMethod.ALL },
      );

    // 3004 - payments service
    // payments
    consumer
      .apply(
        createProxyMiddleware({
          target: 'http://localhost:3004',
          changeOrigin: true,
          on: {
            proxyReq: fixRequestBody,
          }
        }),
      )
      .forRoutes(
        { path: '/payments', method: RequestMethod.ALL },
        { path: '/payments/*path', method: RequestMethod.ALL },
      );

    // 3005 - review service
    // reviews
    consumer
      .apply(
        createProxyMiddleware({
          target: 'http://localhost:3005',
          changeOrigin: true,
          on: {
            proxyReq: fixRequestBody,
          }
        }),
      )
      .forRoutes(
        { path: '/reviews', method: RequestMethod.ALL },
        { path: '/reviews/*path', method: RequestMethod.ALL },
      );
  }
}
