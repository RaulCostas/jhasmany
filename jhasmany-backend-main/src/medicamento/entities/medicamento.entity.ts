import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('medicamento')
export class Medicamento {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    medicamento: string;

    @Column({ type: 'text',  default: 'activo' })
    estado: string;
}
