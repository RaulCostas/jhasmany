import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { HistoriaClinica } from './historia_clinica.entity';

@Entity('historia_clinica_diagnosticos')
export class HistoriaClinicaDiagnostico {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    historiaClinicaId: number;

    @ManyToOne(() => HistoriaClinica, (historia) => historia.diagnosticos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'historiaClinicaId' })
    historiaClinica: HistoriaClinica;

    @Column({ type: 'text' })
    diagnostico: string;

    @Column({ type: 'text' })
    tipo: string; // 'Definitivo' | 'Repetitivo' | 'Presuntivo'

    @CreateDateColumn({ type: 'timestamp', default: () => "timezone('America/Lima', now())" })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', default: () => "timezone('America/Lima', now())", onUpdate: "timezone('America/Lima', now())" })
    updatedAt: Date;
}
