import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { FichaMedica } from './ficha_medica.entity';

@Entity('ficha_medica_diagnosticos')
export class FichaMedicaDiagnostico {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    fichaMedicaId: number;

    @ManyToOne(() => FichaMedica, (ficha) => ficha.diagnosticos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'fichaMedicaId' })
    fichaMedica: FichaMedica;

    @Column({ type: 'text' })
    diagnostico: string;

    @Column({ type: 'text' })
    tipo: string; // 'Definitivo' | 'Repetitivo' | 'Presuntivo'

    @CreateDateColumn({ type: 'timestamp', default: () => "timezone('America/Lima', now())" })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', default: () => "timezone('America/Lima', now())", onUpdate: "timezone('America/Lima', now())" })
    updatedAt: Date;
}
