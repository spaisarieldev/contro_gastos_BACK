import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { GananciasModule } from './ganancias/ganancias.module';
import { GananciasDidiModule } from './ganancias-didi/ganancias-didi.module';
import { GastosModule } from './gastos/gastos.module';
import { ResumenModule } from './resumen/resumen.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    GananciasModule,
    GananciasDidiModule,
    GastosModule,
    ResumenModule,
  ],
})
export class AppModule {}
