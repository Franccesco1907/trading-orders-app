import { SUPPORTED_PAIRS } from '@modules/trade-orders/domain/constants';
import { TradeOrderType, TradeSide, TradeOrderStatus } from '@modules/trade-orders/domain/entities';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateTradeOrderDto {
  @ApiPropertyOptional({ enum: TradeSide, example: TradeSide.SELL, description: 'Order side' })
  @IsOptional()
  @IsEnum(TradeSide)
  side?: TradeSide;

  @ApiPropertyOptional({ enum: TradeOrderType, example: TradeOrderType.MARKET, description: 'Order type' })
  @IsOptional()
  @IsEnum(TradeOrderType)
  type?: TradeOrderType;

  @ApiPropertyOptional({ enum: TradeOrderStatus, example: TradeOrderStatus.CANCELLED, description: 'Order status' })
  @IsOptional()
  @IsEnum(TradeOrderStatus)
  status?: TradeOrderStatus;

  @ApiPropertyOptional({ example: 3.75, description: 'Order amount (up to 2 decimal places)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false })
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({ example: 98500.55, description: 'Price per unit (up to 5 decimal places)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 5, allowInfinity: false, allowNaN: false })
  @IsPositive()
  price?: number;

  @ApiPropertyOptional({ example: 'ETHUSD', enum: SUPPORTED_PAIRS, description: 'Trading pair' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @MaxLength(32)
  @IsIn(SUPPORTED_PAIRS, {
    message: `pair must be one of: ${SUPPORTED_PAIRS.join(', ')}`,
  })
  pair?: string;
}
