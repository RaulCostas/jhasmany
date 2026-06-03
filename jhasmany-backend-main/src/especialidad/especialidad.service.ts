import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { CreateEspecialidadDto } from './dto/create-especialidad.dto';
import { UpdateEspecialidadDto } from './dto/update-especialidad.dto';
import { Especialidad } from './entities/especialidad.entity';



@Injectable()
export class EspecialidadService {
    constructor(
        @InjectRepository(Especialidad)
        private especialidadRepository: Repository<Especialidad>,
    ) { }

    async create(createEspecialidadDto: CreateEspecialidadDto) {
        const existing = await this.especialidadRepository.findOne({
            where: { especialidad: ILike(createEspecialidadDto.especialidad.trim()) }
        });

        if (existing) {
            throw new BadRequestException('La especialidad ya se encuentra registrada.');
        }

        const especialidad = this.especialidadRepository.create(createEspecialidadDto);
        return this.especialidadRepository.save(especialidad);
    }



    async findAll(search?: string, page: number = 1, limit: number = 5) {
        const skip = (page - 1) * limit;
        const where = search
            ? { especialidad: ILike(`%${search}%`) }
            : {};

        const [data, total] = await this.especialidadRepository.findAndCount({
            where,
            skip,
            take: limit,
            order: { especialidad: 'ASC' },
        });

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    findOne(id: number) {
        return this.especialidadRepository.findOneBy({ id });
    }

    async update(id: number, updateEspecialidadDto: UpdateEspecialidadDto) {
        if (updateEspecialidadDto.especialidad) {
            const existing = await this.especialidadRepository.createQueryBuilder('especialidad')
                .where('LOWER(especialidad.especialidad) = LOWER(:nombre)', { nombre: updateEspecialidadDto.especialidad.trim() })
                .andWhere('especialidad.id != :id', { id })
                .getOne();

            if (existing) {
                throw new BadRequestException('Ya existe otra especialidad con este nombre.');
            }
        }
        return this.especialidadRepository.update(id, updateEspecialidadDto);
    }

    remove(id: number) {
        return this.especialidadRepository.delete(id);
    }
}
