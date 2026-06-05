import { IsString, IsOptional, IsDateString, IsBoolean, ValidateIf, IsNumber, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFichaMedicaDiagnosticoDto {
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsNotEmpty()
    @IsString()
    diagnostico: string;

    @IsNotEmpty()
    @IsString()
    tipo: string; // 'Definitivo' | 'Repetitivo' | 'Presuntivo'
}

export class CreateRecetaDetalleDto {
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsNotEmpty()
    @IsNumber()
    medicamentoId: number;

    @IsNotEmpty()
    @IsString()
    tiempo: string;

    @IsNotEmpty()
    @IsString()
    via: string;

    @IsNotEmpty()
    @IsString()
    posologia: string;

    @IsNotEmpty()
    @IsString()
    cantidad: string;
}

export class CreateRecetaDto {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateRecetaDetalleDto)
    detalles?: CreateRecetaDetalleDto[];
}

export class CreatePacienteDto {
    @IsDateString()
    @IsOptional()
    fecha_ingreso?: string;

    @IsString()
    @IsOptional()
    @ValidateIf((o, v) => v != null)
    paterno?: string;

    @IsString()
    @IsOptional()
    @ValidateIf((o, v) => v != null)
    materno?: string;

    @IsString()
    @IsOptional()
    @ValidateIf((o, v) => v != null)
    nombre?: string;

    @IsDateString()
    @IsOptional()
    @ValidateIf((o, v) => v != null)
    fecha_nacimiento?: string;

    @IsString()
    @IsOptional()
    @ValidateIf((o, v) => v != null)
    genero?: string;

    @IsString()
    @IsOptional()
    @ValidateIf((o, v) => v != null)
    dni?: string;

    @IsString()
    @IsOptional()
    @ValidateIf((o, v) => v != null)
    direccion?: string;

    @IsString()
    @IsOptional()
    @ValidateIf((o, v) => v != null)
    ocupacion?: string;

    @IsString()
    @IsOptional()
    @ValidateIf((o, v) => v != null)
    telefono_celular?: string;

    @IsString()
    @IsOptional()
    @ValidateIf((o, v) => v != null)
    email?: string;

    @IsString()
    @IsOptional()
    tutor_nombre?: string;

    @IsString()
    @IsOptional()
    tutor_dni?: string;

    @IsString()
    @IsOptional()
    estado?: string;

    // =====================
    // --- FICHA CLÍNICA ---
    // =====================
    @IsString()
    @IsOptional()
    motivo_consulta?: string;

    @IsString()
    @IsOptional()
    ant_familiares_abuelos?: string;

    @IsString()
    @IsOptional()
    ant_familiares_padres?: string;

    @IsString()
    @IsOptional()
    ant_familiares_hermanos?: string;

    @IsBoolean()
    @IsOptional()
    ant_pat_tratamiento_medico?: boolean;

    @IsString()
    @IsOptional()
    tratamiento_medico_detalle?: string;

    @IsBoolean()
    @IsOptional()
    ant_pat_hemorragias?: boolean;

    @IsBoolean()
    @IsOptional()
    ant_pat_intervencion_quirurgica?: boolean;

    @IsBoolean()
    @IsOptional()
    ant_pat_reaccion_anestesia?: boolean;

    @IsString()
    @IsOptional()
    reaccion_anestesia_detalle?: string;

    @IsBoolean()
    @IsOptional()
    ant_pat_toma_medicamentos?: boolean;

    @IsString()
    @IsOptional()
    medicamento_72h_detalle?: string;

    @IsBoolean()
    @IsOptional()
    ant_pat_alteraciones_cicatrizacion?: boolean;

    @IsBoolean()
    @IsOptional()
    ant_pat_alergias?: boolean;

    @IsString()
    @IsOptional()
    alergia_medicamento_detalle?: string;

    @IsString()
    @IsOptional()
    ant_pat_otros?: string;

    @IsBoolean()
    @IsOptional()
    ant_no_pat_fuma?: boolean;

    @IsString()
    @IsOptional()
    fuma_cantidad?: string;

    @IsBoolean()
    @IsOptional()
    ant_no_pat_bruxismo?: boolean;

    @IsBoolean()
    @IsOptional()
    ant_no_pat_bebe?: boolean;

    @IsBoolean()
    @IsOptional()
    ant_no_pat_succion_digital?: boolean;

    @IsBoolean()
    @IsOptional()
    ant_no_pat_onicofagia?: boolean;

    @IsBoolean()
    @IsOptional()
    ant_no_pat_mordisqueo_objetos?: boolean;

