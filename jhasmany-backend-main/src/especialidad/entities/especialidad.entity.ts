import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('especialidad')
export class Especialidad {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    especialidad: string;

    @Column({ type: 'text',  default: 'activo' })
    estado: string;
}
