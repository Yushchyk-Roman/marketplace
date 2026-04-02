import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { FilesModule } from './files/files.module';


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
  imports: [FilesModule],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {}
