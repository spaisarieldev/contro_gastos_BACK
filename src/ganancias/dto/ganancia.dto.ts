import {
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class UpsertGananciaDto {
  @IsDateString()
  fecha: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monto: number;
}

export class QueryGananciasMesDto {
  @IsOptional()
  @IsNumber()
  anio?: number;

  @IsOptional()
  @IsNumber()
  mes?: number;
}
