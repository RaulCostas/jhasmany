import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { User } from '../../users/entities/user.entity';
import { HistoriaClinicaDiagnostico } from './historia_clinica_diagnostico.entity';
import { Receta } from '../../receta/entities/receta.entity';

@Entity('historia_clinica')
export class HistoriaClinica {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ type: 'int' })
    pacienteId: number;

    @ManyToOne(() => Paciente, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pacienteId' })
    paciente: Paciente;

    @Index()
    @Column({ type: 'date' })
    fecha: Date;

    @Column({ type: 'text' })
    modalidad: string; // 'Presencial' | 'Virtual'

    @Column({ type: 'text' })
    servicio: string; // 'Psiquiatria' | 'Neuropsiquiatria' | 'Psicologia'

    // Seccion ANAMNESIS
    @Column({ type: 'text', nullable: true })
    motivo_visita: string;

    // Seccion EXAMEN FISICO
    @Column({ type: 'text', nullable: true })
    examen_fisico: string;

    @Column({ type: 'text', nullable: true })
    examen_mental: string;

    @Column({ type: 'text', nullable: true })
    examenes_auxiliares: string;

    // Seccion PLAN DE TRABAJO
    @Column({ type: 'text', nullable: true })
    plan_trabajo: string;

    @Column({ type: 'text', default: 'NO' })
    derivar_consulta: string; // 'SI' | 'NO'

    @Column({ type: 'text', nullable: true })
    derivar_consulta_detalle: string;

    // Seccion DIAGNOSTICO
    @OneToMany(() => HistoriaClinicaDiagnostico, (diagnostico) => diagnostico.historiaClinica, { cascade: true })
    diagnosticos: HistoriaClinicaDiagnostico[];

    @OneToOne(() => Receta, (receta) => receta.historiaClinica, { nullable: true })
    receta: Receta;

    // Auditing / User relation
    @Column({ type: 'int', nullable: true })
    usuarioId: number | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'usuarioId' })
    usuario: User;

    @CreateDateColumn({ type: 'timestamp', default: () => "timezone('America/Lima', now())" })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', default: () => "timezone('America/Lima', now())", onUpdate: "timezone('America/Lima', now())" })
    updatedAt: Date;
}
