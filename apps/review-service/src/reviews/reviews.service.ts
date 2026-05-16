import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  private readonly CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3002';
  private readonly SELLER_URL = process.env.SELLER_SERVICE_URL || 'http://localhost:3001';

  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: number, createReviewDto: CreateReviewDto) {
    const productRes = await fetch(`${this.CATALOG_URL}/products/${createReviewDto.productId}`);
    
    if (!productRes.ok) {
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
    const reviews = await this.prisma.review.findMany();

    const reviewsWithAuthors = await Promise.all(
      reviews.map(async (review) => {
        try {
          const authorRes = await fetch(`${this.SELLER_URL}/users/${review.authorId}`);
          const author = authorRes.ok ? await authorRes.json() : null;
          return {
            ...review,
            author: author ? { id: author.id, firstName: author.firstName } : null,
          };
        } catch {
          return { ...review, author: null };
        }
      }),
    );

    return reviewsWithAuthors;
  }

  async findOne(id: number) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException();
    }

    try {
      const authorRes = await fetch(`${this.SELLER_URL}/users/${review.authorId}`);
      const author = authorRes.ok ? await authorRes.json() : null;

      return {
        ...review,
        author: author ? { id: author.id, firstName: author.firstName } : null,
      };
    } catch {
      return { ...review, author: null };
    }
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