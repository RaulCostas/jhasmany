import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PacienteTest } from './entities/paciente-test.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { PacienteTestService } from './paciente-test.service';
import { PacienteTestController } from './paciente-test.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PacienteTest, Paciente]),
  ],
  controllers: [PacienteTestController],
  providers: [PacienteTestService],
  exports: [PacienteTestService],
})
export class PacienteTestModule {}
