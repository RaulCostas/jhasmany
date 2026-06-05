import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PacienteImagen } from './entities/paciente-imagen.entity';
import { CreatePacienteImagenDto } from './dto/create-paciente-imagen.dto';
import { SupabaseStorageService } from '../common/storage/supabase-storage.service';

@Injectable()
export class PacienteImagenesService {
    constructor(
        @InjectRepository(PacienteImagen)
        private readonly imagenRepository: Repository<PacienteImagen>,
        private readonly storageService: SupabaseStorageService,
    ) {}

    async create(dto: CreatePacienteImagenDto): Promise<PacienteImagen> {
        let imageUrl = dto.imageData;

        // Upload to Supabase Storage (or local fallback) if it's a base64 image
        if (dto.imageData.startsWith('data:')) {
            imageUrl = await this.storageService.uploadBase64(
                'clinica-media',
                `paciente-${dto.pacienteId}/imagen-${Date.now()}`,
                dto.imageData,
            );
        }

        const imagen = this.imagenRepository.create();
        imagen.pacienteId = dto.pacienteId;
        imagen.url = imageUrl;
        imagen.descripcion = dto.descripcion ?? null;
        imagen.tipo = dto.tipo ?? 'imagen';

        return this.imagenRepository.save(imagen);
    }

    async findByPaciente(pacienteId: number): Promise<PacienteImagen[]> {
        return this.imagenRepository.find({
            where: { pacienteId },
            order: { createdAt: 'DESC' },
        });
    }

    async updateDescripcion(id: number, descripcion: string): Promise<PacienteImagen> {
        const imagen = await this.imagenRepository.findOneBy({ id });
        if (!imagen) throw new NotFoundException('Imagen no encontrada');
        imagen.descripcion = descripcion;
        return this.imagenRepository.save(imagen);
    }

    async remove(id: number): Promise<{ success: boolean }> {
        const imagen = await this.imagenRepository.findOneBy({ id });
        if (!imagen) throw new NotFoundException('Imagen no encontrada');

        // Delete from storage
        try {
            await this.storageService.deleteFile('clinica-media', imagen.url);
        } catch (e) {
            console.warn('[PacienteImagenes] Could not delete from storage:', e.message);
        }

        await this.imagenRepository.remove(imagen);
        return { success: true };
    }
}
