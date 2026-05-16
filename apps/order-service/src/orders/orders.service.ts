import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from '@app/shared/common/enums/order-status.enum';
import { OrderStatus as PrismaOrderStatus } from '.prisma/client/order';

@Injectable()
export class OrdersService {
  private readonly CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3002';
  private readonly SELLER_URL = process.env.SELLER_SERVICE_URL || 'http://localhost:3001';

  constructor(private readonly prisma: PrismaService) {}

  async create(buyerId: number, createOrderDto: CreateOrderDto) {
    let totalAmount = 0;
    const orderItemsData: {
      productId: number;
      quantity: number;
      unitPrice: number;
    }[] = [];
    const productsToUpdate: { id: number; newQuantity: number }[] = [];

    for (const item of createOrderDto.items) {
      const response = await fetch(
        `${this.CATALOG_URL}/products/${item.productId}`,
      );

      if (!response.ok) {
        throw new NotFoundException();
      }

      const product = await response.json();

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

      productsToUpdate.push({
        id: product.id,
        newQuantity: product.stockQuantity - item.quantity,
      });
    }

    for (const update of productsToUpdate) {
      const updateRes = await fetch(
        `${this.CATALOG_URL}/products/${update.id}/stock`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stockQuantity: update.newQuantity }),
        },
      );

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        console.error(
          `Помилка оновлення складу для товару ${update.id}:`,
          errText,
        );
        throw new InternalServerErrorException(
          'Не вдалося оновити залишки на складі',
        );
      }
    }

    return this.prisma.order.create({
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
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException();
    }

    const buyerRes = await fetch(
      `${this.SELLER_URL}/users/${order.buyerId}`,
    );
    const buyer = buyerRes.ok ? await buyerRes.json() : null;

    const itemsWithProducts = await Promise.all(
      order.items.map(async (item) => {
        const prodRes = await fetch(
          `${this.CATALOG_URL}/products/${item.productId}`,
        );
        const product = prodRes.ok ? await prodRes.json() : null;
        return { ...item, product };
      }),
    );

    return {
      ...order,
      buyer: buyer
        ? { id: buyer.id, firstName: buyer.firstName, email: buyer.email }
        : null,
      items: itemsWithProducts,
    };
  }

  async updateStatus(id: number, updateOrderDto: UpdateOrderDto) {
    await this.findOne(id);

    return this.prisma.order.update({
      where: { id },
      data: { status: PrismaOrderStatus[updateOrderDto.status] },
    });
  }

  async returnOrder(id: number, userId: number) {
    const order = await this.findOne(id);

    if (order.buyerId !== userId) {
      throw new ForbiddenException();
    }

    const allowedStatuses: string[] = [
      OrderStatus.PAID,
      OrderStatus.SHIPPED,
      OrderStatus.COMPLETED,
    ];

    if (!allowedStatuses.includes(order.status)) {
      throw new BadRequestException();
    }

    for (const item of order.items) {
      if (item.product) {
        await fetch(`${this.CATALOG_URL}/products/${item.productId}/stock`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stockQuantity: item.product.stockQuantity + item.quantity,
          }),
        });

        const commissionRate = 0.01;
        const sellerShare =
          item.unitPrice * item.quantity * (1 - commissionRate);

        await fetch(
          `${this.SELLER_URL}/users/${item.product.sellerId}/balance`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: -parseFloat(sellerShare.toFixed(2)),
            }),
          },
        );
      }
    }

    await fetch(`${this.SELLER_URL}/users/${order.buyerId}/balance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: order.totalAmount }),
    });

    return this.prisma.order.update({
      where: { id },
      data: { status: PrismaOrderStatus[OrderStatus.RETURNED] },
    });
  }

  async cancelOrder(id: number, userId: number) {
    const order = await this.findOne(id);

    if (order.buyerId !== userId) {
      throw new ForbiddenException();
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException();
    }

    for (const item of order.items) {
      if (item.product) {
        await fetch(`${this.CATALOG_URL}/products/${item.productId}/stock`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stockQuantity: item.product.stockQuantity + item.quantity,
          }),
        });
      }
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: PrismaOrderStatus[OrderStatus.CANCELLED] },
    });
  }

  async updateInternalStatus(id: number, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id },
      data: { status: PrismaOrderStatus[status] },
    });
  }
}
