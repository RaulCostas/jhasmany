


export interface RecordatorioTratamiento {
    id: number;
    historiaClinicaId: number;
    historiaClinica?: HistoriaClinica;
    fechaRecordatorio: string;
    mensaje: string;
    dias: number;
    estado: string;
    createdAt: string;
    updatedAt: string;
}


export interface User {
    id: number;
    name: string;
    email: string;
    estado: string;
    password?: string; // Optional for list view
    foto?: string;
    permisos?: string[]; // Array of denied module IDs
}

export interface CreateUserDto {
    name: string;
    email: string;
    password: string;
    estado: string;
    foto?: string;
    permisos?: string[];
}



export interface Doctor {
    id: number;
    paterno: string;
    materno: string;
    nombre: string;
    celular: string;
    direccion: string;
    estado: string;
    idEspecialidad?: number;
    especialidad?: Especialidad;
}



export interface Especialidad {
    id: number;
    especialidad: string;
    estado: string;
}

export interface Medicamento {
    id: number;
    medicamento: string;
    estado: string;
}



export interface FormaPago {
    id: number;
    forma_pago: string;
    estado: string;
}

export interface Egreso {
    id: number;
    detalle: string;
    monto: number;
    moneda: 'Bolivianos' | 'Dólares';
    formaPago?: FormaPago;
    egresoTipo?: { id: number; tipo: string };
    fecha?: string;
    hora?: string;
}



export interface Categoria {
    id: number;
    nombre: string;
    color: string;
}

export interface FichaMedica {
    id?: number;
    pacienteId?: number;

    motivo_consulta?: string;
    ultima_visita_odontologo?: string;

    // Antecedentes familiares
    ant_familiares_abuelos?: string;
    ant_familiares_padres?: string;
    ant_familiares_hermanos?: string;

    // Antecedentes patológicos
    ant_pat_tratamiento_medico?: boolean;
    tratamiento_medico_detalle?: string;
    ant_pat_hemorragias?: boolean;
    ant_pat_intervencion_quirurgica?: boolean;
    ant_pat_reaccion_anestesia?: boolean;
    reaccion_anestesia_detalle?: string;
    ant_pat_toma_medicamentos?: boolean;
    medicamento_72h_detalle?: string;
    ant_pat_alteraciones_cicatrizacion?: boolean;
    ant_pat_alergias?: boolean;
    alergia_medicamento_detalle?: string;
    ant_pat_otros?: string;

    // Antecedentes no patológicos
    ant_no_pat_fuma?: boolean;
    fuma_cantidad?: string;
    ant_no_pat_bruxismo?: boolean;
    ant_no_pat_bebe?: boolean;
    ant_no_pat_succion_digital?: boolean;
    ant_no_pat_onicofagia?: boolean;
    ant_no_pat_mordisqueo_objetos?: boolean;
    ant_no_pat_queilofagia?: boolean;
    ant_no_pat_otros?: string;
    consume_citricos?: boolean;
    cepillado_veces?: string;

    // Enfermedades
    enf_neurologicas?: boolean;
    enf_neurologicas_detalle?: string;
    enf_pulmonares?: boolean;
    enf_pulmonares_detalle?: string;
    enf_cardiacas?: boolean;
    enf_cardiacas_detalle?: string;
    enf_higado?: boolean;
    enf_higado_detalle?: string;
    enf_gastricas?: boolean;
    enf_gastricas_detalle?: string;
    enf_venereas?: boolean;
    enf_venereas_detalle?: string;
    enf_renales?: boolean;
    enf_renales_detalle?: string;
    articulaciones?: boolean;
    articulaciones_detalle?: string;
    diabetes?: boolean;
    diabetes_detalle?: string;
    hipertension?: boolean;
    hipertension_detalle?: string;
    hipotension?: boolean;
    anemia?: boolean;
    anemia_detalle?: string;
    enf_epilepsia?: boolean;
    enf_epilepsia_detalle?: string;
    enf_tiroidismo?: boolean;
    enf_tiroidismo_detalle?: string;
    enf_infarto?: boolean;
    enf_infarto_detalle?: string;
    enf_asma?: boolean;
    enf_asma_detalle?: string;

