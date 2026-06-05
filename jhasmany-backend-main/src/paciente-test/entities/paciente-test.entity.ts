import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

@Entity('paciente_tests')
export class PacienteTest {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'paciente_id' })
    pacienteId: number;

    @ManyToOne(() => Paciente, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'paciente_id' })
    paciente: Paciente;

    @Column({ name: 'doctor_id', type: 'integer', nullable: true })
    doctorId: number | null;

    @ManyToOne(() => Doctor, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'doctor_id' })
    doctor: Doctor | null;

    @Column({ name: 'nombre_test', type: 'text', default: 'Escala de Autoestima de Rosenberg' })
    nombreTest: string;

    @Column({ type: 'text', unique: true })
    token: string;

    @CreateDateColumn({ name: 'fecha_envio', type: 'timestamp', default: () => "timezone('America/Lima', now())" })
    fechaEnvio: Date;

    @Column({ type: 'text', default: 'enviado' })
    estado: string; // 'enviado' | 'completado'

    @Column({ name: 'fecha_completado', type: 'timestamp', nullable: true })
    fechaCompletado: Date;

    @Column({ type: 'jsonb', nullable: true })
    respuestas: any;

    @Column({ type: 'integer', nullable: true })
    puntaje: number;

    @Column({ type: 'text', nullable: true })
    resultado: string;
}
