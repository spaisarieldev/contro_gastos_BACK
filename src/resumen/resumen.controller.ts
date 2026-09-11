import { Controller, Get, Query } from '@nestjs/common';
import { ResumenService } from './resumen.service';

@Controller('resumen')
export class ResumenController {
  constructor(private readonly resumenService: ResumenService) {}

  /**
   * GET /resumen/mes?anio=2026&mes=3
   */
  @Get('mes')
  resumenMes(
    @Query('anio') anio?: string,
    @Query('mes') mes?: string,
  ) {
    const ahora = new Date();
    const anioNum = anio ? Number(anio) : ahora.getFullYear();
    const mesNum = mes ? Number(mes) : ahora.getMonth() + 1;
    return this.resumenService.resumenMes(anioNum, mesNum);
  }

  /**
   * GET /resumen/evolucion-mensual?meses=12
   */
  @Get('evolucion-mensual')
  evolucionMensual(@Query('meses') meses?: string) {
    const cantidad = meses ? Number(meses) : 12;
    return this.resumenService.evolucionMensual(cantidad);
  }
}
