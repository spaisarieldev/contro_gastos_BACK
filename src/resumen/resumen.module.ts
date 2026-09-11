import { Module } from '@nestjs/common';
import { GastosModule } from '../gastos/gastos.module';
import { ResumenController } from './resumen.controller';
import { ResumenService } from './resumen.service';

@Module({
  imports: [GastosModule],
  controllers: [ResumenController],
  providers: [ResumenService],
})
export class ResumenModule {}
