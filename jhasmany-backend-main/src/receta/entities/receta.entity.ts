import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { User } from '../../users/entities/user.entity';
import { RecetaDetalle } from './receta-detalle.entity';
import { HistoriaClinica } from '../../historia_clinica/entities/historia_clinica.entity';
import { FichaMedica } from '../../pacientes/entities/ficha_medica.entity';


@Entity('receta')
export class Receta {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int',  name: 'paciente_id' })
    pacienteId: number;

    @Column({ type: 'int',  name: 'user_id', nullable: true })
    userId: number;

    @Column({ type: 'date' })
    fecha: string;

    @ManyToOne(() => Paciente)
    @JoinColumn({ name: 'paciente_id' })
    paciente: Paciente;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany(() => RecetaDetalle, detalle => detalle.receta, {
        cascade: ['insert', 'update'],
        eager: false
    })
    detalles: RecetaDetalle[];

    @Column({ type: 'int', name: 'historia_clinica_id', nullable: true })
    historiaClinicaId: number | null;

    @OneToOne(() => HistoriaClinica, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'historia_clinica_id' })
    historiaClinica: HistoriaClinica;

    @Column({ type: 'int', name: 'ficha_medica_id', nullable: true })
    fichaMedicaId: number | null;

    @OneToOne(() => FichaMedica, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'ficha_medica_id' })
    fichaMedica: FichaMedica;

    @Column({ type: 'boolean', default: false })
    esta_firmado: boolean;
}
