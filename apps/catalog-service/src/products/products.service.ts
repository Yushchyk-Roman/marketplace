import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { Prisma, Product } from '.prisma/client/catalog';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

type SellerInfo = {
  id: number;
  firstName: string;
  lastName: string;
} | null;

type ProductWithSeller = Product & {
  seller: SellerInfo;
};

type PaginatedProducts = {
  data: ProductWithSeller[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

@Injectable()
export class ProductsService {
  private readonly SELLER_URL = process.env.SELLER_SERVICE_URL || 'http://localhost:3001';

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(sellerId: number, createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        sellerId,
      },
    });
  }

  async findAll(query: GetProductsQueryDto) {
    const cacheKey = `products_${JSON.stringify(query)}`;
    const cachedData = await this.cacheManager.get<PaginatedProducts>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const { page = 1, limit = 10, search, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.product.count({ where }),
    ]);

    const dataWithSellers = await Promise.all(
      data.map(async (product): Promise<ProductWithSeller> => {
        try {
          const sellerRes = await fetch(`${this.SELLER_URL}/users/${product.sellerId}`);
          const seller = sellerRes.ok ? await sellerRes.json() : null;
          return {
            ...product,
            seller: seller ? { id: seller.id, firstName: seller.firstName, lastName: seller.lastName } : null,
          };
        } catch {
          return { ...product, seller: null };
        }
      }),
    );

    const result: PaginatedProducts = {
      data: dataWithSellers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cacheManager.set(cacheKey, result, 60000);

    return result;
  }

  async findOne(id: number) {
    const cacheKey = `product_${id}`;
    const cachedData = await this.cacheManager.get<ProductWithSeller>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException();
    }

    try {
      const sellerRes = await fetch(`${this.SELLER_URL}/users/${product.sellerId}`);
      const seller = sellerRes.ok ? await sellerRes.json() : null;
      
      const result: ProductWithSeller = {
        ...product,
        seller: seller ? { id: seller.id, firstName: seller.firstName, lastName: seller.lastName } : null,
      };

      await this.cacheManager.set(cacheKey, result, 60000);
      return result;
    } catch {
      const result: ProductWithSeller = { ...product, seller: null };
      await this.cacheManager.set(cacheKey, result, 60000);
      return result;
    }
  }

  async update(id: number, sellerId: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException();
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });

    await this.cacheManager.del(`product_${id}`);

    return updatedProduct;
  }

  async remove(id: number, sellerId: number) {
    const product = await this.findOne(id);

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException();
    }

    const deletedProduct = await this.prisma.product.delete({
      where: { id },
    });

    await this.cacheManager.del(`product_${id}`);

    return deletedProduct;
  }

  async updateStock(id: number, stockQuantity: number) {
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { stockQuantity },
    });

    await this.cacheManager.del(`product_${id}`);

    return updatedProduct;
  }
}