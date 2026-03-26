import { TradeOrderType, TradeSide } from '@modules/trade-orders/domain/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { SUPPORTED_PAIRS } from '@modules/trade-orders/domain/constants';

export class CreateTradeOrderDto {
  @ApiProperty({ enum: TradeSide, example: TradeSide.BUY })
  @IsEnum(TradeSide)
  side: TradeSide;

  @ApiProperty({ enum: TradeOrderType, example: TradeOrderType.LIMIT })
  @IsEnum(TradeOrderType)
  type: TradeOrderType;

  @ApiProperty({ example: 1.25, description: 'Up to 2 decimal places' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false })
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 42000.12345, description: 'Up to 5 decimal places' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 5, allowInfinity: false, allowNaN: false })
  @IsPositive()
  price: number;

  @ApiProperty({ example: 'BTCUSD', enum: SUPPORTED_PAIRS })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @IsIn(SUPPORTED_PAIRS, {
    message: `pair must be one of: ${SUPPORTED_PAIRS.join(', ')}`,
  })
  pair: string;
}