    // VIH / Embarazo
    prueba_vih?: boolean;
    prueba_vih_resultado?: string;
    anticonceptivo_hormonal?: boolean;
    anticonceptivo_hormonal_detalle?: string;
    posibilidad_embarazo?: boolean;
    semana_gestacion?: string;

    // Complicaciones / Examen
    complicaciones_si_no?: boolean;
    complicaciones_detalle?: string;
    examen_clinico_extraoral?: string;
    particularidad?: string;
    recomendado_por?: string;
    observaciones?: string;

    // II. ENFERMEDAD ACTUAL
    enf_actual_tiempo?: string;
    enf_actual_te?: string;
    enf_actual_inicio?: string;
    enf_actual_curso?: string;
    enf_actual_sintomas?: string;
    enf_actual_relato?: string;

    // III. ANTECEDENTES PERSONALES - 1. Rasgos psicopatológicos de la infancia
    rasgo_aislamiento?: boolean;
    rasgo_aislamiento_detalle?: string;
    rasgo_pavor_nocturno?: boolean;
    rasgo_pavor_nocturno_detalle?: string;
    rasgo_encopresis?: boolean;
    rasgo_encopresis_detalle?: string;
    rasgo_tricotilomania?: boolean;
    rasgo_tricotilomania_detalle?: string;
    rasgo_piromania?: boolean;
    rasgo_piromania_detalle?: string;
    rasgo_succion_dedo?: boolean;
    rasgo_succion_dedo_detalle?: string;
    rasgo_crueldad?: boolean;
    rasgo_crueldad_detalle?: string;
    rasgo_tendencia_mentir?: boolean;
    rasgo_tendencia_mentir_detalle?: string;
    rasgo_tics?: boolean;
    rasgo_tics_detalle?: string;
    rasgo_sonambulismo?: boolean;
    rasgo_sonambulismo_detalle?: string;
    rasgo_enuresis?: boolean;
    rasgo_enuresis_detalle?: string;
    rasgo_somniloquia?: boolean;
    rasgo_somniloquia_detalle?: string;
    rasgo_tartamudez?: boolean;
    rasgo_tartamudez_detalle?: string;
    rasgo_hiperactividad?: boolean;
    rasgo_hiperactividad_detalle?: string;
    rasgo_rabietas?: boolean;
    rasgo_rabietas_detalle?: string;
    rasgo_pesadillas?: boolean;
    rasgo_pesadillas_detalle?: string;
    rasgo_fobia?: boolean;
    rasgo_fobia_detalle?: string;
    rasgo_pica?: boolean;
    rasgo_pica_detalle?: string;

    // 2. Perinatal
    perinatal?: string;

    // 3. Desarrollo psicomotor
    desarrollo_psicomotor?: string;

    // 4. Escolaridad
    escolaridad?: string;

    // 5. Personalidad previa
    personalidad_previa?: string;

    // 6. Historia laboral
    historia_laboral?: string;

    // 7. Hábitos o intereses
    habitos_intereses?: string;

    // 8. Hábitos nocivos (table)
    habito_tabaco_consumo?: string;
    habito_tabaco_frecuencia?: string;
    habito_tabaco_cantidad?: string;
    habito_alcohol_consumo?: string;
    habito_alcohol_frecuencia?: string;
    habito_alcohol_cantidad?: string;
    habito_drogas_consumo?: string;
    habito_drogas_frecuencia?: string;
    habito_drogas_cantidad?: string;
    habito_juegos_consumo?: string;
    habito_juegos_frecuencia?: string;
    habito_juegos_cantidad?: string;

    // 9. Recreación y Vida social
    recreacion_vida_social?: string;

    // 10. Vida sexual
    vida_sexual?: string;

    // 11. Eventos importantes y estresores
    estresores_psicosociales?: string;

    // 12. Antecedentes socio-culturales
    antecedentes_socio_culturales?: string;
    actitud_enfermedad?: string;

    // 13. Gineco-obstétricos
    antecedentes_gineco_obstetricos?: string;

    // 14. Antecedentes patológicos (Enfermedades no psiquiátricas)
    patologia_diabetes?: boolean;
    patologia_post_parto?: boolean;
    patologia_cardiovascular_hta?: boolean;
    patologia_inmunodeficiencia_vih?: boolean;
    patologia_hepatica?: boolean;
    patologia_renal?: boolean;
    patologia_neurologica?: boolean;
    patologia_metabolica?: boolean;
    patologia_embarazo?: boolean;
    patologia_embarazo_trimestre?: string;
    patologia_cancer?: boolean;
    patologia_otros?: string;

