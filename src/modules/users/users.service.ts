import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash: createUserDto.password,
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
}