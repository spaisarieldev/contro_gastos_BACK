import { Injectable } from '@nestjs/common';
import { TipoGasto } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GastosService } from '../gastos/gastos.service';

@Injectable()
export class ResumenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gastosService: GastosService,
  ) {}

  private mesSiguiente(anio: number, mes: number) {
    if (mes === 12) {
      return { anio: anio + 1, mes: 1 };
    }
    return { anio, mes: mes + 1 };
  }

  private rangoMes(anio: number, mes: number) {
    const inicio = new Date(Date.UTC(anio, mes - 1, 1));
    const fin = new Date(Date.UTC(anio, mes, 0));
    return { inicio, fin, diasEnMes: fin.getUTCDate() };
  }

  private async totalGananciasMes(anio: number, mes: number) {
    const { inicio, fin } = this.rangoMes(anio, mes);
    const ganancias = await this.prisma.gananciaDiaria.findMany({
      where: { fecha: { gte: inicio, lte: fin } },
      orderBy: { fecha: 'asc' },
    });
    const total = ganancias.reduce((acc, g) => acc + Number(g.monto), 0);
    return { ganancias, total };
  }

  /**
   * Cuentas del mes a cubrir (MENSUAL + UNICO). No incluye DIARIO.
   */
  private async totalGastosFijosMes(anio: number, mes: number) {
    await this.gastosService.generarMensualesSiFaltan(anio, mes);

    const { inicio, fin } = this.rangoMes(anio, mes);
    const gastos = await this.prisma.gasto.findMany({
      where: {
        fecha: { gte: inicio, lte: fin },
        OR: [
          { tipo: TipoGasto.UNICO },
          { tipo: TipoGasto.MENSUAL, activo: true },
        ],
      },
    });
    const total = gastos.reduce((acc, g) => acc + Number(g.monto), 0);
    return { gastos, total };
  }

  /** Gastos del día a día del mes (salen de lo ganado ese mismo mes). */
  private async totalGastosDiariosMes(anio: number, mes: number) {
    const { inicio, fin } = this.rangoMes(anio, mes);
    const gastos = await this.prisma.gasto.findMany({
      where: {
        fecha: { gte: inicio, lte: fin },
        tipo: TipoGasto.DIARIO,
      },
    });
    const total = gastos.reduce((acc, g) => acc + Number(g.monto), 0);
    return { gastos, total };
  }

  /**
   * Lógica de negocio:
   * Lo ganado en el mes M (menos gastos diarios de M) cubre los gastos
   * fijos del mes M+1.
   * disponible = ganancias(M) - diarios(M)
   * "Cuánto falta" = disponible - gastosFijos(M+1)
   */
  async resumenMes(anio: number, mes: number) {
    const gastosMes = this.mesSiguiente(anio, mes);
    const { diasEnMes } = this.rangoMes(anio, mes);

    const [
      { ganancias, total: totalGanancias },
      { total: totalGastos },
      { total: totalGastosDiarios },
    ] = await Promise.all([
      this.totalGananciasMes(anio, mes),
      this.totalGastosFijosMes(gastosMes.anio, gastosMes.mes),
      this.totalGastosDiariosMes(anio, mes),
    ]);

    const porDia = new Map(
      ganancias.map((g) => [
        g.fecha.toISOString().slice(0, 10),
        Number(g.monto),
      ]),
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

    const disponible = totalGanancias - totalGastosDiarios;
    const balanceNeto = disponible - totalGastos;
    const faltaCubrir = balanceNeto < 0 ? Math.abs(balanceNeto) : 0;
    const sobrante = balanceNeto > 0 ? balanceNeto : 0;

    return {
      anio,
      mes,
      anioGastos: gastosMes.anio,
      mesGastos: gastosMes.mes,
      totalGanancias,
      totalGastosDiarios,
      disponible,
      totalGastos,
      balanceNeto,
      faltaCubrir,
      sobrante,
      evolucionDiaria,
    };
  }

  /**
   * Cada punto: disponible del mes M (ganancias - diarios) vs gastos fijos M+1.
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
      const gastosMes = this.mesSiguiente(anio, mes);

      const [
        { total: totalGanancias },
        { total: totalGastos },
        { total: totalGastosDiarios },
      ] = await Promise.all([
        this.totalGananciasMes(anio, mes),
        this.totalGastosFijosMes(gastosMes.anio, gastosMes.mes),
        this.totalGastosDiariosMes(anio, mes),
      ]);

      const disponible = totalGanancias - totalGastosDiarios;
      const balanceNeto = disponible - totalGastos;

      resultado.push({
        anio,
        mes,
        anioGastos: gastosMes.anio,
        mesGastos: gastosMes.mes,
        etiqueta: `${anio}-${String(mes).padStart(2, '0')}`,
        etiquetaGastos: `${gastosMes.anio}-${String(gastosMes.mes).padStart(2, '0')}`,
        totalGanancias,
        totalGastosDiarios,
        disponible,
        totalGastos,
        balanceNeto,
        faltaCubrir: balanceNeto < 0 ? Math.abs(balanceNeto) : 0,
        sobrante: balanceNeto > 0 ? balanceNeto : 0,
      });
    }

    return { meses: resultado };
  }
}