    // 15. Traumatismo y Accidentes
    traumatismo_accidentes?: string;

    // 16. Alergias
    alergias_ficha?: string;

    // 17. Hospitalizaciones
    hospitalizaciones?: string;

    // 18. Transfusiones
    transfusiones?: string;

    // 19. Quirúrgicos
    quirurgicos?: string;

    // 20. Antecedentes psicopatológicos
    antecedentes_psicopatologicos?: string;

    // IV. ANTECEDENTES FAMILIARES
    ant_fam_padre?: string;
    ant_fam_madre?: string;
    ant_fam_hermanos?: string;
    ant_fam_dinamica?: string;
    ant_fam_estructura?: string;

    // V. ANTECEDENTES GENERALES
    ant_generales?: string;

    // VI. EXAMEN FISICO
    examen_bio_apetito?: string;
    examen_bio_sed?: string;
    examen_bio_orina?: string;
    examen_bio_deposiciones?: string;
    examen_bio_sueno?: string;
    examen_bio_alimentacion?: string;

    examen_vit_fc?: string;
    examen_vit_fr?: string;
    examen_vit_temp?: string;
    examen_vit_sat?: string;
    examen_vit_pa?: string;
    examen_vit_peso?: string;
    examen_vit_talla?: string;
    examen_vit_imc?: string;

    examen_aspecto_general?: string;
    examen_piel_faneras?: string;
    examen_cabeza?: string;
    examen_ojos?: string;
    examen_nariz?: string;
    examen_oidos?: string;
    examen_boca?: string;
    examen_cuello?: string;
    examen_torax?: string;
    examen_cardiovascular?: string;
    examen_abdomen?: string;
    examen_urogenital?: string;
    examen_extremidades_columnas?: string;
    examen_neurologicos?: string;
    examen_linfaticos?: string;

    // VII. EXAMEN MENTAL
    examen_mental_apariencia?: string;
    examen_mental_lenguaje?: string;
    examen_mental_afecto?: string;
    examen_mental_pensamiento?: string;
    examen_mental_percepcion?: string;
    examen_mental_cognicion_conciencia?: string;
    examen_mental_cognicion_atencion?: string;
    examen_mental_cognicion_memoria?: string;
    examen_mental_cognicion_inteligencia?: string;
    examen_mental_cognicion_juicio?: string;
    examen_mental_funciones_ejecutivas?: string;
    examen_mental_conciencia_enfermedad?: string;

    // VIII. IMPRESION DIAGNOSTICA
    diagnostico_presuntivo?: string;
    diagnostico_cie10?: string;

    updatedAt?: string;
}

export interface Paciente {
    id: number;
    fecha_ingreso: string;
    paterno: string;
    materno: string;
    nombre: string;
    fecha_nacimiento: string;
    genero: string;
    dni: string;
    direccion: string;
    ocupacion: string;
    telefono_celular: string;
    email?: string;
    tutor_nombre?: string;
    tutor_dni?: string;
    estado: string;
    fichaClinica?: FichaMedica;
    seguro?: Seguro;
    celular?: string;
    observaciones?: string;
    clasificacion?: string;
    createdAt?: string;
    updatedAt?: string;
    esta_firmado?: boolean;

    tiempo_residencia_lima?: string;
    lugar_nacimiento?: string;
    raza?: string;
    estado_civil?: string;
    idioma?: string;
    idioma_otro?: string;
    religion?: string;
    grado_instruccion?: string;
    vive_con?: string;
    vive_con_otros?: string;
    hora_ingreso?: string;
    tipo_anamnesis?: string;
    responsable_nombre?: string;
    responsable_telefono?: string;
}






export interface UpdateUserDto extends Partial<CreateUserDto> { }



export interface HistoriaClinicaDiagnostico {
    id?: number;
    historiaClinicaId?: number;
    diagnostico: string;
    tipo: 'Definitivo' | 'Repetitivo' | 'Presuntivo';
}

