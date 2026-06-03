import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { PacientesModule } from '../pacientes/pacientes.module';
import { AgendaModule } from '../agenda/agenda.module';
import { PagosModule } from '../pagos/pagos.module';
import { HistoriaClinicaModule } from '../historia_clinica/historia_clinica.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { ChatbotIntento } from './entities/chatbot-intento.entity';
import { ChatbotIntentosService } from './chatbot-intentos.service';
import { ChatbotIntentosController } from './chatbot-intentos.controller';
import { WhatsappSession } from './entities/whatsapp-session.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([ChatbotIntento, WhatsappSession]),
        PacientesModule,
        forwardRef(() => AgendaModule),
        forwardRef(() => PagosModule),
        forwardRef(() => HistoriaClinicaModule),
        DoctorsModule,
    ],
    controllers: [ChatbotController, ChatbotIntentosController],
    providers: [ChatbotService, ChatbotIntentosService],
    exports: [ChatbotService],
})
export class ChatbotModule { }
