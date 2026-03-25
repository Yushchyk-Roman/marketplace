import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(buyerId: number, createOrderDto: CreateOrderDto) {
    return this.prisma.$transaction(async (prisma) => {
      let totalAmount = 0;
      const orderItemsData: { productId: number; quantity: number; unitPrice: number }[] = [];

      for (const item of createOrderDto.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException();
        }

        if (product.stockQuantity < item.quantity) {
          throw new BadRequestException();
        }

        const unitPrice = product.basePrice * (1 - product.discountPercentage / 100);
        totalAmount += unitPrice * item.quantity;

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: parseFloat(unitPrice.toFixed(2)),
        });

        await prisma.product.update({
          where: { id: product.id },
          data: { stockQuantity: product.stockQuantity - item.quantity },
        });
      }

      return prisma.order.create({
        data: {
          buyerId,
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        items: true,
      },
    });
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
        buyer: {
          select: { id: true, firstName: true, email: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException();
    }

    return order;
  }

  async updateStatus(id: number, updateOrderDto: UpdateOrderDto) {
    await this.findOne(id);

    return this.prisma.order.update({
      where: { id },
      data: { status: updateOrderDto.status },
    });
  }
}