export interface HistoriaClinica {
    id: number;
    pacienteId: number;
    paciente?: Paciente;
    fecha: string;
    modalidad: string; // 'Presencial' | 'Virtual'
    servicio: string; // 'Psiquiatria' | 'Neuropsiquiatria' | 'Psicologia'
    motivo_visita?: string;
    examen_fisico?: string;
    examen_mental?: string;
    examenes_auxiliares?: string;
    plan_trabajo?: string;
    derivar_consulta: string; // 'SI' | 'NO'
    derivar_consulta_detalle?: string;
    diagnosticos?: HistoriaClinicaDiagnostico[];
    receta?: Receta;
    createdAt: string;
    updatedAt: string;
}

export interface Pago {
    id: number;
    pacienteId: number;
    paciente?: Paciente;
    fecha: string;
    monto: number;
    moneda: 'Bolivianos' | 'Dólares';
    tc: number;
    recibo?: string;
    factura?: string;
    formaPago: 'Efectivo' | 'QR' | 'Tarjeta';
    comisionTarjetaId?: number;
    comisionTarjeta?: ComisionTarjeta;
    observaciones?: string;
    formaPagoRel?: FormaPago;
    createdAt: string;
    updatedAt: string;
}

export interface ComisionTarjeta {
    id: number;
    redBanco: string;
    monto: number;
    estado: string;
}

export interface Agenda {
    id: number;
    fecha: string;
    hora: string;
    duracion: number;
    pacienteId?: number;
    paciente?: Paciente;
    doctorId: number;
    doctor?: Doctor;
    usuarioId: number;
    usuario?: User;
    fechaAgendado: string;
    estado: string;
    observaciones?: string;
    motivoCancelacion?: string;
}

export interface GastoFijo {
    id: number;

    dia: number;
    anual: boolean;
    mes?: string;
    gasto_fijo: string;
    monto: number;
    moneda: string;
    estado?: string;
}

export interface PagoGastoFijo {
    id: number;
    gastoFijoId: number;
    gastoFijo?: GastoFijo;
    fecha: string;
    monto: number;
    moneda: string;
    formaPagoId: number;
    formaPago?: FormaPago;
    observaciones: string;
    createdAt?: string;
}







export interface Correo {
    id: number;
    remitente_id: number;
    remitente?: User;
    destinatario_id: number;
    destinatario?: User;
    copia_id?: number;
    copia?: User;
    asunto: string;
    mensaje: string;
    fecha_envio: string;
    leido_destinatario: boolean;
    leido_copia: boolean;
    // Helper property I will use in frontend logic? No, backend sends these raw fields.
}

export interface CreateCorreoDto {
    remitente_id: number;
    destinatario_id: number;
    copia_id?: number;
    asunto: string;
    mensaje: string;
}






export interface Receta {
    id: number;
    pacienteId: number;
    paciente?: Paciente;
    userId: number;
    user?: { id: number; name: string };
    fecha: string;
    detalles?: RecetaDetalle[];
    esta_firmado?: boolean;
}

export interface RecetaDetalle {
    id: number;
    recetaId: number;
    medicamentoId: number;
    medicamento?: Medicamento;
    tiempo: string;
    via: string;
    posologia: string;
    cantidad: string;
}



export interface Recordatorio {
    id: number;
    tipo: 'personal' | 'consultorio';
    fecha: string;
    hora: string;
    mensaje: string;
    repetir: 'Mensual' | 'Anual' | 'Solo una vez';
    estado: 'activo' | 'inactivo';
    usuarioId?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface Contacto {
    id: number;
    contacto: string;
    celular?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    estado: 'activo' | 'inactivo';
    createdAt?: string;
    updatedAt?: string;
}

export interface Musica {
    id: number;
    musica: string;
    estado: string;
    created_at?: string;
    updated_at?: string;
}

export interface Television {
    id: number;
    television: string;
    estado: string;
    created_at?: string;
    updated_at?: string;
}

export interface PacienteMusica {
    id: number;
    pacienteId: number;
    musicaId: number;
}

export interface PacienteTelevision {
    id: number;
    pacienteId: number;
    televisionId: number;
}

export interface BackupInfo {
    filename: string;
    size: number;
    createdAt: string;
    path: string;
}

export interface Seguro {
    id: number;
    nombre: string;
    color: string;
    estado: string;
    nit?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    contacto_nombre?: string;
}


