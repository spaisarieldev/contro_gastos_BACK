import {
  Controller,
  Delete,
  Get,
  Body,
  Put,
  Query,
  Param,
} from '@nestjs/common';
import { GananciasService } from './ganancias.service';
import { UpsertGananciaDto } from './dto/ganancia.dto';

@Controller('ganancias')
export class GananciasController {
  constructor(private readonly gananciasService: GananciasService) {}

  /**
   * GET /ganancias?anio=2026&mes=3
   * Lista planilla del mes (todos los días + montos).
   */
  @Get()
  listarMes(
    @Query('anio') anio?: string,
    @Query('mes') mes?: string,
  ) {
    const ahora = new Date();
    const anioNum = anio ? Number(anio) : ahora.getFullYear();
    const mesNum = mes ? Number(mes) : ahora.getMonth() + 1;
    return this.gananciasService.listarMes(anioNum, mesNum);
  }

  /**
   * PUT /ganancias
   * Crea o actualiza el monto de un día.
   */
  @Put()
  upsert(@Body() dto: UpsertGananciaDto) {
    return this.gananciasService.upsert(dto);
  }

  /**
   * DELETE /ganancias/:fecha  (YYYY-MM-DD)
   */
  @Delete(':fecha')
  eliminar(@Param('fecha') fecha: string) {
    return this.gananciasService.eliminarPorFecha(fecha);
  }
}
