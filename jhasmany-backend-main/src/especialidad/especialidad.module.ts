import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EspecialidadService } from './especialidad.service';
import { EspecialidadController } from './especialidad.controller';
import { Especialidad } from './entities/especialidad.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Especialidad])],
    controllers: [EspecialidadController],
    providers: [EspecialidadService],
    exports: [EspecialidadService],
})
export class EspecialidadModule { }
