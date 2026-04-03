import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@app/shared';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async processPayment(
    buyerId: number,
    createPaymentDto: CreatePaymentDto,
    authHeader: string,
  ) {
    const orderRes = await fetch(
      `http://localhost:3003/orders/${createPaymentDto.orderId}`,
      {
        headers: { Authorization: authHeader },
      },
    );

    if (!orderRes.ok) {
      console.error(
        '[PaymentService] Error fetching order:',
        await orderRes.text(),
      );
      throw new ForbiddenException('Invalid order');
    }
    const order = await orderRes.json();

    if (order.buyerId !== buyerId || order.status !== OrderStatus.PENDING) {
      throw new ForbiddenException('Invalid order status or buyer mismatch');
    }

    const buyerRes = await fetch(`http://localhost:3001/users/${buyerId}`, {
      headers: { Authorization: authHeader },
    });

    if (!buyerRes.ok) {
      console.error(
        '[PaymentService] Error fetching buyer:',
        await buyerRes.text(),
      );
      throw new BadRequestException('Could not verify buyer funds');
    }
    const buyer = await buyerRes.json();

    if (buyer.balance < order.totalAmount) {
      throw new BadRequestException('Insufficient funds');
    }

    const buyerUpdateRes = await fetch(
      `http://localhost:3001/users/${buyerId}/balance`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ amount: -order.totalAmount }),
      },
    );

    if (!buyerUpdateRes.ok)
      throw new InternalServerErrorException(
        'Failed to decrement buyer balance',
      );

    const commissionRate = 0.01;
    const totalCommission = parseFloat(
      (order.totalAmount * commissionRate).toFixed(2),
    );

    for (const item of order.items) {
      if (item.product && item.product.sellerId) {
        const sellerShare =
          item.unitPrice * item.quantity * (1 - commissionRate);

        const sellerUpdateRes = await fetch(
          `http://localhost:3001/users/${item.product.sellerId}/balance`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: authHeader,
            },
            body: JSON.stringify({
              amount: parseFloat(sellerShare.toFixed(2)),
            }),
          },
        );

        if (!sellerUpdateRes.ok)
          throw new InternalServerErrorException(
            'Failed to increment seller balance',
          );
      }
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount,
        commissionAmount: totalCommission,
        status: PaymentStatus.SUCCESS,
        processedAt: new Date(),
      },
    });

    const orderUpdateRes = await fetch(`http://localhost:3003/orders/${order.id}/internal-status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: OrderStatus.PAID }),
    });

    if (!orderUpdateRes.ok) {
      const errText = await orderUpdateRes.text();
      console.error('[PaymentService] Error updating order status:', errText);
      throw new InternalServerErrorException('Failed to update order status');
    }

    return payment;
  }

  async findAll() {
    const payments = await this.prisma.payment.findMany();

    const paymentsWithOrders = await Promise.all(
      payments.map(async (payment) => {
        try {
          const orderRes = await fetch(
            `http://localhost:3003/orders/${payment.orderId}`,
          );
          const order = orderRes.ok ? await orderRes.json() : null;
          return { ...payment, order };
        } catch {
          return { ...payment, order: null };
        }
      }),
    );

    return paymentsWithOrders;
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException();
    }

    try {
      const orderRes = await fetch(
        `http://localhost:3003/orders/${payment.orderId}`,
      );
      const order = orderRes.ok ? await orderRes.json() : null;
      return { ...payment, order };
    } catch {
      return { ...payment, order: null };
    }
  }
}
