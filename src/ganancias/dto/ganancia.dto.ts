import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpsertGananciaDto {
  @IsDateString()
  fecha: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monto: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  viajes?: number | null;
}

export class QueryGananciasMesDto {
  @IsOptional()
  @IsNumber()
  anio?: number;

  @IsOptional()
  @IsNumber()
  mes?: number;
}
