import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
        include: {
          seller: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
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
      include: {
        seller: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException();
    }

    return product;
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
}