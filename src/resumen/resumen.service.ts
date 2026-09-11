import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GastosService } from '../gastos/gastos.service';

@Injectable()
export class ResumenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gastosService: GastosService,
  ) {}

  async resumenMes(anio: number, mes: number) {
    // Asegura mensuales del mes antes de calcular
    await this.gastosService.generarMensualesSiFaltan(anio, mes);

    const inicio = new Date(Date.UTC(anio, mes - 1, 1));
    const fin = new Date(Date.UTC(anio, mes, 0));
    const diasEnMes = fin.getUTCDate();

    const ganancias = await this.prisma.gananciaDiaria.findMany({
      where: { fecha: { gte: inicio, lte: fin } },
      orderBy: { fecha: 'asc' },
    });

    const gastos = await this.prisma.gasto.findMany({
      where: {
        fecha: { gte: inicio, lte: fin },
        OR: [{ tipo: 'UNICO' }, { tipo: 'MENSUAL', activo: true }],
      },
    });

    const totalGanancias = ganancias.reduce(
      (acc, g) => acc + Number(g.monto),
      0,
    );
    const totalGastos = gastos.reduce((acc, g) => acc + Number(g.monto), 0);

    const porDia = new Map(
      ganancias.map((g) => [g.fecha.toISOString().slice(0, 10), Number(g.monto)]),
    );

    const evolucionDiaria = [];
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      evolucionDiaria.push({
        dia,
        fecha,
        monto: porDia.get(fecha) ?? 0,
      });
    }

    return {
      anio,
      mes,
      totalGanancias,
      totalGastos,
      balanceNeto: totalGanancias - totalGastos,
      evolucionDiaria,
    };
  }

  /**
   * Comparativa mes a mes: total ganado vs total gastado.
   * Por defecto últimos 12 meses hasta el mes actual.
   */
  async evolucionMensual(cantidadMeses = 12) {
    const ahora = new Date();
    const resultado = [];

    for (let i = cantidadMeses - 1; i >= 0; i--) {
      const fecha = new Date(
        Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - i, 1),
      );
      const anio = fecha.getUTCFullYear();
      const mes = fecha.getUTCMonth() + 1;

      const inicio = new Date(Date.UTC(anio, mes - 1, 1));
      const fin = new Date(Date.UTC(anio, mes, 0));

      const [ganancias, gastos] = await Promise.all([
        this.prisma.gananciaDiaria.findMany({
          where: { fecha: { gte: inicio, lte: fin } },
        }),
        this.prisma.gasto.findMany({
          where: {
            fecha: { gte: inicio, lte: fin },
            OR: [{ tipo: 'UNICO' }, { tipo: 'MENSUAL', activo: true }],
          },
        }),
      ]);

      const totalGanancias = ganancias.reduce(
        (acc, g) => acc + Number(g.monto),
        0,
      );
      const totalGastos = gastos.reduce((acc, g) => acc + Number(g.monto), 0);

      resultado.push({
        anio,
        mes,
        etiqueta: `${anio}-${String(mes).padStart(2, '0')}`,
        totalGanancias,
        totalGastos,
        balanceNeto: totalGanancias - totalGastos,
      });
    }

    return { meses: resultado };
  }
}
