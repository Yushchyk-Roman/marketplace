import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        seller: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
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