import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@app/shared/common/enums/role.enum';
import { OrderStatus } from '@app/shared/common/enums/order-status.enum';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Roles, CurrentUser, RolesGuard, JwtAuthGuard } from '@app/shared';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: HttpStatus.CREATED })
  create(@CurrentUser() user: any, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(user.id, createOrderDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({ status: HttpStatus.OK })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get order by id' })
  @ApiResponse({ status: HttpStatus.OK })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: HttpStatus.OK })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/return')
  async returnOrder(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.ordersService.returnOrder(id, req.user.id);
  }
  
  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancelOrder(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.ordersService.cancelOrder(id, req.user.id);
  }

  @Patch(':id/internal-status')
  async updateInternalStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateInternalStatus(+id, status);
  }
}
