import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@app/shared';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(buyerId: number, createOrderDto: CreateOrderDto) {
    return this.prisma.$transaction(async (prisma) => {
      let totalAmount = 0;
      const orderItemsData: {
        productId: number;
        quantity: number;
        unitPrice: number;
      }[] = [];

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

        const unitPrice =
          product.basePrice * (1 - product.discountPercentage / 100);
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
  async returnOrder(id: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.buyerId !== userId) {
      throw new ForbiddenException('You can only return your own orders');
    }

    const allowedStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.SHIPPED,
      OrderStatus.COMPLETED,
    ];

    if (!allowedStatuses.includes(order.status)) {
      throw new BadRequestException(
        'Order cannot be returned in its current status',
      );
    }

    return this.prisma.$transaction(async (prisma) => {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });

        const commissionRate = 0.05;
        const sellerShare =
          item.unitPrice * item.quantity * (1 - commissionRate);

        await prisma.user.update({
          where: { id: item.product.sellerId },
          data: { balance: { decrement: parseFloat(sellerShare.toFixed(2)) } },
        });
      }

      await prisma.user.update({
        where: { id: order.buyerId },
        data: { balance: { increment: order.totalAmount } },
      });

      return prisma.order.update({
        where: { id },
        data: { status: OrderStatus.RETURNED },
      });
    });
  }
  async cancelOrder(id: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException();
    }

    if (order.buyerId !== userId) {
      throw new ForbiddenException();
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException();
    }

    return this.prisma.$transaction(async (prisma) => {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }

      return prisma.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });
    });
  }
}
