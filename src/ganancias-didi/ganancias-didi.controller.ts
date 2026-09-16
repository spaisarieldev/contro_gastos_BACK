import {
  Controller,
  Delete,
  Get,
  Body,
  Put,
  Query,
  Param,
} from '@nestjs/common';
import { GananciasDidiService } from './ganancias-didi.service';
import { UpsertGananciaDidiDto } from './dto/ganancia-didi.dto';

@Controller('ganancias-didi')
export class GananciasDidiController {
  constructor(private readonly gananciasDidiService: GananciasDidiService) {}

  /**
   * GET /ganancias-didi?anio=2026&mes=3
   */
  @Get()
  listarMes(
    @Query('anio') anio?: string,
    @Query('mes') mes?: string,
  ) {
    const ahora = new Date();
    const anioNum = anio ? Number(anio) : ahora.getFullYear();
    const mesNum = mes ? Number(mes) : ahora.getMonth() + 1;
    return this.gananciasDidiService.listarMes(anioNum, mesNum);
  }

  /**
   * PUT /ganancias-didi
   */
  @Put()
  upsert(@Body() dto: UpsertGananciaDidiDto) {
    return this.gananciasDidiService.upsert(dto);
  }

  /**
   * DELETE /ganancias-didi/:fecha  (YYYY-MM-DD)
   */
  @Delete(':fecha')
  eliminar(@Param('fecha') fecha: string) {
    return this.gananciasDidiService.eliminarPorFecha(fecha);
  }
}
