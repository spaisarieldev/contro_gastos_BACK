import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { GastosService } from './gastos.service';
import {
  CreateGastoDto,
  TogglePagadoDto,
  UpdateGastoDto,
} from './dto/gasto.dto';

@Controller('gastos')
export class GastosController {
  constructor(private readonly gastosService: GastosService) {}

  /**
   * GET /gastos?anio=2026&mes=3
   * Lista gastos del mes y auto-genera mensuales si faltan.
   */
  @Get()
  listarMes(
    @Query('anio') anio?: string,
    @Query('mes') mes?: string,
  ) {
    const ahora = new Date();
    const anioNum = anio ? Number(anio) : ahora.getFullYear();
    const mesNum = mes ? Number(mes) : ahora.getMonth() + 1;
    return this.gastosService.listarMes(anioNum, mesNum);
  }

  /**
   * POST /gastos/generar-mensuales?anio=&mes=
   * Disparo manual de la auto-generación.
   */
  @Post('generar-mensuales')
  generarMensuales(
    @Query('anio') anio?: string,
    @Query('mes') mes?: string,
  ) {
    const ahora = new Date();
    const anioNum = anio ? Number(anio) : ahora.getFullYear();
    const mesNum = mes ? Number(mes) : ahora.getMonth() + 1;
    return this.gastosService.generarMensualesSiFaltan(anioNum, mesNum);
  }

  @Post()
  crear(@Body() dto: CreateGastoDto) {
    return this.gastosService.crear(dto);
  }

  @Put(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGastoDto,
  ) {
    return this.gastosService.actualizar(id, dto);
  }

  @Patch(':id/pagado')
  togglePagado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TogglePagadoDto,
  ) {
    return this.gastosService.togglePagado(id, dto);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.gastosService.eliminar(id);
  }
}
