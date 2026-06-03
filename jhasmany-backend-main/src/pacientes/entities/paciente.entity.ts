import { Entity, Column, PrimaryGeneratedColumn, OneToOne, OneToMany, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { HistoriaClinica } from '../../historia_clinica/entities/historia_clinica.entity';
import { FichaMedica } from './ficha_medica.entity';
import { User } from '../../users/entities/user.entity';

@Entity('pacientes')
export class Paciente {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'date', default: () => 'CURRENT_DATE' })
    fecha_ingreso: string;

    @Column({ type: 'text', nullable: true })
    paterno: string;

    @Column({ type: 'text', nullable: true })
    materno: string;

    @Column({ type: 'text', nullable: true })
    nombre: string;

    @Index()
    @Column({ type: 'date', nullable: true })
    fecha_nacimiento: string;

    @Column({ type: 'text', nullable: true })
    genero: string;

    @Column({ type: 'text', nullable: true })
    dni: string;

    @Column({ type: 'text', nullable: true })
    direccion: string;

    @Column({ type: 'text', nullable: true })
    ocupacion: string;

    @Column({ type: 'text', nullable: true })
    telefono_celular: string;

    @Column({ type: 'text', nullable: true })
    email: string;

    @Column({ type: 'text', nullable: true })
    tiempo_residencia_lima: string;

    @Column({ type: 'text', nullable: true })
    lugar_nacimiento: string;

    @Column({ type: 'text', nullable: true })
    raza: string;

    @Column({ type: 'text', nullable: true })
    estado_civil: string;

    @Column({ type: 'text', nullable: true })
    idioma: string;

    @Column({ type: 'text', nullable: true })
    idioma_otro: string;

    @Column({ type: 'text', nullable: true })
    religion: string;

    @Column({ type: 'text', nullable: true })
    grado_instruccion: string;

    @Column({ type: 'text', nullable: true })
    vive_con: string;

    @Column({ type: 'text', nullable: true })
    vive_con_otros: string;

    @Column({ type: 'text', nullable: true })
    hora_ingreso: string;

    @Column({ type: 'text', nullable: true })
    tipo_anamnesis: string;

    @Column({ type: 'text', nullable: true })
    responsable_nombre: string;

    @Column({ type: 'text', nullable: true })
    responsable_telefono: string;

    @Column({ type: 'text', nullable: true })
    tutor_nombre: string;

    @Column({ type: 'text', nullable: true })
    tutor_dni: string;

    @Index()
    @Column({ type: 'text', default: 'activo' })
    estado: string;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @Column({ type: 'boolean', default: false })
    esta_firmado: boolean;

    @OneToOne(() => FichaMedica, (ficha) => ficha.paciente, { cascade: true, eager: false })
    fichaClinica: FichaMedica;

    @OneToMany(() => HistoriaClinica, (historia) => historia.paciente)
    historiaClinica: HistoriaClinica[];

    @Index()
    @Column({ type: 'int', nullable: true })
    usuarioId: number | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'usuarioId' })
    usuario: User;


    @Column({ type: 'timestamp', default: () => "timezone('America/Lima', now())" })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => "timezone('America/Lima', now())", onUpdate: "timezone('America/Lima', now())" })
    updatedAt: Date;
}
