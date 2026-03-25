import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: number, createReviewDto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: createReviewDto.productId },
    });

    if (!product) {
      throw new NotFoundException();
    }

    return this.prisma.review.create({
      data: {
        ...createReviewDto,
        authorId,
      },
    });
  }

  async findAll() {
    return this.prisma.review.findMany({
      include: {
        author: { select: { id: true, firstName: true } },
      },
    });
  }

  async findOne(id: number) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, firstName: true } },
      },
    });

    if (!review) {
      throw new NotFoundException();
    }

    return review;
  }

  async update(id: number, authorId: number, updateReviewDto: UpdateReviewDto) {
    const review = await this.findOne(id);

    if (review.authorId !== authorId) {
      throw new ForbiddenException();
    }

    return this.prisma.review.update({
      where: { id },
      data: updateReviewDto,
    });
  }

  async remove(id: number, authorId: number) {
    const review = await this.findOne(id);

    if (review.authorId !== authorId) {
      throw new ForbiddenException();
    }

    return this.prisma.review.delete({
      where: { id },
    });
  }
}