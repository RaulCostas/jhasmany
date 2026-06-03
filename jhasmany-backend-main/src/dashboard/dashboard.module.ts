import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PacientesModule } from '../pacientes/pacientes.module';
import { AgendaModule } from '../agenda/agenda.module';
import { GastosFijosModule } from '../gastos_fijos/gastos_fijos.module';
import { RecordatorioModule } from '../recordatorio/recordatorio.module';
import { RecordatorioTratamientoModule } from '../recordatorio-tratamiento/recordatorio-tratamiento.module';

@Module({
  imports: [
    PacientesModule,
    AgendaModule,
    GastosFijosModule,
    RecordatorioModule,
    RecordatorioTratamientoModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
