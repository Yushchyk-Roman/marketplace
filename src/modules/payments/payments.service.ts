import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
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
      });

      if (!order) {
        throw new NotFoundException();
      }

      if (order.buyerId !== buyerId) {
        throw new ForbiddenException();
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException();
      }

      const commissionRate = 0.05;
      const commissionAmount = parseFloat((order.totalAmount * commissionRate).toFixed(2));

      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          commissionAmount,
          status: PaymentStatus.SUCCESS,
          processedAt: new Date(),
        },
      });

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