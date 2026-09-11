import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertGananciaDto } from './dto/ganancia.dto';

@Injectable()
export class GananciasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Devuelve todos los días del mes con el monto cargado (o null si no hay registro).
   */
  async listarMes(anio: number, mes: number) {
    const inicio = new Date(Date.UTC(anio, mes - 1, 1));
    const fin = new Date(Date.UTC(anio, mes, 0)); // último día del mes
    const diasEnMes = fin.getUTCDate();

    const registros = await this.prisma.gananciaDiaria.findMany({
      where: {
        fecha: {
          gte: inicio,
          lte: fin,
        },
      },
      orderBy: { fecha: 'asc' },
    });

    const porDia = new Map(
      registros.map((r) => [r.fecha.toISOString().slice(0, 10), r]),
    );

    const dias = [];
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fechaStr = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const registro = porDia.get(fechaStr);
      dias.push({
        dia,
        fecha: fechaStr,
        id: registro?.id ?? null,
        monto: registro ? Number(registro.monto) : null,
      });
    }

    const total = registros.reduce(
      (acc, r) => acc + Number(r.monto),
      0,
    );

    return {
      anio,
      mes,
      diasEnMes,
      total,
      dias,
    };
  }

  async upsert(dto: UpsertGananciaDto) {
    const fecha = this.parseFechaUTC(dto.fecha);

    const registro = await this.prisma.gananciaDiaria.upsert({
      where: { fecha },
      create: {
        fecha,
        monto: new Prisma.Decimal(dto.monto),
      },
      update: {
        monto: new Prisma.Decimal(dto.monto),
      },
    });

    return {
      id: registro.id,
      fecha: registro.fecha.toISOString().slice(0, 10),
      monto: Number(registro.monto),
    };
  }

  async eliminarPorFecha(fechaStr: string) {
    const fecha = this.parseFechaUTC(fechaStr);
    await this.prisma.gananciaDiaria.deleteMany({ where: { fecha } });
    return { ok: true };
  }

  private parseFechaUTC(fechaStr: string): Date {
    const [y, m, d] = fechaStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
}
