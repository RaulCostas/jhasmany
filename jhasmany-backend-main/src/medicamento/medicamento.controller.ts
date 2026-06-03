import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MedicamentoService } from './medicamento.service';
import { CreateMedicamentoDto } from './dto/create-medicamento.dto';
import { UpdateMedicamentoDto } from './dto/update-medicamento.dto';

@Controller('medicamento')
export class MedicamentoController {
    constructor(private readonly medicamentoService: MedicamentoService) { }

    @Post()
    create(@Body() createMedicamentoDto: CreateMedicamentoDto) {
        return this.medicamentoService.create(createMedicamentoDto);
    }

    @Get()
    findAll(
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.medicamentoService.findAll(
            search,
            page ? +page : 1,
            limit ? +limit : 5,
        );
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.medicamentoService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateMedicamentoDto: UpdateMedicamentoDto) {
        return this.medicamentoService.update(+id, updateMedicamentoDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.medicamentoService.remove(+id);
    }
}
