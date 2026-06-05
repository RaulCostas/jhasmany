import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { PacientesModule } from '../pacientes/pacientes.module';
import { AgendaModule } from '../agenda/agenda.module';
import { WhatsappSession } from './entities/whatsapp-session.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([WhatsappSession]),
        forwardRef(() => PacientesModule),
        forwardRef(() => AgendaModule),
    ],
    controllers: [ChatbotController],
    providers: [ChatbotService],
    exports: [ChatbotService],
})
export class ChatbotModule { }

