import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { Doctor } from './entities/doctor.entity';


@Injectable()
export class DoctorsService {
    constructor(
        @InjectRepository(Doctor)
        private doctorsRepository: Repository<Doctor>,
    ) { }

    async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
        const doctor = this.doctorsRepository.create(createDoctorDto);
        return this.doctorsRepository.save(doctor);
    }



    async findAll(search?: string, page: number = 1, limit: number = 5): Promise<{
        data: Doctor[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const skip = (page - 1) * limit;

        const queryBuilder = this.doctorsRepository.createQueryBuilder('doctor');

        if (search) {
            queryBuilder.where(
                'doctor.nombre ILIKE :search OR doctor.paterno ILIKE :search OR doctor.materno ILIKE :search',
                { search: `%${search}%` }
            );
        }

        const [data, total] = await queryBuilder
            .leftJoinAndSelect('doctor.especialidad', 'especialidad')
            .orderBy('doctor.nombre', 'ASC')
            .addOrderBy('doctor.paterno', 'ASC')
            .addOrderBy('doctor.materno', 'ASC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: number): Promise<Doctor> {
        const doctor = await this.doctorsRepository.findOne({
            where: { id },
            relations: ['especialidad'],
        });
        if (!doctor) {
            throw new NotFoundException(`Doctor with ID ${id} not found`);
        }
        return doctor;
    }

    async findByCelular(celular: string): Promise<Doctor | null> {
        return this.doctorsRepository.findOne({
            where: { celular },
            relations: ['especialidad']
        });
    }

    async update(id: number, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
        const doctor = await this.findOne(id);
        Object.assign(doctor, updateDoctorDto);
        return this.doctorsRepository.save(doctor);
    }

    async remove(id: number): Promise<void> {
        const doctor = await this.findOne(id);
        await this.doctorsRepository.remove(doctor);
    }
}
