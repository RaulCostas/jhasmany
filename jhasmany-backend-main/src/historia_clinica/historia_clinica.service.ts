import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoriaClinica } from './entities/historia_clinica.entity';
import { HistoriaClinicaDiagnostico } from './entities/historia_clinica_diagnostico.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { CreateHistoriaClinicaDto } from './dto/create-historia_clinica.dto';
import { UpdateHistoriaClinicaDto } from './dto/update-historia_clinica.dto';
import { SupabaseStorageService } from '../common/storage/supabase-storage.service';
import { Receta } from '../receta/entities/receta.entity';
import { RecetaService } from '../receta/receta.service';

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
        @InjectRepository(Receta)
        private readonly recetaRepository: Repository<Receta>,
        @Inject(forwardRef(() => RecetaService))
        private readonly recetaService: RecetaService,
    ) { }

    async create(createDto: CreateHistoriaClinicaDto): Promise<HistoriaClinica> {
        const { receta, ...historiaData } = createDto as any;
        const historia = this.historiaClinicaRepository.create(historiaData);
        const savedHistoria = await this.historiaClinicaRepository.save(historia) as unknown as HistoriaClinica;

        if (receta && receta.detalles && receta.detalles.length > 0) {
            const validDetalles = receta.detalles.filter((d: any) => d.medicamentoId > 0);
            if (validDetalles.length > 0) {
                await this.recetaService.create({
                    pacienteId: savedHistoria.pacienteId,
                    userId: savedHistoria.usuarioId,
                    fecha: savedHistoria.fecha,
                    historiaClinicaId: savedHistoria.id,
                    detalles: validDetalles
                });
            }
        }

        return await this.findOne(savedHistoria.id);
    }

    async findAll(): Promise<HistoriaClinica[]> {
        return await this.historiaClinicaRepository.find({
            relations: ['paciente', 'diagnosticos', 'receta', 'receta.detalles', 'receta.detalles.medicamento'],
            order: { fecha: 'DESC' }
        });
    }

    async findAllByPaciente(pacienteId: number): Promise<HistoriaClinica[]> {
        return await this.historiaClinicaRepository.find({
            where: { pacienteId },
            relations: ['paciente', 'diagnosticos', 'receta', 'receta.detalles', 'receta.detalles.medicamento'],
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
            relations: ['paciente', 'diagnosticos', 'receta', 'receta.detalles', 'receta.detalles.medicamento']
        });
        if (!historia) {
            throw new NotFoundException(`Historia Clinica #${id} not found`);
        }
        return historia;
    }

    async update(id: number, updateDto: UpdateHistoriaClinicaDto): Promise<HistoriaClinica> {
        const { receta, ...historiaData } = updateDto as any;
        const historia = await this.findOne(id);

        // Delete old diagnoses so we can replace them cleanly
        if (updateDto.diagnosticos) {
            await this.diagnosticoRepository.delete({ historiaClinicaId: id });
        }

        this.historiaClinicaRepository.merge(historia, historiaData);
        const savedHistoria = await this.historiaClinicaRepository.save(historia) as unknown as HistoriaClinica;

        if (receta) {
            const existingReceta = await this.recetaRepository.findOne({
                where: { historiaClinicaId: id }
            });

            const validDetalles = receta.detalles ? receta.detalles.filter((d: any) => d.medicamentoId > 0) : [];

            if (validDetalles.length > 0) {
                const recetaPayload = {
                    detalles: validDetalles,
                    pacienteId: savedHistoria.pacienteId,
                    userId: savedHistoria.usuarioId,
                    fecha: savedHistoria.fecha,
                    historiaClinicaId: savedHistoria.id
                };

                if (existingReceta) {
                    await this.recetaService.update(existingReceta.id, recetaPayload);
                } else {
                    await this.recetaService.create(recetaPayload);
                }
            } else if (existingReceta) {
                // If they cleared all medicines, delete the prescription
                await this.recetaService.remove(existingReceta.id);
            }
        }

        return await this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        const historia = await this.findOne(id);
        await this.historiaClinicaRepository.remove(historia);
    }
}
