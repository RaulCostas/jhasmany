import 'dotenv/config'; // Cargar variables de entorno
import { Module } from '@nestjs/common'; // Force Rebuild Final Decorators
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DoctorsModule } from './doctors/doctors.module';
import { EspecialidadModule } from './especialidad/especialidad.module';
import { MedicamentoModule } from './medicamento/medicamento.module';

import { User } from './users/entities/user.entity';
import { Medicamento } from './medicamento/entities/medicamento.entity';
import { Doctor } from './doctors/entities/doctor.entity';
import { Especialidad } from './especialidad/entities/especialidad.entity';
import { EgresosModule } from './egresos/egresos.module';
import { Egreso } from './egresos/entities/egreso.entity';
import { PacientesModule } from './pacientes/pacientes.module';
import { Paciente } from './pacientes/entities/paciente.entity';

import { HistoriaClinicaModule } from './historia_clinica/historia_clinica.module';
import { HistoriaClinica } from './historia_clinica/entities/historia_clinica.entity';
import { HistoriaClinicaDiagnostico } from './historia_clinica/entities/historia_clinica_diagnostico.entity';

import { PagosModule } from './pagos/pagos.module';
import { Pago } from './pagos/entities/pago.entity';
import { ComisionTarjetaModule } from './comision_tarjeta/comision_tarjeta.module';
import { ComisionTarjeta } from './comision_tarjeta/entities/comision_tarjeta.entity';
import { AgendaModule } from './agenda/agenda.module';
import { Agenda } from './agenda/entities/agenda.entity';
import { ChatModule } from './chat/chat.module';
import { GastosFijosModule } from './gastos_fijos/gastos_fijos.module';
import { PagosGastosFijosModule } from './pagos_gastos_fijos/pagos_gastos_fijos.module';


import { PagosGastosFijos } from './pagos_gastos_fijos/entities/pagos_gastos_fijos.entity';
import { GastosFijos } from './gastos_fijos/entities/gastos_fijos.entity';

import { CorreosModule } from './correos/correos.module';
import { Correo } from './correos/entities/correo.entity';

import { FormaPagoModule } from './forma_pago/forma_pago.module';
import { FormaPago } from './forma_pago/entities/forma_pago.entity';

import { ChatbotModule } from './chatbot/chatbot.module';

import { ChatbotIntento } from './chatbot/entities/chatbot-intento.entity';


import { UtilidadesModule } from './utilidades/utilidades.module';
import { RecetaModule } from './receta/receta.module';
import { Receta } from './receta/entities/receta.entity';
import { RecetaDetalle } from './receta/entities/receta-detalle.entity';

import { RecordatorioModule } from './recordatorio/recordatorio.module';
import { Recordatorio } from './recordatorio/entities/recordatorio.entity';
import { RecordatorioTratamientoModule } from './recordatorio-tratamiento/recordatorio-tratamiento.module';
import { RecordatorioTratamiento } from './recordatorio-tratamiento/entities/recordatorio-tratamiento.entity';
import { ContactosModule } from './contactos/contactos.module';
import { Contacto } from './contactos/entities/contacto.entity';
import { BackupModule } from './backup/backup.module';
import { FirmasModule } from './firmas/firmas.module';
import { FirmaDigital } from './firmas/entities/firma-digital.entity';
import { StorageModule } from './common/storage/storage.module';
import { WhatsappSession } from './chatbot/entities/whatsapp-session.entity';
import { FichaMedica } from './pacientes/entities/ficha_medica.entity';
import { DashboardModule } from './dashboard/dashboard.module';
import { PacienteTest } from './paciente-test/entities/paciente-test.entity';
import { PacienteTestModule } from './paciente-test/paciente-test.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgrespg',
      database: process.env.DB_DATABASE || 'jhasmany',
      logging: process.env.NODE_ENV !== 'production',
      synchronize: process.env.DB_SYNCHRONIZE === 'true' || process.env.NODE_ENV !== 'production',
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,

      extra: {
        timezone: 'America/Lima',
      },
      entities: [
        User,
        Doctor,
        Especialidad,
        Medicamento,
        Egreso,
        Paciente,


        HistoriaClinica,
        HistoriaClinicaDiagnostico,
        Pago,
        ComisionTarjeta,
        Agenda,
        GastosFijos,
        PagosGastosFijos,

        Correo,
        FormaPago,
        ChatbotIntento,
        RecetaDetalle,
        Receta,

        Recordatorio,
        RecordatorioTratamiento,
        Contacto,
        FirmaDigital,
        WhatsappSession,
        FichaMedica,
        PacienteTest,
      ],
    }),
    UsersModule,
    AuthModule,
    DoctorsModule,
    EspecialidadModule,
    MedicamentoModule,
    EgresosModule,
    PacientesModule,


    HistoriaClinicaModule,
    PagosModule,
    ComisionTarjetaModule,
    AgendaModule,
    ChatModule,
    GastosFijosModule,
    PagosGastosFijosModule,

    CorreosModule,
    FormaPagoModule,
    ChatbotModule,
    UtilidadesModule,
    RecetaModule,

    RecordatorioModule,
    RecordatorioTratamientoModule,
    ContactosModule,
    BackupModule,
    FirmasModule,
    StorageModule,
    DashboardModule,
    PacienteTestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
// Final clean build