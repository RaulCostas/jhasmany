import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PacienteImagen } from './entities/paciente-imagen.entity';
import { PacienteImagenesService } from './paciente-imagenes.service';
import { PacienteImagenesController } from './paciente-imagenes.controller';
import { StorageModule } from '../common/storage/storage.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([PacienteImagen]),
        StorageModule,
    ],
    controllers: [PacienteImagenesController],
    providers: [PacienteImagenesService],
})
export class PacienteImagenesModule {}
