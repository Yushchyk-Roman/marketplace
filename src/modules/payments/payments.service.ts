import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async processPayment(buyerId: number, createPaymentDto: CreatePaymentDto) {
    return this.prisma.$transaction(async (prisma) => {
      const order = await prisma.order.findUnique({
        where: { id: createPaymentDto.orderId },
        include: { items: { include: { product: true } } },
      });

      if (
        !order ||
        order.buyerId !== buyerId ||
        order.status !== OrderStatus.PENDING
      ) {
        throw new BadRequestException("Invalid order");
      }

      const buyer = await prisma.user.findUnique({ where: { id: buyerId } });

      if (!buyer || buyer.balance < order.totalAmount) {
        throw new BadRequestException("Insufficient funds");
      }

      await prisma.user.update({
        where: { id: buyerId },
        data: { balance: { decrement: order.totalAmount } },
      });

      const commissionRate = 0.01;
      const totalCommission = parseFloat(
        (order.totalAmount * commissionRate).toFixed(2),
      );

      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          commissionAmount: totalCommission,
          status: PaymentStatus.SUCCESS,
          processedAt: new Date(),
        },
      });

      for (const item of order.items) {
        const sellerShare =
          item.unitPrice * item.quantity * (1 - commissionRate);

        await prisma.user.update({
          where: { id: item.product.sellerId },
          data: { balance: { increment: parseFloat(sellerShare.toFixed(2)) } },
        });
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID },
      });

      return payment;
    });
  }

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        order: true,
      },
    });
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!payment) {
      throw new NotFoundException();
    }

    return payment;
  }

  
}
