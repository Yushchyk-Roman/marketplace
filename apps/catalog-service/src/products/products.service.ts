import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@app/shared';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(sellerId: number, createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        sellerId,
      },
    });
  }

  async findAll(query: GetProductsQueryDto) {
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
      data.map(async (product) => {
        try {
          const sellerRes = await fetch(`http://localhost:3001/users/${product.sellerId}`);
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

    return {
      data: dataWithSellers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException();
    }

    try {
      const sellerRes = await fetch(`http://localhost:3001/users/${product.sellerId}`);
      const seller = sellerRes.ok ? await sellerRes.json() : null;
      
      return {
        ...product,
        seller: seller ? { id: seller.id, firstName: seller.firstName, lastName: seller.lastName } : null,
      };
    } catch {
      return { ...product, seller: null };
    }
  }

  async update(id: number, sellerId: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException();
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: number, sellerId: number) {
    const product = await this.findOne(id);

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException();
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }

  async updateStock(id: number, stockQuantity: number) {
    return this.prisma.product.update({
      where: { id },
      data: { stockQuantity },
    });
  }
}