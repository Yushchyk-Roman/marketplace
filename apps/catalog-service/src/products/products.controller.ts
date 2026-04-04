import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  UseInterceptors,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@app/shared';
import {
  CacheInterceptor,
  CacheKey,
  CacheTTL,
  Cache,
  CACHE_MANAGER,
} from '@nestjs/cache-manager';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: HttpStatus.CREATED })
  async create(
    @CurrentUser() user: any,
    @Body() createProductDto: CreateProductDto,
  ) {
    const product = await this.productsService.create(
      user.id,
      createProductDto,
    );
    await this.cacheManager.del('all_products');
    return product;
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @HttpCode(HttpStatus.OK)
  @CacheKey('all_products')
  @CacheTTL(60000)
  @ApiOperation({ summary: 'Get all products with pagination and filtering' })
  @ApiResponse({ status: HttpStatus.OK })
  findAll(@Query() query: GetProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get product by id' })
  @ApiResponse({ status: HttpStatus.OK })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update product by id' })
  @ApiResponse({ status: HttpStatus.OK })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const updatedProduct = await this.productsService.update(
      id,
      user.id,
      updateProductDto,
    );
    await this.cacheManager.del('all_products');
    return updatedProduct;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product by id' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.productsService.remove(id, user.id);
    await this.cacheManager.del('all_products');
    return result;
  }

  @Patch(':id/stock')
  async updateStock(
    @Param('id') id: string,
    @Body('stockQuantity') stockQuantity: number,
  ) {
    const result = await this.productsService.updateStock(+id, stockQuantity);
    await this.cacheManager.del('all_products');
    return result;
  }
}
