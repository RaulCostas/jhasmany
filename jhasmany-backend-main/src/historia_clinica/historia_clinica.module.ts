import { HistoriaClinica } from './entities/historia_clinica.entity';
import { HistoriaClinicaDiagnostico } from './entities/historia_clinica_diagnostico.entity';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HistoriaClinicaService } from './historia_clinica.service';
import { HistoriaClinicaController } from './historia_clinica.controller';
import { HistoriaClinicaPdfService } from './historia-clinica-pdf.service';
import { ChatbotModule } from '../chatbot/chatbot.module';
import { Pago } from '../pagos/entities/pago.entity';
import { StorageModule } from '../common/storage/storage.module';
import { RecetaModule } from '../receta/receta.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([HistoriaClinica, Pago, HistoriaClinicaDiagnostico]),
        forwardRef(() => ChatbotModule),
        StorageModule,
        RecetaModule,
    ],
    controllers: [HistoriaClinicaController],
    providers: [HistoriaClinicaService, HistoriaClinicaPdfService],
    exports: [HistoriaClinicaService]
})
export class HistoriaClinicaModule { }
