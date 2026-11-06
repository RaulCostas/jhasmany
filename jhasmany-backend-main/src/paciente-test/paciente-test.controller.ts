import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { PacienteTestService } from './paciente-test.service';

@Controller('paciente-test')
export class PacienteTestController {
    constructor(private readonly testService: PacienteTestService) {}

    // 1. Generate new test for patient (copiable URL token)
    @Post('enviar')
    create(
        @Body('pacienteId') pacienteId: number,
        @Body('doctorId') doctorId?: number,
        @Body('nombreTest') nombreTest?: string,
    ) {
        return this.testService.create(Number(pacienteId), doctorId ? Number(doctorId) : undefined, nombreTest);
    }

    // 1.1 Public start for an unregistered / guest participant
    @Post('public/iniciar-invitado')
    createInvitadoPublic(
        @Body() body: {
            nombre: string;
            paterno: string;
            materno?: string;
            celular?: string;
            doctorId?: number;
            nombreTest?: string;
        }
    ) {
        return this.testService.createInvitadoPublic(body);
    }

    // 1.2 Get all tests for guests / unregistered participants
    @Get('invitados')
    findAllInvitados() {
        return this.testService.findAllInvitados();
    }

    // 1.3 Link / convert guest test to a registered patient
    @Post(':id/vincular')
    vincularPaciente(
        @Param('id') id: string,
        @Body() body: {
            pacienteId?: number;
            crearNuevo?: boolean;
            nombre?: string;
            paterno?: string;
            materno?: string;
            telefono_celular?: string;
            dni?: string;
            usuarioId?: number;
        }
    ) {
        return this.testService.vincularPaciente(Number(id), body);
    }

    // Send test link via WhatsApp to the patient and associate doctor
    @Post(':id/send-whatsapp')
    sendWhatsApp(
        @Param('id') id: string,
        @Body('doctorId') doctorId: number,
        @Body('frontendUrl') frontendUrl: string,
    ) {
        return this.testService.sendWhatsApp(Number(id), Number(doctorId), frontendUrl);
    }

    // 2. History of tests for specific patient
    @Get('paciente/:pacienteId')
    findByPaciente(@Param('pacienteId') pacienteId: string) {
        return this.testService.findByPaciente(Number(pacienteId));
    }

    // 3. Get public test details by token (no auth required)
    @Get('public/:token')
    findByTokenPublic(@Param('token') token: string) {
        return this.testService.findByTokenPublic(token);
    }

    // 4. Submit answers from the public URL (no auth required)
    @Post('public/:token/responder')
    submitAnswers(
        @Param('token') token: string,
        @Body('respuestas') respuestas: any,
    ) {
        return this.testService.submitAnswers(token, respuestas);
    }

    // 4.1 Submit Explorando Valores game answers
    @Post('public/:token/responder-valores')
    submitValores(
        @Param('token') token: string,
        @Body() body: any,
    ) {
        return this.testService.submitValores(token, body);
    }

    // 5. Delete a test (only if not completed)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.testService.remove(Number(id));
    }
}
