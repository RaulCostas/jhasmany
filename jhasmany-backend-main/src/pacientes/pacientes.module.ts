import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PacientesService } from './pacientes.service';
import { PacientesController } from './pacientes.controller';
import { Paciente } from './entities/paciente.entity';
import { FichaMedica } from './entities/ficha_medica.entity';
import { FichaMedicaDiagnostico } from './entities/ficha_medica_diagnostico.entity';
import { RecetaModule } from '../receta/receta.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Paciente, FichaMedica, FichaMedicaDiagnostico]),
        forwardRef(() => RecetaModule)
    ],
    controllers: [PacientesController],
    providers: [PacientesService],
    exports: [PacientesService],
})
export class PacientesModule { }
