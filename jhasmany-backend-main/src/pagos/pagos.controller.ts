import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Inject, forwardRef } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { ChatbotService } from '../chatbot/chatbot.service';
import { PagosPdfService } from './pagos-pdf.service';
import { HistoriaClinicaService } from '../historia_clinica/historia_clinica.service';

@Controller('pagos')
export class PagosController {
    constructor(
        private readonly pagosService: PagosService,
        @Inject(forwardRef(() => ChatbotService))
        private readonly chatbotService: ChatbotService,
        private readonly pagosPdfService: PagosPdfService,
        private readonly historiaClinicaService: HistoriaClinicaService,
    ) { }

    @Post()
    async create(@Body() createDto: CreatePagoDto) {
        console.log('Recibiendo payload para crear pago:', createDto);
        return this.pagosService.create(createDto);
    }

    @Get()
    findAll(
        @Query('fecha') fecha?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.pagosService.findAll({ fecha, startDate, endDate });
    }

    @Post('whatsapp')
    async sendByWhatsapp(@Body() body: { pacienteId: number }) {
        const { pacienteId } = body;

        try {
            const pagos = await this.pagosService.findAllByPaciente(pacienteId);

            const historia = await this.historiaClinicaService.findAllByPaciente(pacienteId);

            const totalEjecutado = 0;

            const totalPagado = pagos.reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
            const diff = totalEjecutado - totalPagado;
            const saldoFavor = diff < 0 ? Math.abs(diff) : 0;
            const saldoContra = diff > 0 ? diff : 0;

            const resumen = { totalEjecutado, totalPagado, saldoFavor, saldoContra };

            const patientEntity = pagos.length > 0 ? pagos[0].paciente : (historia.length > 0 ? historia[0].paciente : null);

            if (!patientEntity) {
                return { success: false, message: 'No se encontraron datos del paciente para generar el reporte.' };
            }

            const pdfBuffer = await this.pagosPdfService.generatePagosPdf(patientEntity, null, pagos, resumen);

            const phoneNumber = patientEntity.telefono_celular;

            if (!phoneNumber) {
                return { success: false, message: 'El paciente no tiene número de celular registrado.' };
            }

            const cleanPhone = phoneNumber.replace(/\D/g, '');
            const countryCode = cleanPhone.length === 9 ? '51' : '';
            const jid = `${countryCode}${cleanPhone}@s.whatsapp.net`;

            const caption = `Hola ${patientEntity.nombre}, adjunto encontrará su historial de pagos.`;

            await this.chatbotService.sendMessage(jid, {
                document: pdfBuffer,
                mimetype: 'application/pdf',
                fileName: `Historial_Pagos.pdf`,
                caption: caption
            } );

            return { success: true, message: 'Enviado correctamente' };

        } catch (error) {
            console.error('Error sending WhatsApp:', error);
            return { success: false, message: 'Error al enviar el mensaje: ' + error.message };
        }
    }

    @Get('paciente/:id')
    findAllByPaciente(@Param('id') id: string) {
        return this.pagosService.findAllByPaciente(+id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.pagosService.findOne(+id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateDto: UpdatePagoDto) {
        return this.pagosService.update(+id, updateDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.pagosService.remove(+id);
        return { success: true };
    }
}
