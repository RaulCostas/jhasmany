import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PacienteTest } from './entities/paciente-test.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { ChatbotModule } from '../chatbot/chatbot.module';
import { PacienteTestService } from './paciente-test.service';
import { PacienteTestController } from './paciente-test.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PacienteTest, Paciente, Doctor]),
    forwardRef(() => ChatbotModule),
  ],
  controllers: [PacienteTestController],
  providers: [PacienteTestService],
  exports: [PacienteTestService],
})
export class PacienteTestModule {}
