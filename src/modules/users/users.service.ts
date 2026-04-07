import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash: hashedPassword,
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
      throw new NotFoundException();
    }

    const result = await this.prisma.review.aggregate({
      where: {
        product: {
          sellerId: sellerId,
        },
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    return {
      sellerId,
      averageRating: parseFloat((result._avg.rating || 0).toFixed(2)),
      totalReviews: result._count.rating,
    };
  }
  async updateBalance(id: number, amount: number) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: {
        balance: {
          increment: amount,
        },
      },
      select: {
        id: true,
        email: true,
        balance: true,
      }
    });
  }
}