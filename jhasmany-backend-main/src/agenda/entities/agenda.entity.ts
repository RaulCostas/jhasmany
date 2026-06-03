import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { User } from '../../users/entities/user.entity';


@Entity('agenda')
export class Agenda {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ type: 'date' })
    fecha: string;

    @Column({ type: 'time' })
    hora: string;

    @Column({ type: 'int' })
    duracion: number; // en minutos

    @Index()
    @Column({ type: 'int', nullable: true })
    pacienteId: number;

    @ManyToOne(() => Paciente, { nullable: true })
    @JoinColumn({ name: 'pacienteId' })
    paciente: Paciente;

    @Column({ type: 'int' })
    doctorId: number;

    @ManyToOne(() => Doctor)
    @JoinColumn({ name: 'doctorId' })
    doctor: Doctor;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @Column({ type: 'int' })
    usuarioId: number; // Quien agendó

    @ManyToOne(() => User)
    @JoinColumn({ name: 'usuarioId' })
    usuario: User;

    @Column({ name: 'fecha_agendado', type: 'timestamp', default: () => "timezone('America/Lima', now())" })
    fechaAgendado: Date;

    // Hora agendado is implicitly part of fecha_agendado timestamp, but if specific column needed:
    // We will rely on fechaAgendado being a full timestamp.

    @Index()
    @Column({ type: 'text', default: 'agendado' })
    estado: string;

    @Column({ type: 'text', nullable: true })
    motivoCancelacion: string;

    @Column({ type: 'boolean', default: false })
    recordatorioEnviado: boolean;

    @Column({ type: 'timestamp', default: () => "timezone('America/Lima', now())", onUpdate: "timezone('America/Lima', now())" })
    updatedAt: Date;
}
