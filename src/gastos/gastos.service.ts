import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TipoGasto } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateGastoDto,
  TogglePagadoDto,
  UpdateGastoDto,
} from './dto/gasto.dto';

@Injectable()
export class GastosService {
  constructor(private readonly prisma: PrismaService) {}

  private mapGasto(g: {
    id: number;
    descripcion: string;
    monto: Prisma.Decimal;
    tipo: TipoGasto;
    fecha: Date;
    pagado: boolean;
    activo: boolean;
    plantillaKey: string | null;
  }) {
    return {
      id: g.id,
      descripcion: g.descripcion,
      monto: Number(g.monto),
      tipo: g.tipo,
      fecha: g.fecha.toISOString().slice(0, 10),
      pagado: g.pagado,
      activo: g.activo,
      plantillaKey: g.plantillaKey,
    };
  }

  private parseFechaUTC(fechaStr: string): Date {
    const [y, m, d] = fechaStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }

  private mesAnterior(anio: number, mes: number) {
    if (mes === 1) {
      return { anio: anio - 1, mes: 12 };
    }
    return { anio, mes: mes - 1 };
  }

  /** Suma de ganancias Uber del mes (lo juntado). */
  private async totalJuntadoMes(anio: number, mes: number) {
    const inicio = new Date(Date.UTC(anio, mes - 1, 1));
    const fin = new Date(Date.UTC(anio, mes, 0));
    const ganancias = await this.prisma.gananciaDiaria.findMany({
      where: { fecha: { gte: inicio, lte: fin } },
    });
    return ganancias.reduce((acc, g) => acc + Number(g.monto), 0);
  }

  async listarMes(anio: number, mes: number) {
    // Al entrar a la sección, aseguranos que existan los mensuales del mes
    await this.generarMensualesSiFaltan(anio, mes);

    const inicio = new Date(Date.UTC(anio, mes - 1, 1));
    const fin = new Date(Date.UTC(anio, mes, 0));

    const gastos = await this.prisma.gasto.findMany({
      where: {
        fecha: { gte: inicio, lte: fin },
        OR: [
          { tipo: TipoGasto.UNICO },
          { tipo: TipoGasto.DIARIO },
          { tipo: TipoGasto.MENSUAL, activo: true },
        ],
      },
      orderBy: [{ tipo: 'asc' }, { fecha: 'asc' }, { id: 'asc' }],
    });

    // total / pagado / pendiente = cuentas del mes (MENSUAL + UNICO)
    const fijos = gastos.filter((g) => g.tipo !== TipoGasto.DIARIO);
    const diarios = gastos.filter((g) => g.tipo === TipoGasto.DIARIO);

    const total = fijos.reduce((acc, g) => acc + Number(g.monto), 0);
    const totalPagado = fijos
      .filter((g) => g.pagado)
      .reduce((acc, g) => acc + Number(g.monto), 0);
    const totalDiarios = diarios.reduce((acc, g) => acc + Number(g.monto), 0);

    const anterior = this.mesAnterior(anio, mes);
    const totalJuntadoAnterior = await this.totalJuntadoMes(
      anterior.anio,
      anterior.mes,
    );
    const porcentajePagado =
      totalJuntadoAnterior <= 0
        ? 0
        : (totalPagado / totalJuntadoAnterior) * 100;

    return {
      anio,
      mes,
      total,
      totalPagado,
      totalPendiente: total - totalPagado,
      totalDiarios,
      totalJuntadoAnterior,
      porcentajePagado,
      gastos: gastos.map((g) => this.mapGasto(g)),
    };
  }

  async crear(dto: CreateGastoDto) {
    const fecha = this.parseFechaUTC(dto.fecha);
    const plantillaKey =
      dto.tipo === TipoGasto.MENSUAL ? randomUUID() : null;

    // Los diarios ya salieron del bolsillo al cargarlos
    const pagadoDefault =
      dto.tipo === TipoGasto.DIARIO ? true : false;

    const gasto = await this.prisma.gasto.create({
      data: {
        descripcion: dto.descripcion,
        monto: new Prisma.Decimal(dto.monto),
        tipo: dto.tipo,
        fecha,
        pagado: dto.pagado ?? pagadoDefault,
        activo: dto.activo ?? true,
        plantillaKey,
      },
    });

    return this.mapGasto(gasto);
  }

