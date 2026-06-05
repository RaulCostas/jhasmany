import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('paciente_imagenes')
export class PacienteImagen {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'paciente_id', type: 'integer' })
    pacienteId: number;

    @Column({ type: 'text' })
    url: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string | null;

    @Column({ type: 'varchar', length: 20, default: 'imagen' })
    tipo: string; // 'imagen' | 'documento'

    @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => "timezone('America/Lima', now())" })
    createdAt: Date;
}
