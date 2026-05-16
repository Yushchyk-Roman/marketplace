import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma.service';
import { Role } from '../../../../libs/shared/src/common/enums/role.enum';

@Injectable()
export class UsersService {
  private readonly CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3002';
  private readonly REVIEW_URL = process.env.REVIEW_SERVICE_URL || 'http://localhost:3005';

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, passwordHash: string) {
    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash: passwordHash,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        avatarUrl: createUserDto.avatarUrl,
        role: createUserDto.role,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) {
      throw new NotFoundException();
    }
    
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id);
    
    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
        avatarUrl: updateUserDto.avatarUrl,
        role: updateUserDto.role,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getSellerRating(sellerId: number) {
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
    });

    if (!seller || seller.role !== Role.SELLER) {
      throw new NotFoundException('Продавця не знайдено');
    }

    try {
      const productsRes = await fetch(`${this.CATALOG_URL}/products?limit=1000`);
      const productsData = await productsRes.json();
      
      const products = productsData.data || [];
      
      const sellerProductIds = products
        .filter((p: any) => p.sellerId === sellerId)
        .map((p: any) => p.id);

      const reviewsRes = await fetch(`${this.REVIEW_URL}/reviews`);
      const reviews = reviewsRes.ok ? await reviewsRes.json() : [];

      const sellerReviews = reviews.filter((r: any) => 
        sellerProductIds.includes(r.productId)
      );

      const totalReviews = sellerReviews.length;
      const averageRating = totalReviews > 0 
        ? sellerReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews 
        : 0;

      return {
        sellerId,
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalReviews,
      };
    } catch (error) {
      console.error('Помилка агрегації рейтингу:', error);
      return { sellerId, averageRating: 0, totalReviews: 0 };
    }
  }

  async updateBalance(id: number, amount: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        balance: {
          increment: amount,
        },
      },
    });
  }
}