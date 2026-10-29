import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PacientesService } from '../pacientes/pacientes.service';
import { AgendaService } from '../agenda/agenda.service';
import { GastosFijosService } from '../gastos_fijos/gastos_fijos.service';
import { RecordatorioService } from '../recordatorio/recordatorio.service';
import { RecordatorioTratamientoService } from '../recordatorio-tratamiento/recordatorio-tratamiento.service';
import { HistoriaClinica } from '../historia_clinica/entities/historia_clinica.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';

@Injectable()
export class DashboardService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly pacientesService: PacientesService,
    private readonly agendaService: AgendaService,
    private readonly gastosFijosService: GastosFijosService,
    private readonly recordatorioService: RecordatorioService,
    private readonly recordatorioTratamientoService: RecordatorioTratamientoService,
  ) {}

  private getYesterdayLima(targetDate?: string): string {
    if (targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return targetDate;
    }
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayStr = formatter.format(new Date());
    const [year, month, day] = todayStr.split('-').map(Number);
    const limaDate = new Date(Date.UTC(year, month - 1, day));
    limaDate.setUTCDate(limaDate.getUTCDate() - 1);
    return limaDate.toISOString().split('T')[0];
  }

  async getAtendidosAyer(targetDate?: string) {
    const yesterdayStr = this.getYesterdayLima(targetDate);

    // 1. Citas atendidas en la agenda
    let citasAyer: any[] = [];
    try {
      citasAyer = await this.agendaService.findAll(yesterdayStr);
    } catch (err) {
      console.error('Error fetching agenda for atendidos ayer:', err);
    }
    const citasAtendidas = citasAyer.filter(
      (app: any) => app.estado?.toLowerCase() === 'atendido' && app.paciente
    );

    // 2. Historias clínicas registradas para ayer
    const historiaRepo = this.dataSource.getRepository(HistoriaClinica);
    let historiasAyer: HistoriaClinica[] = [];
    try {
      historiasAyer = await historiaRepo
        .createQueryBuilder('hc')
        .leftJoinAndSelect('hc.paciente', 'paciente')
        .leftJoinAndSelect('hc.usuario', 'usuario')
        .where('CAST(hc.fecha AS text) = :yesterdayStr', { yesterdayStr })
        .orWhere("TO_CHAR(timezone('America/Lima', hc.createdAt), 'YYYY-MM-DD') = :yesterdayStr", { yesterdayStr })
        .orderBy('hc.id', 'DESC')
        .getMany();
    } catch (err) {
      console.error('Error fetching historia clinica for atendidos ayer:', err);
    }

    // 3. Pacientes nuevos o ficha médica creada ayer
    const pacienteRepo = this.dataSource.getRepository(Paciente);
    let nuevosPacientes: Paciente[] = [];
    try {
      nuevosPacientes = await pacienteRepo
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.fichaClinica', 'ficha')
        .leftJoinAndSelect('p.usuario', 'usuario')
        .where('CAST(p.fecha_ingreso AS text) = :yesterdayStr', { yesterdayStr })
        .orWhere("TO_CHAR(timezone('America/Lima', p.createdAt), 'YYYY-MM-DD') = :yesterdayStr", { yesterdayStr })
        .orWhere("TO_CHAR(timezone('America/Lima', ficha.createdAt), 'YYYY-MM-DD') = :yesterdayStr", { yesterdayStr })
        .orderBy('p.id', 'DESC')
        .getMany();
    } catch (err) {
      console.error('Error fetching new patients for atendidos ayer:', err);
    }

    const formatDocName = (rawName?: string) => {
      if (!rawName) return undefined;
      const trimmed = rawName.trim();
      return /^dr[a.]/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
    };

    const attendedMap = new Map<number, any>();

    // Procesar Citas en Agenda
    for (const cita of citasAtendidas) {
      if (!cita.pacienteId || !cita.paciente) continue;
      const docName = cita.doctor
        ? formatDocName(`${cita.doctor.nombre || ''} ${cita.doctor.paterno || ''}`)
        : formatDocName(cita.usuario?.name);

      attendedMap.set(cita.pacienteId, {
        pacienteId: cita.pacienteId,
        paciente: {
          id: cita.paciente.id,
          nombre: cita.paciente.nombre,
          paterno: cita.paciente.paterno,
          materno: cita.paciente.materno,
          dni: cita.paciente.dni,
          telefono_celular: cita.paciente.telefono_celular,
          email: cita.paciente.email,
        },
        doctor: docName,
        hora: cita.hora ? cita.hora.substring(0, 5) : undefined,
        origenes: ['Cita en Agenda'],
        servicio: cita.observaciones || 'Consulta agendada',
        motivo: cita.observaciones,
        tipoAtencion: 'Cita en Agenda (Atendido)',
      });
    }

    // Procesar Historias Clínicas
    for (const hc of historiasAyer) {
      if (!hc.pacienteId || !hc.paciente) continue;
      const docName = formatDocName(hc.usuario?.name);
      const existing = attendedMap.get(hc.pacienteId);

      if (existing) {
        if (!existing.origenes.includes('Historia Clínica')) {
          existing.origenes.push('Historia Clínica');
        }
        if (hc.servicio) existing.servicio = hc.servicio;
        if (docName && !existing.doctor) existing.doctor = docName;
        if (hc.motivo_visita && !existing.motivo) existing.motivo = hc.motivo_visita;
      } else {
        attendedMap.set(hc.pacienteId, {
          pacienteId: hc.pacienteId,
          paciente: {
            id: hc.paciente.id,
            nombre: hc.paciente.nombre,
            paterno: hc.paciente.paterno,
            materno: hc.paciente.materno,
            dni: hc.paciente.dni,
            telefono_celular: hc.paciente.telefono_celular,
            email: hc.paciente.email,
          },
          doctor: docName,
          hora: hc.createdAt
            ? new Date(hc.createdAt).toLocaleTimeString('es-PE', {
                timeZone: 'America/Lima',
                hour: '2-digit',
                minute: '2-digit',
              })
            : undefined,
          origenes: ['Historia Clínica'],
          servicio: hc.servicio || 'Seguimiento Clínico',
          motivo: hc.motivo_visita,
          tipoAtencion: 'Seguimiento Clínico',
        });
      }
    }

    // Procesar Pacientes Nuevos
    for (const p of nuevosPacientes) {
      if (!p.id) continue;
      const docName = formatDocName(p.usuario?.name);
      const existing = attendedMap.get(p.id);

      if (existing) {
        if (!existing.origenes.includes('Paciente Nuevo')) {
          existing.origenes.push('Paciente Nuevo');
        }
      } else {
        attendedMap.set(p.id, {
          pacienteId: p.id,
          paciente: {
            id: p.id,
            nombre: p.nombre,
            paterno: p.paterno,
            materno: p.materno,
            dni: p.dni,
            telefono_celular: p.telefono_celular,
            email: p.email,
          },
          doctor: docName,
          hora: p.hora_ingreso || (p.createdAt ? new Date(p.createdAt).toLocaleTimeString('es-PE', {
            timeZone: 'America/Lima',
            hour: '2-digit',
            minute: '2-digit',
          }) : undefined),
          origenes: ['Paciente Nuevo'],
          servicio: p.fichaClinica?.motivo_consulta ? `Motivo: ${p.fichaClinica.motivo_consulta}` : 'Ficha Médica Inicial',
          motivo: p.fichaClinica?.motivo_consulta,
          tipoAtencion: 'Paciente Nuevo (Ficha Médica)',
        });
      }
    }

    const items = Array.from(attendedMap.values());
    return {
      fecha: yesterdayStr,
      total: items.length,
      pacientes: items,
    };
  }

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
      atendidosAyer,
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
      this.getAtendidosAyer(),
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
      atendidosAyer,
    };
  }
}