    @IsBoolean()
    @IsOptional()
    ant_no_pat_queilofagia?: boolean;

    @IsString()
    @IsOptional()
    ant_no_pat_otros?: string;

    @IsString()
    @IsOptional()
    particularidad?: string;

    @IsString()
    @IsOptional()
    recomendado_por?: string;

    @IsString()
    @IsOptional()
    observaciones?: string;

    @IsNumber()
    @IsOptional()
    usuarioId?: number;

    @IsString()
    @IsOptional()
    tiempo_residencia_lima?: string;

    @IsString()
    @IsOptional()
    lugar_nacimiento?: string;

    @IsString()
    @IsOptional()
    raza?: string;

    @IsString()
    @IsOptional()
    estado_civil?: string;

    @IsString()
    @IsOptional()
    idioma?: string;

    @IsString()
    @IsOptional()
    idioma_otro?: string;

    @IsString()
    @IsOptional()
    religion?: string;

    @IsString()
    @IsOptional()
    grado_instruccion?: string;

    @IsString()
    @IsOptional()
    vive_con?: string;

    @IsString()
    @IsOptional()
    vive_con_otros?: string;

    @IsString()
    @IsOptional()
    hora_ingreso?: string;



    @IsString()
    @IsOptional()
    tipo_anamnesis?: string;



    @IsString()
    @IsOptional()
    responsable_nombre?: string;

    @IsString()
    @IsOptional()
    responsable_telefono?: string;

    // II. ENFERMEDAD ACTUAL
    @IsString()
    @IsOptional()
    enf_actual_tiempo?: string;

    @IsString()
    @IsOptional()
    enf_actual_te?: string;

    @IsString()
    @IsOptional()
    enf_actual_inicio?: string;

    @IsString()
    @IsOptional()
    enf_actual_curso?: string;

    @IsString()
    @IsOptional()
    enf_actual_sintomas?: string;

    @IsString()
    @IsOptional()
    enf_actual_relato?: string;

    // III. ANTECEDENTES PERSONALES - 1. Rasgos psicopatológicos de la infancia
    @IsBoolean()
    @IsOptional()
    rasgo_aislamiento?: boolean;
    @IsString()
    @IsOptional()
    rasgo_aislamiento_detalle?: string;

    @IsBoolean()
    @IsOptional()
    rasgo_pavor_nocturno?: boolean;
    @IsString()
    @IsOptional()
    rasgo_pavor_nocturno_detalle?: string;

    @IsBoolean()
    @IsOptional()
    rasgo_encopresis?: boolean;
    @IsString()
    @IsOptional()
    rasgo_encopresis_detalle?: string;

    @IsBoolean()
    @IsOptional()
    rasgo_tricotilomania?: boolean;
    @IsString()
    @IsOptional()
    rasgo_tricotilomania_detalle?: string;

    @IsBoolean()
    @IsOptional()
    rasgo_piromania?: boolean;
    @IsString()
    @IsOptional()
    rasgo_piromania_detalle?: string;

    @IsBoolean()
    @IsOptional()
    rasgo_succion_dedo?: boolean;
    @IsString()
    @IsOptional()
    rasgo_succion_dedo_detalle?: string;

    @IsBoolean()
    @IsOptional()
    rasgo_crueldad?: boolean;
    @IsString()
    @IsOptional()
    rasgo_crueldad_detalle?: string;

    @IsBoolean()
    @IsOptional()
    rasgo_tendencia_mentir?: boolean;
    @IsString()
    @IsOptional()
    rasgo_tendencia_mentir_detalle?: string;

    @IsBoolean()
    @IsOptional()
    rasgo_tics?: boolean;
    @IsString()
    @IsOptional()
    rasgo_tics_detalle?: string;

    @IsBoolean()
    @IsOptional()
    rasgo_sonambulismo?: boolean;
    @IsString()
    @IsOptional()
    rasgo_sonambulismo_detalle?: string;

    @IsBoolean()
    @IsOptional()
    rasgo_enuresis?: boolean;
    @IsString()
    @IsOptional()
    rasgo_enuresis_detalle?: string;

    @IsBoolean()
    @IsOptional()
    rasgo_somniloquia?: boolean;
    @IsString()
    @IsOptional()
    rasgo_somniloquia_detalle?: string;

    @IsBoolean()
    @IsOptional()
    rasgo_tartamudez?: boolean;
    @IsString()
    @IsOptional()
    rasgo_tartamudez_detalle?: string;

    @IsBoolean()
    @IsOptional()
    rasgo_hiperactividad?: boolean;
    @IsString()
    @IsOptional()
    rasgo_hiperactividad_detalle?: string;

