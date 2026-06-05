import { Entity, Column, PrimaryGeneratedColumn, OneToOne, OneToMany, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Paciente } from './paciente.entity';
import { User } from '../../users/entities/user.entity';
import { FichaMedicaDiagnostico } from './ficha_medica_diagnostico.entity';
import { Receta } from '../../receta/entities/receta.entity';

@Entity('ficha_medica')
export class FichaMedica {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    pacienteId: number;

    @OneToOne(() => Paciente, (paciente) => paciente.fichaClinica, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pacienteId' })
    paciente: Paciente;

    // --- MOTIVO CONSULTA ---
    @Column({ type: 'text', nullable: true })
    motivo_consulta: string;

    // --- ANTECEDENTES FAMILIARES ---
    @Column({ type: 'text', nullable: true })
    ant_familiares_abuelos: string;

    @Column({ type: 'text', nullable: true })
    ant_familiares_padres: string;

    @Column({ type: 'text', nullable: true })
    ant_familiares_hermanos: string;

    // --- ANTECEDENTES PERSONALES PATOLOGICOS ---
    @Column({ type: 'boolean', default: false })
    ant_pat_tratamiento_medico: boolean;

    @Column({ type: 'text', nullable: true })
    tratamiento_medico_detalle: string;

    @Column({ type: 'boolean', default: false })
    ant_pat_hemorragias: boolean;

    @Column({ type: 'boolean', default: false })
    ant_pat_intervencion_quirurgica: boolean;

    @Column({ type: 'boolean', default: false })
    ant_pat_reaccion_anestesia: boolean;

    @Column({ type: 'text', nullable: true })
    reaccion_anestesia_detalle: string;

    @Column({ type: 'boolean', default: false })
    ant_pat_toma_medicamentos: boolean;

    @Column({ type: 'text', nullable: true })
    medicamento_72h_detalle: string;

    @Column({ type: 'boolean', default: false })
    ant_pat_alteraciones_cicatrizacion: boolean;

    @Column({ type: 'boolean', default: false })
    ant_pat_alergias: boolean;

    @Column({ type: 'text', nullable: true })
    alergia_medicamento_detalle: string;

    @Column({ type: 'text', nullable: true })
    ant_pat_otros: string;

    // --- ANTECEDENTES PERSONALES NO PATOLOGICOS ---
    @Column({ type: 'boolean', default: false })
    ant_no_pat_fuma: boolean;

    @Column({ type: 'text', nullable: true })
    fuma_cantidad: string;

    @Column({ type: 'boolean', default: false })
    ant_no_pat_bruxismo: boolean;

    @Column({ type: 'boolean', default: false })
    ant_no_pat_bebe: boolean;

    @Column({ type: 'boolean', default: false })
    ant_no_pat_succion_digital: boolean;

    @Column({ type: 'boolean', default: false })
    ant_no_pat_onicofagia: boolean;

    @Column({ type: 'boolean', default: false })
    ant_no_pat_mordisqueo_objetos: boolean;

    @Column({ type: 'boolean', default: false })
    ant_no_pat_queilofagia: boolean;

    @Column({ type: 'text', nullable: true })
    ant_no_pat_otros: string;

    // II. ENFERMEDAD ACTUAL
    @Column({ type: 'text', nullable: true })
    enf_actual_tiempo: string;

    @Column({ type: 'text', nullable: true })
    enf_actual_te: string;

    @Column({ type: 'text', nullable: true })
    enf_actual_inicio: string;

    @Column({ type: 'text', nullable: true })
    enf_actual_curso: string;

    @Column({ type: 'text', nullable: true })
    enf_actual_sintomas: string;

    @Column({ type: 'text', nullable: true })
    enf_actual_relato: string;

    // III. ANTECEDENTES PERSONALES - 1. Rasgos psicopatológicos de la infancia
    @Column({ type: 'boolean', default: false })
    rasgo_aislamiento: boolean;
    @Column({ type: 'text', nullable: true })
    rasgo_aislamiento_detalle: string;

    @Column({ type: 'boolean', default: false })
    rasgo_pavor_nocturno: boolean;
    @Column({ type: 'text', nullable: true })
    rasgo_pavor_nocturno_detalle: string;

    @Column({ type: 'boolean', default: false })
    rasgo_encopresis: boolean;
    @Column({ type: 'text', nullable: true })
    rasgo_encopresis_detalle: string;

    @Column({ type: 'boolean', default: false })
    rasgo_tricotilomania: boolean;
    @Column({ type: 'text', nullable: true })
    rasgo_tricotilomania_detalle: string;

    @Column({ type: 'boolean', default: false })
    rasgo_piromania: boolean;
    @Column({ type: 'text', nullable: true })
    rasgo_piromania_detalle: string;

    @Column({ type: 'boolean', default: false })
    rasgo_succion_dedo: boolean;
    @Column({ type: 'text', nullable: true })
    rasgo_succion_dedo_detalle: string;

    @Column({ type: 'boolean', default: false })
    rasgo_crueldad: boolean;
    @Column({ type: 'text', nullable: true })
    rasgo_crueldad_detalle: string;

    @Column({ type: 'boolean', default: false })
    rasgo_tendencia_mentir: boolean;
    @Column({ type: 'text', nullable: true })
    rasgo_tendencia_mentir_detalle: string;

    @Column({ type: 'boolean', default: false })
    rasgo_tics: boolean;
    @Column({ type: 'text', nullable: true })
    rasgo_tics_detalle: string;

    @Column({ type: 'boolean', default: false })
    rasgo_sonambulismo: boolean;
    @Column({ type: 'text', nullable: true })
    rasgo_sonambulismo_detalle: string;

    @Column({ type: 'boolean', default: false })
    rasgo_enuresis: boolean;
    @Column({ type: 'text', nullable: true })
    rasgo_enuresis_detalle: string;

    @Column({ type: 'boolean', default: false })
    rasgo_somniloquia: boolean;
    @Column({ type: 'text', nullable: true })
    rasgo_somniloquia_detalle: string;

    @Column({ type: 'boolean', default: false })
    rasgo_tartamudez: boolean;
    @Column({ type: 'text', nullable: true })
    rasgo_tartamudez_detalle: string;

    @Column({ type: 'boolean', default: false })
    rasgo_hiperactividad: boolean;
    @Column({ type: 'text', nullable: true })
    rasgo_hiperactividad_detalle: string;

    @Column({ type: 'boolean', default: false })
    rasgo_rabietas: boolean;
    @Column({ type: 'text', nullable: true })
    rasgo_rabietas_detalle: string;

    @Column({ type: 'boolean', default: false })
    rasgo_pesadillas: boolean;
    @Column({ type: 'text', nullable: true })
    rasgo_pesadillas_detalle: string;

    @Column({ type: 'boolean', default: false })
    rasgo_fobia: boolean;
    @Column({ type: 'text', nullable: true })
    rasgo_fobia_detalle: string;

    @Column({ type: 'boolean', default: false })
    rasgo_pica: boolean;
    @Column({ type: 'text', nullable: true })
    rasgo_pica_detalle: string;

    // 2. Perinatal
    @Column({ type: 'text', nullable: true })
    perinatal: string;

    // 3. Desarrollo psicomotor
    @Column({ type: 'text', nullable: true })
    desarrollo_psicomotor: string;

    // 4. Escolaridad
    @Column({ type: 'text', nullable: true })
    escolaridad: string;

    // 5. Personalidad previa
    @Column({ type: 'text', nullable: true })
    personalidad_previa: string;

    // 6. Historia laboral
    @Column({ type: 'text', nullable: true })
    historia_laboral: string;

    // 7. Hábitos o intereses
    @Column({ type: 'text', nullable: true })
    habitos_intereses: string;

    // 8. Hábitos nocivos (table)
    @Column({ type: 'text', nullable: true })
    habito_tabaco_consumo: string;
    @Column({ type: 'text', nullable: true })
    habito_tabaco_frecuencia: string;
    @Column({ type: 'text', nullable: true })
    habito_tabaco_cantidad: string;

    @Column({ type: 'text', nullable: true })
    habito_alcohol_consumo: string;
    @Column({ type: 'text', nullable: true })
    habito_alcohol_frecuencia: string;
    @Column({ type: 'text', nullable: true })
    habito_alcohol_cantidad: string;

    @Column({ type: 'text', nullable: true })
    habito_drogas_consumo: string;
    @Column({ type: 'text', nullable: true })
    habito_drogas_frecuencia: string;
    @Column({ type: 'text', nullable: true })
    habito_drogas_cantidad: string;

    @Column({ type: 'text', nullable: true })
    habito_juegos_consumo: string;
    @Column({ type: 'text', nullable: true })
    habito_juegos_frecuencia: string;
    @Column({ type: 'text', nullable: true })
    habito_juegos_cantidad: string;

    // 9. Recreación y Vida social
    @Column({ type: 'text', nullable: true })
    recreacion_vida_social: string;

    // 10. Vida sexual
    @Column({ type: 'text', nullable: true })
    vida_sexual: string;

    // 11. Eventos importantes y estresores
    @Column({ type: 'text', nullable: true })
    estresores_psicosociales: string;

    // 12. Antecedentes socio-culturales
    @Column({ type: 'text', nullable: true })
    antecedentes_socio_culturales: string;
    @Column({ type: 'text', nullable: true })
    actitud_enfermedad: string;

    // 13. Gineco-obstétricos
    @Column({ type: 'text', nullable: true })
    antecedentes_gineco_obstetricos: string;

    // 14. Antecedentes patológicos (Enfermedades no psiquiátricas)
    @Column({ type: 'boolean', default: false })
    patologia_diabetes: boolean;

    @Column({ type: 'boolean', default: false })
    patologia_post_parto: boolean;

    @Column({ type: 'boolean', default: false })
    patologia_cardiovascular_hta: boolean;

    @Column({ type: 'boolean', default: false })
    patologia_inmunodeficiencia_vih: boolean;

    @Column({ type: 'boolean', default: false })
    patologia_hepatica: boolean;

    @Column({ type: 'boolean', default: false })
    patologia_renal: boolean;

    @Column({ type: 'boolean', default: false })
    patologia_neurologica: boolean;

    @Column({ type: 'boolean', default: false })
    patologia_metabolica: boolean;

    @Column({ type: 'boolean', default: false })
    patologia_embarazo: boolean;
    @Column({ type: 'text', nullable: true })
    patologia_embarazo_trimestre: string;

    @Column({ type: 'boolean', default: false })
    patologia_cancer: boolean;

    @Column({ type: 'text', nullable: true })
    patologia_otros: string;

    // 15. Traumatismo y Accidentes
    @Column({ type: 'text', nullable: true })
    traumatismo_accidentes: string;

    // 16. Alergias
    @Column({ type: 'text', nullable: true })
    alergias_ficha: string;

    // 17. Hospitalizaciones
    @Column({ type: 'text', nullable: true })
    hospitalizaciones: string;

    // 18. Transfusiones
    @Column({ type: 'text', nullable: true })
    transfusiones: string;

    // 19. Quirúrgicos
    @Column({ type: 'text', nullable: true })
    quirurgicos: string;

    // 20. Antecedentes psicopatológicos
    @Column({ type: 'text', nullable: true })
    antecedentes_psicopatologicos: string;

    // IV. ANTECEDENTES FAMILIARES
    @Column({ type: 'text', nullable: true })
    ant_fam_padre: string;

    @Column({ type: 'text', nullable: true })
    ant_fam_madre: string;

    @Column({ type: 'text', nullable: true })
    ant_fam_hermanos: string;

    @Column({ type: 'text', nullable: true })
    ant_fam_dinamica: string;

    @Column({ type: 'text', nullable: true })
    ant_fam_estructura: string;

    // V. ANTECEDENTES GENERALES
    @Column({ type: 'text', nullable: true })
    ant_generales: string;

    // VI. EXAMEN FISICO - 1. Funciones Biológicas
    @Column({ type: 'text', nullable: true })
    examen_bio_apetito: string;

    @Column({ type: 'text', nullable: true })
    examen_bio_sed: string;

    @Column({ type: 'text', nullable: true })
    examen_bio_orina: string;

    @Column({ type: 'text', nullable: true })
    examen_bio_deposiciones: string;

    @Column({ type: 'text', nullable: true })
    examen_bio_sueno: string;

    @Column({ type: 'text', nullable: true })
    examen_bio_alimentacion: string;

    // VI. EXAMEN FISICO - 2. Funciones Vitales
    @Column({ type: 'text', nullable: true })
    examen_vit_fc: string;

    @Column({ type: 'text', nullable: true })
    examen_vit_fr: string;

    @Column({ type: 'text', nullable: true })
    examen_vit_temp: string;

    @Column({ type: 'text', nullable: true })
    examen_vit_sat: string;

    @Column({ type: 'text', nullable: true })
    examen_vit_pa: string;

    @Column({ type: 'text', nullable: true })
    examen_vit_peso: string;

    @Column({ type: 'text', nullable: true })
    examen_vit_talla: string;

    @Column({ type: 'text', nullable: true })
    examen_vit_imc: string;

    // VI. EXAMEN FISICO - Aspectos Generales y Sistemas
    @Column({ type: 'text', nullable: true })
    examen_aspecto_general: string;

    @Column({ type: 'text', nullable: true })
    examen_piel_faneras: string;

    @Column({ type: 'text', nullable: true })
    examen_cabeza: string;

    @Column({ type: 'text', nullable: true })
    examen_ojos: string;

    @Column({ type: 'text', nullable: true })
    examen_nariz: string;

    @Column({ type: 'text', nullable: true })
    examen_oidos: string;

    @Column({ type: 'text', nullable: true })
    examen_boca: string;

    @Column({ type: 'text', nullable: true })
    examen_cuello: string;

    @Column({ type: 'text', nullable: true })
    examen_torax: string;

    @Column({ type: 'text', nullable: true })
    examen_cardiovascular: string;

    @Column({ type: 'text', nullable: true })
    examen_abdomen: string;

    @Column({ type: 'text', nullable: true })
    examen_urogenital: string;

    @Column({ type: 'text', nullable: true })
    examen_extremidades_columnas: string;

    @Column({ type: 'text', nullable: true })
    examen_neurologicos: string;

    @Column({ type: 'text', nullable: true })
    examen_linfaticos: string;

    // VII. EXAMEN MENTAL
    @Column({ type: 'text', nullable: true })
    examen_mental_apariencia: string;

    @Column({ type: 'text', nullable: true })
    examen_mental_lenguaje: string;

    @Column({ type: 'text', nullable: true })
    examen_mental_afecto: string;

    @Column({ type: 'text', nullable: true })
    examen_mental_pensamiento: string;

    @Column({ type: 'text', nullable: true })
    examen_mental_percepcion: string;

    @Column({ type: 'text', nullable: true })
    examen_mental_cognicion_conciencia: string;

    @Column({ type: 'text', nullable: true })
    examen_mental_cognicion_atencion: string;

    @Column({ type: 'text', nullable: true })
    examen_mental_cognicion_memoria: string;

    @Column({ type: 'text', nullable: true })
    examen_mental_cognicion_inteligencia: string;

    @Column({ type: 'text', nullable: true })
    examen_mental_cognicion_juicio: string;

    @Column({ type: 'text', nullable: true })
    examen_mental_funciones_ejecutivas: string;

    @Column({ type: 'text', nullable: true })
    examen_mental_conciencia_enfermedad: string;

    // VIII. IMPRESION DIAGNOSTICA
    @OneToMany(() => FichaMedicaDiagnostico, (diagnostico) => diagnostico.fichaMedica, { cascade: true })
    diagnosticos: FichaMedicaDiagnostico[];

    @OneToOne(() => Receta, (receta) => receta.fichaMedica, { nullable: true })
    receta: Receta;

    @Column({ type: 'varchar', length: 255, nullable: true })
    recomendado_por: string;

    @Column({ type: 'boolean', default: false })
    esta_firmado: boolean;

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
