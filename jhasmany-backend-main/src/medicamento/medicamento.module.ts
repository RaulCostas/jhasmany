import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicamentoService } from './medicamento.service';
import { MedicamentoController } from './medicamento.controller';
import { Medicamento } from './entities/medicamento.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Medicamento])],
    controllers: [MedicamentoController],
    providers: [MedicamentoService],
    exports: [MedicamentoService],
})
export class MedicamentoModule { }