    @IsBoolean()
    @IsOptional()
    rasgo_rabietas?: boolean;
    @IsString()
    @IsOptional()
    rasgo_rabietas_detalle?: string;

    @IsBoolean()
    @IsOptional()
    rasgo_pesadillas?: boolean;
    @IsString()
    @IsOptional()
    rasgo_pesadillas_detalle?: string;

    @IsBoolean()
    @IsOptional()
    rasgo_fobia?: boolean;
    @IsString()
    @IsOptional()
    rasgo_fobia_detalle?: string;

    @IsBoolean()
    @IsOptional()
    rasgo_pica?: boolean;
    @IsString()
    @IsOptional()
    rasgo_pica_detalle?: string;

    // 2. Perinatal
    @IsString()
    @IsOptional()
    perinatal?: string;

    // 3. Desarrollo psicomotor
    @IsString()
    @IsOptional()
    desarrollo_psicomotor?: string;

    // 4. Escolaridad
    @IsString()
    @IsOptional()
    escolaridad?: string;

    // 5. Personalidad previa
    @IsString()
    @IsOptional()
    personalidad_previa?: string;

    // 6. Historia laboral
    @IsString()
    @IsOptional()
    historia_laboral?: string;

    // 7. Hábitos o intereses
    @IsString()
    @IsOptional()
    habitos_intereses?: string;

    // 8. Hábitos nocivos
    @IsString()
    @IsOptional()
    habito_tabaco_consumo?: string;
    @IsString()
    @IsOptional()
    habito_tabaco_frecuencia?: string;
    @IsString()
    @IsOptional()
    habito_tabaco_cantidad?: string;

    @IsString()
    @IsOptional()
    habito_alcohol_consumo?: string;
    @IsString()
    @IsOptional()
    habito_alcohol_frecuencia?: string;
    @IsString()
    @IsOptional()
    habito_alcohol_cantidad?: string;

    @IsString()
    @IsOptional()
    habito_drogas_consumo?: string;
    @IsString()
    @IsOptional()
    habito_drogas_frecuencia?: string;
    @IsString()
    @IsOptional()
    habito_drogas_cantidad?: string;

    @IsString()
    @IsOptional()
    habito_juegos_consumo?: string;
    @IsString()
    @IsOptional()
    habito_juegos_frecuencia?: string;
    @IsString()
    @IsOptional()
    habito_juegos_cantidad?: string;

    // 9. Recreación y Vida social
    @IsString()
    @IsOptional()
    recreacion_vida_social?: string;

    // 10. Vida sexual
    @IsString()
    @IsOptional()
    vida_sexual?: string;

    // 11. Eventos importantes y estresores
    @IsString()
    @IsOptional()
    estresores_psicosociales?: string;

    // 12. Antecedentes socio-culturales
    @IsString()
    @IsOptional()
    antecedentes_socio_culturales?: string;
    @IsString()
    @IsOptional()
    actitud_enfermedad?: string;

    // 13. Gineco-obstétricos
    @IsString()
    @IsOptional()
    antecedentes_gineco_obstetricos?: string;

    // 14. Antecedentes patológicos (Enfermedades no psiquiátricas)
    @IsBoolean()
    @IsOptional()
    patologia_diabetes?: boolean;

    @IsBoolean()
    @IsOptional()
    patologia_post_parto?: boolean;

    @IsBoolean()
    @IsOptional()
    patologia_cardiovascular_hta?: boolean;

    @IsBoolean()
    @IsOptional()
    patologia_inmunodeficiencia_vih?: boolean;

    @IsBoolean()
    @IsOptional()
    patologia_hepatica?: boolean;

    @IsBoolean()
    @IsOptional()
    patologia_renal?: boolean;

    @IsBoolean()
    @IsOptional()
    patologia_neurologica?: boolean;

    @IsBoolean()
    @IsOptional()
    patologia_metabolica?: boolean;

    @IsBoolean()
    @IsOptional()
    patologia_embarazo?: boolean;
    @IsString()
    @IsOptional()
    patologia_embarazo_trimestre?: string;

    @IsBoolean()
    @IsOptional()
    patologia_cancer?: boolean;

    @IsString()
    @IsOptional()
    patologia_otros?: string;

    // 15. Traumatismo y Accidentes
    @IsString()
    @IsOptional()
    traumatismo_accidentes?: string;

    // 16. Alergias
    @IsString()
    @IsOptional()
    alergias_ficha?: string;

    // 17. Hospitalizaciones
    @IsString()
    @IsOptional()
    hospitalizaciones?: string;

    // 18. Transfusiones
    @IsString()
    @IsOptional()
    transfusiones?: string;

