import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoriaClinica } from './entities/historia_clinica.entity';
import { HistoriaClinicaDiagnostico } from './entities/historia_clinica_diagnostico.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { CreateHistoriaClinicaDto } from './dto/create-historia_clinica.dto';
import { UpdateHistoriaClinicaDto } from './dto/update-historia_clinica.dto';
import { SupabaseStorageService } from '../common/storage/supabase-storage.service';

@Injectable()
export class HistoriaClinicaService {
    constructor(
        @InjectRepository(HistoriaClinica)
        private readonly historiaClinicaRepository: Repository<HistoriaClinica>,
        @InjectRepository(HistoriaClinicaDiagnostico)
        private readonly diagnosticoRepository: Repository<HistoriaClinicaDiagnostico>,
        @InjectRepository(Pago)
        private readonly pagoRepository: Repository<Pago>,
        private readonly storageService: SupabaseStorageService,
    ) { }

    async create(createDto: CreateHistoriaClinicaDto): Promise<HistoriaClinica> {
        const historia = this.historiaClinicaRepository.create(createDto);
        return await this.historiaClinicaRepository.save(historia);
    }

    async findAll(): Promise<HistoriaClinica[]> {
        return await this.historiaClinicaRepository.find({
            relations: ['paciente', 'diagnosticos'],
            order: { fecha: 'DESC' }
        });
    }

    async findAllByPaciente(pacienteId: number): Promise<HistoriaClinica[]> {
        return await this.historiaClinicaRepository.find({
            where: { pacienteId },
            relations: ['paciente', 'diagnosticos'],
            order: { fecha: 'DESC' }
        });
    }

    async findPendientesPago(doctorId?: number): Promise<any[]> {
        return [];
    }

    async findDoctoresConPendientes(): Promise<any[]> {
        return [];
    }

    async findCancelados(): Promise<any[]> {
        return [];
    }

    async findOne(id: number): Promise<HistoriaClinica> {
        const historia = await this.historiaClinicaRepository.findOne({
            where: { id },
            relations: ['paciente', 'diagnosticos']
        });
        if (!historia) {
            throw new NotFoundException(`Historia Clinica #${id} not found`);
        }
        return historia;
    }

    async update(id: number, updateDto: UpdateHistoriaClinicaDto): Promise<HistoriaClinica> {
        const historia = await this.findOne(id);

        // Delete old diagnoses so we can replace them cleanly
        if (updateDto.diagnosticos) {
            await this.diagnosticoRepository.delete({ historiaClinicaId: id });
        }

        this.historiaClinicaRepository.merge(historia, updateDto);
        return await this.historiaClinicaRepository.save(historia);
    }

    async remove(id: number): Promise<void> {
        const historia = await this.findOne(id);
        await this.historiaClinicaRepository.remove(historia);
    }
}