  async actualizar(id: number, dto: UpdateGastoDto) {
    const existente = await this.prisma.gasto.findUnique({ where: { id } });
    if (!existente) {
      throw new NotFoundException(`Gasto ${id} no encontrado`);
    }

    const gasto = await this.prisma.gasto.update({
      where: { id },
      data: {
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.monto !== undefined && {
          monto: new Prisma.Decimal(dto.monto),
        }),
        ...(dto.tipo !== undefined && { tipo: dto.tipo }),
        ...(dto.fecha !== undefined && {
          fecha: this.parseFechaUTC(dto.fecha),
        }),
        ...(dto.pagado !== undefined && { pagado: dto.pagado }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
    });

    // Si es mensual y se editó descripción/monto/activo, propagar a la plantilla
    // solo en este registro (histórico previo se mantiene).
    return this.mapGasto(gasto);
  }

  async togglePagado(id: number, dto: TogglePagadoDto) {
    const existente = await this.prisma.gasto.findUnique({ where: { id } });
    if (!existente) {
      throw new NotFoundException(`Gasto ${id} no encontrado`);
    }

    const gasto = await this.prisma.gasto.update({
      where: { id },
      data: { pagado: dto.pagado },
    });

    return this.mapGasto(gasto);
  }

  async eliminar(id: number) {
    const existente = await this.prisma.gasto.findUnique({ where: { id } });
    if (!existente) {
      throw new NotFoundException(`Gasto ${id} no encontrado`);
    }

    // Para mensuales: desactivar plantilla (no se regenera en meses futuros)
    // y borrar la instancia del mes actual.
    if (existente.tipo === TipoGasto.MENSUAL && existente.plantillaKey) {
      await this.prisma.gasto.updateMany({
        where: { plantillaKey: existente.plantillaKey },
        data: { activo: false },
      });
    }

    await this.prisma.gasto.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * Replica gastos MENSUALES activos del mes anterior (o la última instancia
   * conocida de cada plantilla) en el mes solicitado, con pagado = false.
   */
  async generarMensualesSiFaltan(anio: number, mes: number) {
    const inicioMes = new Date(Date.UTC(anio, mes - 1, 1));
    const finMes = new Date(Date.UTC(anio, mes, 0));

    // Plantillas ya presentes en este mes
    const existentesMes = await this.prisma.gasto.findMany({
      where: {
        tipo: TipoGasto.MENSUAL,
        fecha: { gte: inicioMes, lte: finMes },
        plantillaKey: { not: null },
      },
      select: { plantillaKey: true },
    });
    const keysEnMes = new Set(
      existentesMes.map((g) => g.plantillaKey).filter(Boolean),
    );

    // Última instancia activa de cada plantilla (antes o igual al mes pedido)
    const candidatos = await this.prisma.gasto.findMany({
      where: {
        tipo: TipoGasto.MENSUAL,
        activo: true,
        plantillaKey: { not: null },
        fecha: { lte: finMes },
      },
      orderBy: { fecha: 'desc' },
    });

    const ultimaPorPlantilla = new Map<string, (typeof candidatos)[0]>();
    for (const g of candidatos) {
      if (!g.plantillaKey) continue;
      if (!ultimaPorPlantilla.has(g.plantillaKey)) {
        ultimaPorPlantilla.set(g.plantillaKey, g);
      }
    }

    const aCrear = [...ultimaPorPlantilla.entries()]
      .filter(([key]) => !keysEnMes.has(key))
      .map(([, g]) => g);

    if (aCrear.length === 0) {
      return { generados: 0 };
    }

    await this.prisma.gasto.createMany({
      data: aCrear.map((g) => ({
        descripcion: g.descripcion,
        monto: g.monto,
        tipo: TipoGasto.MENSUAL,
        fecha: inicioMes,
        pagado: false,
        activo: true,
        plantillaKey: g.plantillaKey,
      })),
    });

    return { generados: aCrear.length };
  }
}
