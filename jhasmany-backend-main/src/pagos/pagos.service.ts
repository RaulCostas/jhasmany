import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';

@Injectable()
export class PagosService {
    constructor(
        @InjectRepository(Pago)
        private readonly pagoRepository: Repository<Pago>,
        private readonly dataSource: DataSource,
    ) { }

    async create(createDto: CreatePagoDto): Promise<Pago> {
        try {
            console.log('PagosService.create - DTO recibido:', createDto);
            const pago = this.pagoRepository.create(createDto);
            
            // Explicit assignment to ensure TypeORM persists it
            if (createDto.usuarioId !== undefined && createDto.usuarioId !== null) {
                pago.usuarioId = Number(createDto.usuarioId);
                pago.usuario = { id: Number(createDto.usuarioId) } as any;
            }

            if (createDto.formaPagoId) {
                pago.formaPagoRel = { id: createDto.formaPagoId } as any;
            }
            
            console.log('PagosService.create - Entidad antes de save:', {
                id: pago.id,
                monto: pago.monto,
                usuarioId: pago.usuarioId,
                usuario: pago.usuario ? 'SET' : 'MISSING'
            });
            if (createDto.comisionTarjetaId) {
                pago.comisionTarjeta = { id: createDto.comisionTarjetaId } as any;
            }
            const savedPago = await this.pagoRepository.save(pago);
            console.log('PagosService.create - Pago guardado:', savedPago);
            return savedPago;
        } catch (error) {
            console.error('Error al guardar pago en BD:', error);
            throw error;
        }
    }

    async findAll(params: { fecha?: string; startDate?: string; endDate?: string }): Promise<Pago[]> {
        const { fecha, startDate, endDate } = params;
        const where: any = {};

        if (fecha) {
            where.fecha = fecha;
        } else if (startDate && endDate) {
            where.fecha = Between(startDate, endDate);
        }

        return await this.pagoRepository.find({
            where,
            relations: ['paciente', 'comisionTarjeta', 'formaPagoRel'],
            order: { id: 'DESC' }
        });
    }

    async findAllByPaciente(pacienteId: number): Promise<Pago[]> {
        return await this.pagoRepository.find({
            where: { pacienteId },
            relations: ['paciente', 'comisionTarjeta', 'formaPagoRel'],
            order: { fecha: 'DESC' }
        });
    }

    async findOne(id: number): Promise<Pago> {
        const pago = await this.pagoRepository.findOne({
            where: { id },
            relations: ['paciente', 'comisionTarjeta', 'formaPagoRel']
        });
        if (!pago) {
            throw new NotFoundException(`Pago #${id} not found`);
        }
        return pago;
    }

    async update(id: number, updateDto: UpdatePagoDto): Promise<Pago> {
        const pago = await this.findOne(id);
        this.pagoRepository.merge(pago, updateDto);
        
        if (updateDto.usuarioId !== undefined && updateDto.usuarioId !== null) {
            pago.usuarioId = Number(updateDto.usuarioId);
            pago.usuario = { id: Number(updateDto.usuarioId) } as any;
        }

        if (updateDto.formaPagoId) {
            pago.formaPagoRel = { id: updateDto.formaPagoId } as any;
        }

        console.log('PagosService.update - Entidad antes de save:', {
            id: pago.id,
            usuarioId: pago.usuarioId,
            usuario: pago.usuario ? 'SET' : 'MISSING'
        });
        if (updateDto.comisionTarjetaId) {
            pago.comisionTarjeta = { id: updateDto.comisionTarjetaId } as any;
        }
        return await this.pagoRepository.save(pago);
    }

    async remove(id: number): Promise<void> {
        const pago = await this.findOne(id);
        await this.pagoRepository.remove(pago);
    }
}
