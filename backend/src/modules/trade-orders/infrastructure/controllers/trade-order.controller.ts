import { CreateTradeOrderUseCase } from '@modules/trade-orders/application/use-cases/create-trade-order';
import { GetTradeOrderByIdUseCase } from '@modules/trade-orders/application/use-cases/get-trade-order-by-id';
import { ListTradeOrdersUseCase } from '@modules/trade-orders/application/use-cases/list-trade-orders';
import { SoftDeleteTradeOrderUseCase } from '@modules/trade-orders/application/use-cases/soft-delete-trade-order';
import { UpdateTradeOrderUseCase } from '@modules/trade-orders/application/use-cases/update-trade-order';
import {
  CreateTradeOrderDto,
  PaginationQueryDto,
  PaginatedTradeOrdersResponseDto,
  SoftDeleteTradeOrderResponseDto,
  TradeOrderResponseItemDto,
  UpdateTradeOrderDto,
} from '@modules/trade-orders/infrastructure/dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('trade_orders')
@Controller('trade_orders')
export class TradeOrderController {
  constructor(
    private readonly createTradeOrderUseCase: CreateTradeOrderUseCase,
    private readonly listTradeOrdersUseCase: ListTradeOrdersUseCase,
    private readonly getTradeOrderByIdUseCase: GetTradeOrderByIdUseCase,
    private readonly updateTradeOrderUseCase: UpdateTradeOrderUseCase,
    private readonly softDeleteTradeOrderUseCase: SoftDeleteTradeOrderUseCase,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a trade order' })
  @ApiCreatedResponse({ type: TradeOrderResponseItemDto, description: 'Order created (response wrapped by global envelope)' })
  @ApiBadRequestResponse({ description: 'Validation or business rule failure' })
  create(@Body() dto: CreateTradeOrderDto) {
    return this.createTradeOrderUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List trade orders (paginated, non-deleted)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiOkResponse({ type: PaginatedTradeOrdersResponseDto })
  findAll(@Query() query: PaginationQueryDto) {
    return this.listTradeOrdersUseCase.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one trade order by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TradeOrderResponseItemDto })
  @ApiNotFoundResponse({ description: 'Order not found or soft-deleted' })
  getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.getTradeOrderByIdUseCase.execute(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a trade order (partial body)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TradeOrderResponseItemDto })
  @ApiNotFoundResponse({ description: 'Order not found or soft-deleted' })
  @ApiBadRequestResponse({ description: 'Validation or business rule failure' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateTradeOrderDto,
  ) {
    return this.updateTradeOrderUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a trade order' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({
    type: SoftDeleteTradeOrderResponseDto,
    description: 'Soft delete sets deletedAt; order excluded from list/get',
  })
  @ApiNotFoundResponse({ description: 'Order not found or already deleted' })
  @ApiBadRequestResponse({ description: 'Order already soft-deleted' })
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.softDeleteTradeOrderUseCase.execute(id);
  }
}
