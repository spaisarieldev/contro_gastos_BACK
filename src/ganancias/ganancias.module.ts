import { Module } from '@nestjs/common';
import { GananciasController } from './ganancias.controller';
import { GananciasService } from './ganancias.service';

@Module({
  controllers: [GananciasController],
  providers: [GananciasService],
  exports: [GananciasService],
})
export class GananciasModule {}
