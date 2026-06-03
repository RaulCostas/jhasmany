import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';

@Entity('paciente_tests')
export class PacienteTest {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'paciente_id' })
    pacienteId: number;

    @ManyToOne(() => Paciente, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'paciente_id' })
    paciente: Paciente;

    @Column({ name: 'nombre_test', type: 'text', default: 'Escala de Autoestima de Rosenberg' })
    nombreTest: string;

    @Column({ type: 'text', unique: true })
    token: string;

    @CreateDateColumn({ name: 'fecha_envio', type: 'timestamp' })
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
