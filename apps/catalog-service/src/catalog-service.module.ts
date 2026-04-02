import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ProductsModule],
  controllers: [],
  providers: [],
})
export class CatalogServiceModule {}
