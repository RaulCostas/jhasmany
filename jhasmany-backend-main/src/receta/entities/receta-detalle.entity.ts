import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Receta } from './receta.entity';
import { Medicamento } from '../../medicamento/entities/medicamento.entity';

@Entity('receta_detalle')
export class RecetaDetalle {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', name: 'receta_id' })
    recetaId: number;

    @Column({ type: 'int', name: 'medicamento_id' })
    medicamentoId: number;

    @Column({ type: 'text' })
    tiempo: string;

    @Column({ type: 'text' })
    via: string;

    @Column({ type: 'text' })
    posologia: string;

    @Column({ type: 'text' })
    cantidad: string;

    @ManyToOne(() => Receta, receta => receta.detalles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'receta_id' })
    receta: Receta;

    @ManyToOne(() => Medicamento)
    @JoinColumn({ name: 'medicamento_id' })
    medicamento: Medicamento;
}
