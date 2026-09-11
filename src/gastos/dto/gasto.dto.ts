import { TipoGasto } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateGastoDto {
  @IsString()
  @MinLength(1)
  descripcion: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monto: number;

  @IsEnum(TipoGasto)
  tipo: TipoGasto;

  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsBoolean()
  pagado?: boolean;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateGastoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  descripcion?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monto?: number;

  @IsOptional()
  @IsEnum(TipoGasto)
  tipo?: TipoGasto;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsBoolean()
  pagado?: boolean;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class TogglePagadoDto {
  @IsBoolean()
  pagado: boolean;
}
