import { Injectable } from '@nestjs/common';
import { PacientesService } from '../pacientes/pacientes.service';
import { AgendaService } from '../agenda/agenda.service';
import { GastosFijosService } from '../gastos_fijos/gastos_fijos.service';
import { RecordatorioService } from '../recordatorio/recordatorio.service';
import { RecordatorioTratamientoService } from '../recordatorio-tratamiento/recordatorio-tratamiento.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly pacientesService: PacientesService,
    private readonly agendaService: AgendaService,
    private readonly gastosFijosService: GastosFijosService,
    private readonly recordatorioService: RecordatorioService,
    private readonly recordatorioTratamientoService: RecordatorioTratamientoService,
  ) {}

  async getSummary(usuarioId?: number) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentDay = today.getDate();
    const currentMonth = today.toLocaleDateString('es-ES', { month: 'long' }).toLowerCase();

    const [
      personalBirthdays,
      pacienteStats,
      agendaTodayRaw,
      gastosFijosRaw,
      labAlerts,
      lowStock,
      noRegistrados,
      reminders,
      pendingTreatments,
    ] = await Promise.all([
      Promise.resolve([]),
      this.pacientesService.getDashboardStats(),
      this.agendaService.findAll(todayStr),
      this.gastosFijosService.findAll(),
      Promise.resolve([]),
      Promise.resolve([]),
      this.pacientesService.findNoRegistrados(),
      this.recordatorioService.findActivos(usuarioId),
      this.recordatorioTratamientoService.findPending(),
    ]);

    // Filter today's appointments count
    const todayAppointmentsCount = agendaTodayRaw.filter((app: any) => 
      app.estado === 'agendado' || app.estado === 'confirmado'
    ).length;

    // Filter due expenses
    const dueGastos = gastosFijosRaw.filter(gasto => {
      if (gasto.dia !== currentDay) return false;
      if (gasto.anual) {
        return gasto.mes?.toLowerCase() === currentMonth;
      }
      return true;
    });

    return {
      personalBirthdays,
      pacienteStats,
      todayAppointmentsCount,
      dueGastos,
      labAlerts,
      lowStock,
      noRegistrados,
      reminders,
      pendingTreatments,
      pendingPlans: [],
    };
  }
}