    // 19. Quirúrgicos
    @IsString()
    @IsOptional()
    quirurgicos?: string;

    // 20. Antecedentes psicopatológicos
    @IsString()
    @IsOptional()
    antecedentes_psicopatologicos?: string;

    // IV. ANTECEDENTES FAMILIARES
    @IsString()
    @IsOptional()
    ant_fam_padre?: string;

    @IsString()
    @IsOptional()
    ant_fam_madre?: string;

    @IsString()
    @IsOptional()
    ant_fam_hermanos?: string;

    @IsString()
    @IsOptional()
    ant_fam_dinamica?: string;

    @IsString()
    @IsOptional()
    ant_fam_estructura?: string;

    // V. ANTECEDENTES GENERALES
    @IsString()
    @IsOptional()
    ant_generales?: string;

    // VI. EXAMEN FISICO - 1. Funciones Biológicas
    @IsString()
    @IsOptional()
    examen_bio_apetito?: string;

    @IsString()
    @IsOptional()
    examen_bio_sed?: string;

    @IsString()
    @IsOptional()
    examen_bio_orina?: string;

    @IsString()
    @IsOptional()
    examen_bio_deposiciones?: string;

    @IsString()
    @IsOptional()
    examen_bio_sueno?: string;

    @IsString()
    @IsOptional()
    examen_bio_alimentacion?: string;

    // VI. EXAMEN FISICO - 2. Funciones Vitales
    @IsString()
    @IsOptional()
    examen_vit_fc?: string;

    @IsString()
    @IsOptional()
    examen_vit_fr?: string;

    @IsString()
    @IsOptional()
    examen_vit_temp?: string;

    @IsString()
    @IsOptional()
    examen_vit_sat?: string;

    @IsString()
    @IsOptional()
    examen_vit_pa?: string;

    @IsString()
    @IsOptional()
    examen_vit_peso?: string;

    @IsString()
    @IsOptional()
    examen_vit_talla?: string;

    @IsString()
    @IsOptional()
    examen_vit_imc?: string;

    // VI. EXAMEN FISICO - Aspectos Generales y Sistemas
    @IsString()
    @IsOptional()
    examen_aspecto_general?: string;

    @IsString()
    @IsOptional()
    examen_piel_faneras?: string;

    @IsString()
    @IsOptional()
    examen_cabeza?: string;

    @IsString()
    @IsOptional()
    examen_ojos?: string;

    @IsString()
    @IsOptional()
    examen_nariz?: string;

    @IsString()
    @IsOptional()
    examen_oidos?: string;

    @IsString()
    @IsOptional()
    examen_boca?: string;

    @IsString()
    @IsOptional()
    examen_cuello?: string;

    @IsString()
    @IsOptional()
    examen_torax?: string;

    @IsString()
    @IsOptional()
    examen_cardiovascular?: string;

    @IsString()
    @IsOptional()
    examen_abdomen?: string;

    @IsString()
    @IsOptional()
    examen_urogenital?: string;

    @IsString()
    @IsOptional()
    examen_extremidades_columnas?: string;

    @IsString()
    @IsOptional()
    examen_neurologicos?: string;

    @IsString()
    @IsOptional()
    examen_linfaticos?: string;

    // VII. EXAMEN MENTAL
    @IsString()
    @IsOptional()
    examen_mental_apariencia?: string;

    @IsString()
    @IsOptional()
    examen_mental_lenguaje?: string;

    @IsString()
    @IsOptional()
    examen_mental_afecto?: string;

    @IsString()
    @IsOptional()
    examen_mental_pensamiento?: string;

    @IsString()
    @IsOptional()
    examen_mental_percepcion?: string;

    @IsString()
    @IsOptional()
    examen_mental_cognicion_conciencia?: string;

    @IsString()
    @IsOptional()
    examen_mental_cognicion_atencion?: string;

    @IsString()
    @IsOptional()
    examen_mental_cognicion_memoria?: string;

    @IsString()
    @IsOptional()
    examen_mental_cognicion_inteligencia?: string;

    @IsString()
    @IsOptional()
    examen_mental_cognicion_juicio?: string;

    @IsString()
    @IsOptional()
    examen_mental_funciones_ejecutivas?: string;

    @IsString()
    @IsOptional()
    examen_mental_conciencia_enfermedad?: string;

    // VIII. IMPRESION DIAGNOSTICA
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateFichaMedicaDiagnosticoDto)
    diagnosticos?: CreateFichaMedicaDiagnosticoDto[];

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateRecetaDto)
    receta?: CreateRecetaDto;
}
