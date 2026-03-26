import { ApiProperty } from '@nestjs/swagger';

export class TradeOrderResponseItemDto {
  @ApiProperty({ example: 'a1b2c3d4-5678-4def-abcd-1234567890ab', description: 'UUID of the trade order' })
  id: string;

  @ApiProperty({ example: 'buy', enum: ['buy', 'sell'], description: 'Order side' })
  side: string;

  @ApiProperty({ example: 'limit', enum: ['limit', 'market', 'stop'], description: 'Order type' })
  type: string;

  @ApiProperty({ example: '2.50', description: 'Order amount (up to 2 decimal places)' })
  amount: string;

  @ApiProperty({ example: '100150.40000', description: 'Price per unit (up to 5 decimal places)' })
  price: string;

  @ApiProperty({ example: 'open', enum: ['open', 'cancelled', 'executed'], description: 'Current order status' })
  status: string;

  @ApiProperty({ example: 'BTCUSD', description: 'Trading pair' })
  pair: string;

  @ApiProperty({ example: '2026-03-25T14:30:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: null, nullable: true, description: 'Last update timestamp, null if never updated' })
  updatedAt: Date | null;
}

export class SoftDeleteTradeOrderResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-5678-4def-abcd-1234567890ab', description: 'UUID of the deleted trade order' })
  id: string;

  @ApiProperty({ example: true, description: 'Whether the order was successfully soft-deleted' })
  softDeleted: boolean;
}

export class PaginatedTradeOrdersResponseDto {
  @ApiProperty({ type: [TradeOrderResponseItemDto], description: 'List of trade orders for the current page' })
  items: TradeOrderResponseItemDto[];

  @ApiProperty({ example: 42, description: 'Total number of non-deleted trade orders' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 20, description: 'Maximum items per page' })
  limit: number;

  @ApiProperty({ example: 3, description: 'Total number of pages' })
  totalPages: number;
}
