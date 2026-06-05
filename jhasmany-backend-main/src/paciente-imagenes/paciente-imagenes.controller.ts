import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { PacienteImagenesService } from './paciente-imagenes.service';
import { CreatePacienteImagenDto } from './dto/create-paciente-imagen.dto';

@Controller('paciente-imagenes')
export class PacienteImagenesController {
    constructor(private readonly service: PacienteImagenesService) {}

    // POST /paciente-imagenes
    @Post()
    create(@Body() dto: CreatePacienteImagenDto) {
        return this.service.create(dto);
    }

    // GET /paciente-imagenes/paciente/:pacienteId
    @Get('paciente/:pacienteId')
    findByPaciente(@Param('pacienteId') pacienteId: string) {
        return this.service.findByPaciente(Number(pacienteId));
    }

    // PATCH /paciente-imagenes/:id/descripcion
    @Patch(':id/descripcion')
    updateDescripcion(
        @Param('id') id: string,
        @Body('descripcion') descripcion: string,
    ) {
        return this.service.updateDescripcion(Number(id), descripcion);
    }

    // DELETE /paciente-imagenes/:id
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(Number(id));
    }
}
