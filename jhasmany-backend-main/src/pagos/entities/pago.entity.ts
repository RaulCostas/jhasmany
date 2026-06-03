import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { ComisionTarjeta } from '../../comision_tarjeta/entities/comision_tarjeta.entity';
import { FormaPago } from '../../forma_pago/entities/forma_pago.entity';
import { User } from '../../users/entities/user.entity';


@Entity('pagos')
export class Pago {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    pacienteId: number;

    @ManyToOne(() => Paciente)
    @JoinColumn({ name: 'pacienteId' })
    paciente: Paciente;

    @Column({ type: 'date' })
    fecha: string;

    @Column('decimal', { precision: 10, scale: 2 })
    monto: number;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    monto_comision: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    tc: number;

    @Column({ type: 'text',  nullable: true })
    recibo: string;

    @Column({ type: 'text',  nullable: true })
    factura: string;

    @ManyToOne(() => ComisionTarjeta)
    @JoinColumn({ name: 'comisionTarjetaId' })
    comisionTarjeta: ComisionTarjeta;

    @ManyToOne(() => FormaPago)
    @JoinColumn({ name: 'formaPagoId' })
    formaPagoRel: FormaPago;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @Column({
        type: 'enum',
        enum: ['Soles', 'Dólares'],
        default: 'Soles'
    })
    moneda: string;

    @Column({ name: 'usuarioId', type: 'int', nullable: true })
    usuarioId: number | null;
    
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'usuarioId' })
    usuario: User;

    @Column({ type: 'timestamp', default: () => "timezone('America/Lima', now())" })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => "timezone('America/Lima', now())", onUpdate: "timezone('America/Lima', now())" })
    updatedAt: Date;
}
