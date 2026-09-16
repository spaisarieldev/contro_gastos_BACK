import { Module } from '@nestjs/common';
import { GananciasDidiController } from './ganancias-didi.controller';
import { GananciasDidiService } from './ganancias-didi.service';

@Module({
  controllers: [GananciasDidiController],
  providers: [GananciasDidiService],
  exports: [GananciasDidiService],
})
export class GananciasDidiModule {}
