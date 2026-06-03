import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CreateMedicamentoDto } from './dto/create-medicamento.dto';
import { UpdateMedicamentoDto } from './dto/update-medicamento.dto';
import { Medicamento } from './entities/medicamento.entity';

@Injectable()
export class MedicamentoService {
    constructor(
        @InjectRepository(Medicamento)
        private medicamentoRepository: Repository<Medicamento>,
    ) { }

    async create(createMedicamentoDto: CreateMedicamentoDto) {
        const existing = await this.medicamentoRepository.findOne({
            where: { medicamento: ILike(createMedicamentoDto.medicamento.trim()) }
        });

        if (existing) {
            throw new BadRequestException('El medicamento ya se encuentra registrado.');
        }

        const medicamento = this.medicamentoRepository.create(createMedicamentoDto);
        return this.medicamentoRepository.save(medicamento);
    }

    async findAll(search?: string, page: number = 1, limit: number = 5) {
        const skip = (page - 1) * limit;
        const where = search
            ? { medicamento: ILike(`%${search}%`) }
            : {};

        const [data, total] = await this.medicamentoRepository.findAndCount({
            where,
            skip,
            take: limit,
            order: { medicamento: 'ASC' },
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
        return this.medicamentoRepository.findOneBy({ id });
    }

    async update(id: number, updateMedicamentoDto: UpdateMedicamentoDto) {
        if (updateMedicamentoDto.medicamento) {
            const existing = await this.medicamentoRepository.createQueryBuilder('medicamento')
                .where('LOWER(medicamento.medicamento) = LOWER(:nombre)', { nombre: updateMedicamentoDto.medicamento.trim() })
                .andWhere('medicamento.id != :id', { id })
                .getOne();

            if (existing) {
                throw new BadRequestException('Ya existe otro medicamento con este nombre.');
            }
        }
        return this.medicamentoRepository.update(id, updateMedicamentoDto);
    }

    remove(id: number) {
        return this.medicamentoRepository.delete(id);
    }
}
