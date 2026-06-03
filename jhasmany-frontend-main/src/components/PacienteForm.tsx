import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import SignatureModal from './SignatureModal';
import { getLocalDateString } from '../utils/dateUtils';
import { ArrowLeft, User, Users, Activity, Wind, Info, Edit, Mail, Calendar, MapPin, Phone, Briefcase, HelpCircle, Save, X, Fingerprint, Search, Plus, Stethoscope } from 'lucide-react';

const PacienteForm: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [showManual, setShowManual] = useState(false);

    // New state for phone country code
    const [countryCode, setCountryCode] = useState('+51');
    const [localCelular, setLocalCelular] = useState('');
    const [newPatientId, setNewPatientId] = useState<number | null>(null);
    const [activeTabForm, setActiveTabForm] = useState<'filiacion' | 'enfermedad_actual' | 'antecedentes' | 'antecedentes_familiares' | 'examen_fisico' | 'examen_mental' | 'impresion_diagnostica'>('filiacion');

    const countryCodes = [
        { code: '+591', label: '🇧🇴 +591' },
        { code: '+54', label: '🇦🇷 +54' },
        { code: '+55', label: '🇧🇷 +55' },
        { code: '+56', label: '🇨🇱 +56' },
        { code: '+51', label: '🇵🇪 +51' },
        { code: '+595', label: '🇵🇾 +595' },
        { code: '+598', label: '🇺🇾 +598' },
        { code: '+57', label: '🇨🇴 +57' },
        { code: '+52', label: '🇲🇽 +52' },
        { code: '+34', label: '🇪🇸 +34' },
        { code: '+1', label: '🇺🇸 +1' },
    ];

    useEffect(() => {
        if (location.state?.openSignature) {
            setShowSignatureModal(true);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const manualSections: ManualSection[] = [
        {
            title: 'Registro de Pacientes',
            content: 'Complete la filiación y antecedentes médicos. Los campos con * son obligatorios.'
        }
    ];

    const [formData, setFormData] = useState({
        fecha_ingreso: getLocalDateString(),
        paterno: '',
        materno: '',
        nombre: '',
        fecha_nacimiento: '',
        genero: '',
        dni: '',
        direccion: '',
        ocupacion: '',
        telefono_celular: '',
        email: '',
        tutor_nombre: '',
        tutor_dni: '',
        observaciones: '',
        estado: 'activo',
        // NUEVOS CAMPOS FILIACION
        tiempo_residencia_lima: '',
        lugar_nacimiento: '',
        raza: '',
        estado_civil: '',
        idioma: '',
        idioma_otro: '',
        religion: '',
        grado_instruccion: '',
        vive_con: '',
        vive_con_otros: '',
        hora_ingreso: '',
        tipo_anamnesis: '',
        responsable_nombre: '',
        responsable_telefono: '',

        // II. ENFERMEDAD ACTUAL
        enf_actual_tiempo: '',
        enf_actual_te: '',
        enf_actual_inicio: '',
        enf_actual_curso: '',
        enf_actual_sintomas: '',
        enf_actual_relato: '',

        // III. ANTECEDENTES PERSONALES - 1. Rasgos psicopatológicos de la infancia
        rasgo_aislamiento: false,
        rasgo_aislamiento_detalle: '',
        rasgo_pavor_nocturno: false,
        rasgo_pavor_nocturno_detalle: '',
        rasgo_encopresis: false,
        rasgo_encopresis_detalle: '',
        rasgo_tricotilomania: false,
        rasgo_tricotilomania_detalle: '',
        rasgo_piromania: false,
        rasgo_piromania_detalle: '',
        rasgo_succion_dedo: false,
        rasgo_succion_dedo_detalle: '',
        rasgo_crueldad: false,
        rasgo_crueldad_detalle: '',
        rasgo_tendencia_mentir: false,
        rasgo_tendencia_mentir_detalle: '',
        rasgo_tics: false,
        rasgo_tics_detalle: '',
        rasgo_sonambulismo: false,
        rasgo_sonambulismo_detalle: '',
        rasgo_enuresis: false,
        rasgo_enuresis_detalle: '',
        rasgo_somniloquia: false,
        rasgo_somniloquia_detalle: '',
        rasgo_tartamudez: false,
        rasgo_tartamudez_detalle: '',
        rasgo_hiperactividad: false,
        rasgo_hiperactividad_detalle: '',
        rasgo_rabietas: false,
        rasgo_rabietas_detalle: '',
        rasgo_pesadillas: false,
        rasgo_pesadillas_detalle: '',
        rasgo_fobia: false,
        rasgo_fobia_detalle: '',
        rasgo_pica: false,
        rasgo_pica_detalle: '',

        // 2. Perinatal
        perinatal: '',

        // 3. Desarrollo psicomotor
        desarrollo_psicomotor: '',

        // 4. Escolaridad
        escolaridad: '',

        // 5. Personalidad previa
        personalidad_previa: '',

        // 6. Historia laboral
        historia_laboral: '',

        // 7. Hábitos o intereses
        habitos_intereses: '',

        // 8. Hábitos nocivos
        habito_tabaco_consumo: '',
        habito_tabaco_frecuencia: '',
        habito_tabaco_cantidad: '',
        habito_alcohol_consumo: '',
        habito_alcohol_frecuencia: '',
        habito_alcohol_cantidad: '',
        habito_drogas_consumo: '',
        habito_drogas_frecuencia: '',
        habito_drogas_cantidad: '',
        habito_juegos_consumo: '',
        habito_juegos_frecuencia: '',
        habito_juegos_cantidad: '',

        // 9. Recreación y Vida social
        recreacion_vida_social: '',

        // 10. Vida sexual
        vida_sexual: '',

        // 11. Eventos importantes y estresores
        estresores_psicosociales: '',

        // 12. Antecedentes socio-culturales
        antecedentes_socio_culturales: '',
        actitud_enfermedad: '',

        // 13. Gineco-obstétricos
        antecedentes_gineco_obstetricos: '',

        // 14. Antecedentes patológicos (Enfermedades no psiquiátricas)
        patologia_diabetes: false,
        patologia_post_parto: false,
        patologia_cardiovascular_hta: false,
        patologia_inmunodeficiencia_vih: false,
        patologia_hepatica: false,
        patologia_renal: false,
        patologia_neurologica: false,
        patologia_metabolica: false,
        patologia_embarazo: false,
        patologia_embarazo_trimestre: '',
        patologia_cancer: false,
        patologia_otros: '',

        // 15. Traumatismo y Accidentes
        traumatismo_accidentes: '',

        // 16. Alergias
        alergias_ficha: '',

        // 17. Hospitalizaciones
        hospitalizaciones: '',

        // 18. Transfusiones
        transfusiones: '',

        // 19. Quirúrgicos
        quirurgicos: '',

        // 20. Antecedentes psicopatológicos
        antecedentes_psicopatologicos: '',

        // FICHA CLÍNICA
        motivo_consulta: '',
        ant_familiares_abuelos: '',
        ant_familiares_padres: '',
        ant_familiares_hermanos: '',
        ant_pat_tratamiento_medico: false,
        ant_pat_hemorragias: false,
        ant_pat_intervencion_quirurgica: false,
        ant_pat_reaccion_anestesia: false,
        ant_pat_toma_medicamentos: false,
        ant_pat_alteraciones_cicatrizacion: false,
        ant_pat_alergias: false,
        ant_pat_otros: '',
        ant_no_pat_fuma: false,
        ant_no_pat_bruxismo: false,
        ant_no_pat_bebe: false,
        ant_no_pat_succion_digital: false,
        ant_no_pat_onicofagia: false,
        ant_no_pat_mordisqueo_objetos: false,
        ant_no_pat_queilofagia: false,
        ant_no_pat_otros: '',
        fuma_cantidad: '',
        tratamiento_medico_detalle: '',
        medicamento_72h_detalle: '',
        alergia_medicamento_detalle: '',
        reaccion_anestesia_detalle: '',
        recomendado_por: '',

        // IV. ANTECEDENTES FAMILIARES
        ant_fam_padre: '',
        ant_fam_madre: '',
        ant_fam_hermanos: '',
        ant_fam_dinamica: '',
        ant_fam_estructura: '',

        // V. ANTECEDENTES GENERALES
        ant_generales: '',

        // VI. EXAMEN FISICO
        examen_bio_apetito: '',
        examen_bio_sed: '',
        examen_bio_orina: '',
        examen_bio_deposiciones: '',
        examen_bio_sueno: '',
        examen_bio_alimentacion: '',

        examen_vit_fc: '',
        examen_vit_fr: '',
        examen_vit_temp: '',
        examen_vit_sat: '',
        examen_vit_pa: '',
        examen_vit_peso: '',
        examen_vit_talla: '',
        examen_vit_imc: '',

        examen_aspecto_general: 'Normal',
        examen_piel_faneras: 'Normal',
        examen_cabeza: 'Normal',
        examen_ojos: 'Normal',
        examen_nariz: 'Normal',
        examen_oidos: 'Normal',
        examen_boca: 'Normal',
        examen_cuello: 'Normal',
        examen_torax: 'Normal',
        examen_cardiovascular: 'Normal',
        examen_abdomen: 'Normal',
        examen_urogenital: 'Normal',
        examen_extremidades_columnas: 'Normal',
        examen_neurologicos: 'Normal',
        examen_linfaticos: 'Normal',

        // VII. EXAMEN MENTAL
        examen_mental_apariencia: '',
        examen_mental_lenguaje: '',
        examen_mental_afecto: '',
        examen_mental_pensamiento: '',
        examen_mental_percepcion: '',
        examen_mental_cognicion_conciencia: '',
        examen_mental_cognicion_atencion: '',
        examen_mental_cognicion_memoria: '',
        examen_mental_cognicion_inteligencia: '',
        examen_mental_cognicion_juicio: '',
        examen_mental_funciones_ejecutivas: '',
        examen_mental_conciencia_enfermedad: '',

        // VIII. IMPRESION DIAGNOSTICA
        diagnostico_presuntivo: '',
        diagnostico_cie10: '',
    });

    // Auto-calculate IMC based on Weight (Peso) and Height (Talla)
    useEffect(() => {
        const peso = parseFloat((formData as any).examen_vit_peso);
        let talla = parseFloat((formData as any).examen_vit_talla);
        if (peso && talla) {
            if (talla > 3) { // Assume centimeters, convert to meters
                talla = talla / 100;
            }
            const imc = (peso / (talla * talla)).toFixed(2);
            if ((formData as any).examen_vit_imc !== imc) {
                setFormData(prev => ({ ...prev, examen_vit_imc: imc }));
            }
        } else {
            if ((formData as any).examen_vit_imc !== '') {
                setFormData(prev => ({ ...prev, examen_vit_imc: '' }));
            }
        }
    }, [formData.examen_vit_peso, formData.examen_vit_talla]);

    const handleVolver = () => {
        navigate(`/pacientes`);
    };

    useEffect(() => {
        if (isEditing) {
            fetchPaciente();
        }
    }, [id]);



    const fetchPaciente = async () => {
        try {
            const response = await api.get(`/pacientes/${id}`);
            const data = response.data;
            
            // Flatten fichaClinica into the main object so the form fields can read it
            const flatData = {
                ...data,
                ...(data.fichaClinica || {})
            };
            setFormData(flatData);

            // Handle splitting telefono_celular into code and number
            if (flatData.telefono_celular) {
                const celularStr = String(flatData.telefono_celular);
                const foundCode = countryCodes.find(c => celularStr.startsWith(c.code));
                if (foundCode) {
                    setCountryCode(foundCode.code);
                    setLocalCelular(celularStr.substring(foundCode.code.length));
                } else {
                    setLocalCelular(celularStr);
                }
            }

            // Removed Odontogram Fetching - Moved to Clinical History
        } catch (error) {
            console.error('Error fetching paciente:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Error al cargar el paciente' });
        }
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Combine code and local number
        const fullCelular = `${countryCode}${localCelular}`;

        // Create a clean payload removing null values
        const payload: any = { ...formData };
        Object.entries(payload).forEach(([key, value]) => {
            // Remove empty strings, null and undefined.
            // We prefer not to send empty strings to the backend as they might violate date/int formats.
            if (value === null || value === undefined || value === '') {
                delete payload[key];
            }
        });
        
        // Finalize cell number
        payload.telefono_celular = fullCelular;

        // Add user ID for auditing
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                payload.usuarioId = JSON.parse(userStr).id;
            } catch (e) {
                console.error("Error parsing user for auditing", e);
            }
        }

        // Ensure no insurance fields are sent (security against residual state)
        Object.keys(payload).forEach(key => {
            // Remove any insurance-related field but KEEP 'particularidad'
            if ((key.toLowerCase().includes('particular') && key !== 'particularidad') || 
                key.toLowerCase().includes('seguro')) {
                delete payload[key];
            }
        });
        try {
            let targetId = isEditing ? Number(id) : null;
            if (isEditing) {
                await api.patch(`/pacientes/${id}`, payload);
                await Swal.fire({ icon: 'success', title: 'Actualizado', timer: 1500, showConfirmButton: false });
                handleVolver();
            } else {
                const response = await api.post('/pacientes', payload);
                targetId = response.data.id;
                setNewPatientId(targetId);
                
                await Swal.fire({ 
                    icon: 'success', 
                    title: '¡Ficha Creada!', 
                    text: 'Proceda a la firma digital del paciente.',
                    timer: 2000, 
                    showConfirmButton: false 
                });
                
                // Open Signature Modal
                setShowSignatureModal(true);
            }

            // Removed Odontogram Saving - Moved to Clinical History
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Error al guardar' });
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen mb-20 font-sans text-gray-800 dark:text-gray-100">
            <div className="flex items-center justify-between mb-10 border-b pb-4 border-gray-200 dark:border-gray-700">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-4">
                        <span className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-800">
                            <Users size={32} />
                        </span>
                        <div>
                            {isEditing ? 'Historia Clínica' : 'Nuevo Paciente'}
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                                {isEditing ? 'Edición de filiación y antecedentes médicos' : 'Registro integral de datos y antecedentes médicos'}
                            </p>
                        </div>
                    </h1>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowManual(true)} 
                  className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors self-center mr-2"
                  title="Ayuda / Manual"
                >
                    ?
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                 {/* --- NAVIGATION TABS --- */}
                <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-gray-700/60 rounded-2xl border border-gray-200/50 dark:border-gray-600/50 overflow-x-auto no-scrollbar shadow-inner">
                    {[
                        { id: 'filiacion', label: 'I. Filiación' },
                        { id: 'enfermedad_actual', label: 'II. Enfermedad Actual' },
                        { id: 'antecedentes', label: 'III. Antecedentes' },
                        { id: 'antecedentes_familiares', label: 'IV. Ant. Familiares / Generales' },
                        { id: 'examen_fisico', label: 'V. Examen Físico' },
                        { id: 'examen_mental', label: 'VI. Examen Mental' },
                        { id: 'impresion_diagnostica', label: 'VII. Impresión Diagnóstica' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTabForm(tab.id as any)}
                            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                                activeTabForm === tab.id
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-gray-200/40 dark:ring-gray-700/40'
                                    : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ===================== TAB 1: FILIACIÓN ===================== */}
                {activeTabForm === 'filiacion' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
                        <div className="flex items-center pb-2 border-b border-blue-500/20">
                            <User size={24} className="text-blue-600 mr-4" />
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">I. Datos de Filiación</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Row 1: Dates & Time */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Fecha de Ingreso <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="date" name="fecha_ingreso" value={formData.fecha_ingreso} onChange={handleChange} required className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Hora de Ingreso</label>
                                <div className="relative">
                                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="time" name="hora_ingreso" value={formData.hora_ingreso} onChange={handleChange} className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>


                            {/* Row 2: Nombres y Apellidos */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Nombres <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Ej: Juan" className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Apellido Paterno <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="text" name="paterno" value={formData.paterno} onChange={handleChange} required placeholder="Ej: Pérez" className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Apellido Materno</label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="text" name="materno" value={formData.materno} onChange={handleChange} placeholder="Ej: Gómez" className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>

                            {/* Row 3: Domicilio, Residencia, Celular */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Domicilio (Dirección)</label>
                                <div className="relative">
                                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Ej: Av. Principal #123" className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Tiempo de Residencia en Lima</label>
                                <div className="relative">
                                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="text" name="tiempo_residencia_lima" value={formData.tiempo_residencia_lima} onChange={handleChange} placeholder="Ej: 5 años / Toda la vida" className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Celular <span className="text-red-500">*</span></label>
                                <div className="flex gap-2">
                                    <select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="py-2 px-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans text-sm"
                                    >
                                        {countryCodes.map(c => (
                                            <option key={c.code} value={c.code}>{c.label}</option>
                                        ))}
                                    </select>
                                    <div className="relative flex-1">
                                        <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input 
                                            type="text" 
                                            value={localCelular} 
                                            onChange={(e) => setLocalCelular(e.target.value)} 
                                            required 
                                            placeholder="Ej: 70012345" 
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Row 4: Nacimiento, Edad, Sexo */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Lugar de Nacimiento</label>
                                <div className="relative">
                                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="text" name="lugar_nacimiento" value={formData.lugar_nacimiento} onChange={handleChange} placeholder="Ej: Lima, Perú" className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Fecha de Nacimiento <span className="text-red-500">*</span></label>
                                <div className="relative flex items-center gap-2">
                                    <div className="relative flex-grow">
                                        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} required className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    {formData.fecha_nacimiento && (
                                        <div className="flex flex-col items-center bg-gray-100 dark:bg-gray-700 p-1 px-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 min-w-[50px]">
                                            <span className="text-[8px] font-black text-gray-400 uppercase">Edad</span>
                                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                {(() => {
                                                    const birthDate = new Date(formData.fecha_nacimiento);
                                                    const today = new Date();
                                                    let age = today.getFullYear() - birthDate.getFullYear();
                                                    const m = today.getMonth() - birthDate.getMonth();
                                                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                                                    return age;
                                                })()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Sexo (Género) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <select name="genero" value={formData.genero} onChange={handleChange} required className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                                        <option value="">-- Seleccionar --</option>
                                        <option value="M">Masculino</option>
                                        <option value="F">Femenino</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 5: Raza, Estado Civil, Idioma */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Raza</label>
                                <div className="relative">
                                    <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <select name="raza" value={formData.raza} onChange={handleChange} className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                                        <option value="">-- Seleccionar --</option>
                                        <option value="Blanco">Blanco</option>
                                        <option value="Indigena">Indígena</option>
                                        <option value="Negro">Negro</option>
                                        <option value="Asiatico">Asiático</option>
                                        <option value="Mestizo">Mestizo</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Estado Civil</label>
                                <div className="relative">
                                    <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <select name="estado_civil" value={formData.estado_civil} onChange={handleChange} className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                                        <option value="">-- Seleccionar --</option>
                                        <option value="Soltero">Soltero</option>
                                        <option value="Casado">Casado</option>
                                        <option value="Viudo">Viudo</option>
                                        <option value="Separado">Separado</option>
                                        <option value="Conviviente">Conviviente</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Idioma</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-grow">
                                        <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <select name="idioma" value={formData.idioma} onChange={handleChange} className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                                            <option value="">-- Seleccionar --</option>
                                            <option value="Castellano">Castellano</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    {formData.idioma === 'Otro' && (
                                        <input type="text" name="idioma_otro" value={formData.idioma_otro} onChange={handleChange} placeholder="Especificar" className="w-[120px] px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                    )}
                                </div>
                            </div>

                            {/* Row 6: Religion, Grado, Ocupacion */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Religión</label>
                                <div className="relative">
                                    <Info size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="text" name="religion" value={formData.religion} onChange={handleChange} placeholder="Ej: Católica" className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Grado de Instrucción</label>
                                <div className="relative">
                                    <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <select name="grado_instruccion" value={formData.grado_instruccion} onChange={handleChange} className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                                        <option value="">-- Seleccionar --</option>
                                        <option value="Primaria">Primaria</option>
                                        <option value="Secundaria">Secundaria</option>
                                        <option value="Tecnico">Técnico</option>
                                        <option value="Superior">Superior</option>
                                        <option value="Ninguna">Ninguna</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Ocupación</label>
                                <div className="relative">
                                    <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="text" name="ocupacion" value={formData.ocupacion} onChange={handleChange} placeholder="Ej: Estudiante" className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>

                            {/* Row 7: Email, Vive Con */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Email</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Ej: paciente@gmail.com" className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Vive con</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-grow">
                                        <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <select name="vive_con" value={formData.vive_con} onChange={handleChange} className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                                            <option value="">-- Seleccionar --</option>
                                            <option value="Conyuge">Cónyuge</option>
                                            <option value="Padres">Padres</option>
                                            <option value="Hijos">Hijos</option>
                                            <option value="Padres sustitutos">Padres sustitutos</option>
                                            <option value="Solo">Solo</option>
                                            <option value="Otros parientes">Otros parientes</option>
                                            <option value="Otros">Otros</option>
                                        </select>
                                    </div>
                                    {(formData.vive_con === 'Otros' || formData.vive_con === 'Otros parientes') && (
                                        <input type="text" name="vive_con_otros" value={formData.vive_con_otros} onChange={handleChange} placeholder="Especificar" className="w-[120px] px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">D.N.I. / Pasaporte (Paciente)</label>
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="text" name="dni" value={formData.dni} onChange={handleChange} placeholder="Ej: 1234567" className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>

                            {/* Row 8: Anamnesis, Persona Responsable & Teléfono */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Tipo de Anamnesis</label>
                                <div className="relative">
                                    <Info size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <select name="tipo_anamnesis" value={formData.tipo_anamnesis} onChange={handleChange} className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                                        <option value="">-- Seleccionar --</option>
                                        <option value="Directa">Directa</option>
                                        <option value="Indirecta">Indirecta</option>
                                        <option value="Mixta">Mixta</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Persona Responsable del Paciente</label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="text" name="responsable_nombre" value={formData.responsable_nombre} onChange={handleChange} placeholder="Nombre de la persona a cargo..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Teléfono Responsable</label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="text" name="responsable_telefono" value={formData.responsable_telefono} onChange={handleChange} placeholder="Ej: 70012345 / 4441234" className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===================== TAB 2: ENFERMEDAD ACTUAL ===================== */}
                {activeTabForm === 'enfermedad_actual' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
                        <div className="flex items-center pb-2 border-b border-green-500/20">
                            <Activity size={24} className="text-green-600 mr-4" />
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">II. Enfermedad Actual</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Tiempo de Enfermedad</label>
                                <div className="relative">
                                    <Info size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="text" name="enf_actual_tiempo" value={formData.enf_actual_tiempo} onChange={handleChange} placeholder="Ej: 3 días / 2 semanas" className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">T.E. Actual</label>
                                <div className="relative">
                                    <Info size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="text" name="enf_actual_te" value={formData.enf_actual_te} onChange={handleChange} placeholder="T.E. Actual..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Inicio</label>
                                <div className="relative">
                                    <Info size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="text" name="enf_actual_inicio" value={formData.enf_actual_inicio} onChange={handleChange} placeholder="Ej: Brusco / Insidioso" className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Curso</label>
                                <div className="relative">
                                    <Info size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="text" name="enf_actual_curso" value={formData.enf_actual_curso} onChange={handleChange} placeholder="Ej: Progresivo / Estacionario" className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Síntomas principales</label>
                                <div className="relative">
                                    <Info size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="text" name="enf_actual_sintomas" value={formData.enf_actual_sintomas} onChange={handleChange} placeholder="Ej: Dolor dental agudo, inflamación..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Relato Cronológico</label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Describir el episodio actual, factores agravantes, repercusión social y tratamiento recibido.</p>
                                <textarea name="enf_actual_relato" value={formData.enf_actual_relato} onChange={handleChange} rows={6} placeholder="El paciente relata que hace..." className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none resize-y" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ===================== TAB 3: ANTECEDENTES ===================== */}
                {activeTabForm === 'antecedentes' && (
                    <div className="space-y-6">
                        {/* Infancia psychopathology */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
                            <div className="flex items-center pb-2 border-b border-indigo-500/20">
                                <Users size={24} className="text-indigo-600 mr-4" />
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">1. Rasgos Psicopatológicos de la Infancia</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'rasgo_aislamiento', label: 'Aislamiento' },
                                    { id: 'rasgo_pavor_nocturno', label: 'Pavor nocturno' },
                                    { id: 'rasgo_encopresis', label: 'Encopresis' },
                                    { id: 'rasgo_tricotilomania', label: 'Tricotilomanía' },
                                    { id: 'rasgo_piromania', label: 'Piromanía' },
                                    { id: 'rasgo_succion_dedo', label: 'Succión del dedo' },
                                    { id: 'rasgo_crueldad', label: 'Crueldad' },
                                    { id: 'rasgo_tendencia_mentir', label: 'Tendencia a mentir' },
                                    { id: 'rasgo_tics', label: 'Tics' },
                                    { id: 'rasgo_sonambulismo', label: 'Sonambulismo' },
                                    { id: 'rasgo_enuresis', label: 'Enuresis' },
                                    { id: 'rasgo_somniloquia', label: 'Somniloquia' },
                                    { id: 'rasgo_tartamudez', label: 'Tartamudez' },
                                    { id: 'rasgo_hiperactividad', label: 'Hiperactividad' },
                                    { id: 'rasgo_rabietas', label: 'Rabietas' },
                                    { id: 'rasgo_pesadillas', label: 'Pesadillas' },
                                    { id: 'rasgo_fobia', label: 'Fobia' },
                                    { id: 'rasgo_pica', label: 'Pica' }
                                ].map(item => (
                                    <div key={item.id} className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-900/20 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{item.label}</span>
                                            <div className="flex gap-4">
                                                <label className="flex items-center cursor-pointer group">
                                                    <input type="radio" checked={formData[item.id as keyof typeof formData] === true} onChange={() => setFormData({ ...formData, [item.id]: true })} className="hidden peer" />
                                                    <div className="w-10 h-6 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center px-1 peer-checked:bg-indigo-500 transition-all after:w-4 after:h-4 after:bg-white after:rounded-full peer-checked:after:translate-x-4 shadow-inner"></div>
                                                    <span className="ml-2 text-xs font-black text-gray-400 peer-checked:text-indigo-500">SÍ</span>
                                                </label>
                                                <label className="flex items-center cursor-pointer group">
                                                    <input type="radio" checked={formData[item.id as keyof typeof formData] === false} onChange={() => setFormData({ ...formData, [item.id]: false })} className="hidden peer" />
                                                    <div className="w-10 h-6 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center px-1 peer-checked:bg-gray-400 transition-all after:w-4 after:h-4 after:bg-white after:rounded-full shadow-inner"></div>
                                                    <span className="ml-2 text-xs font-black text-gray-400 peer-checked:text-gray-500">NO</span>
                                                </label>
                                            </div>
                                        </div>
                                        {formData[item.id as keyof typeof formData] === true && (
                                            <div className="relative animate-in fade-in slide-in-from-top-1">
                                                <Edit size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
                                                <input 
                                                    type="text" 
                                                    name={`${item.id}_detalle`}
                                                    value={formData[`${item.id}_detalle` as keyof typeof formData] as string} 
                                                    onChange={handleChange} 
                                                    placeholder="Detalles / Especificar..."
                                                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800 text-gray-800 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" 
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Other general antecedents I */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
                            <div className="flex items-center pb-2 border-b border-indigo-500/20">
                                <User size={24} className="text-indigo-600 mr-4" />
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Otros Antecedentes Personales</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">2. Perinatal</label>
                                    <input type="text" name="perinatal" value={formData.perinatal} onChange={handleChange} placeholder="Detalles de embarazo, parto, lactancia..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">3. Desarrollo psicomotor</label>
                                    <input type="text" name="desarrollo_psicomotor" value={formData.desarrollo_psicomotor} onChange={handleChange} placeholder="Control de esfínteres, marcha, lenguaje..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">4. Escolaridad</label>
                                    <p className="text-xs text-gray-500 mb-1">Edad de ingreso, nivel, rendimiento, materias reprobadas, conducta...</p>
                                    <textarea name="escolaridad" value={formData.escolaridad} onChange={handleChange} rows={2} placeholder="Escolaridad..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-y" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">5. Personalidad Previa</label>
                                    <p className="text-xs text-gray-500 mb-1">Tímido, suspicaz, intolerante a la crítica, desconfiado, inestable, mitómano, etc.</p>
                                    <textarea name="personalidad_previa" value={formData.personalidad_previa} onChange={handleChange} rows={2} placeholder="Rasgos de personalidad..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-y" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">6. Historia Laboral</label>
                                    <input type="text" name="historia_laboral" value={formData.historia_laboral} onChange={handleChange} placeholder="Trabajos anteriores, estabilidad, conflictos..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">7. Hábitos o intereses</label>
                                    <input type="text" name="habitos_intereses" value={formData.habitos_intereses} onChange={handleChange} placeholder="Pasatiempos, lectura, deportes..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                            </div>
                        </div>
                        {/* Antecedentes II content merged natively within the same container block */}
                        {/* Harmful habits table */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
                            <div className="flex items-center pb-2 border-b border-purple-500/20">
                                <Wind size={24} className="text-purple-600 mr-4" />
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">8. Hábitos Nocivos</h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="py-3 px-4 font-bold text-sm text-gray-600 dark:text-gray-400">Sustancia</th>
                                            <th className="py-3 px-4 font-bold text-sm text-gray-600 dark:text-gray-400">Consumo</th>
                                            <th className="py-3 px-4 font-bold text-sm text-gray-600 dark:text-gray-400">Frecuencia</th>
                                            <th className="py-3 px-4 font-bold text-sm text-gray-600 dark:text-gray-400">Cantidad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {[
                                            { key: 'tabaco', name: 'Tabaco' },
                                            { key: 'alcohol', name: 'Alcohol' },
                                            { key: 'drogas', name: 'Drogas' },
                                            { key: 'juegos', name: 'Juegos' }
                                        ].map(item => (
                                            <tr key={item.key}>
                                                <td className="py-3 px-4 text-sm font-bold text-gray-800 dark:text-white">{item.name}</td>
                                                <td className="py-3 px-4">
                                                    <input type="text" name={`habito_${item.key}_consumo`} value={formData[`habito_${item.key}_consumo` as keyof typeof formData] as string} onChange={handleChange} placeholder="¿Consume?" className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                                </td>
                                                <td className="py-3 px-4">
                                                    <input type="text" name={`habito_${item.key}_frecuencia`} value={formData[`habito_${item.key}_frecuencia` as keyof typeof formData] as string} onChange={handleChange} placeholder="Frecuencia..." className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                                </td>
                                                <td className="py-3 px-4">
                                                    <input type="text" name={`habito_${item.key}_cantidad`} value={formData[`habito_${item.key}_cantidad` as keyof typeof formData] as string} onChange={handleChange} placeholder="Cantidad..." className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Social life sexual stressors economically obstetric */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
                            <div className="flex items-center pb-2 border-b border-purple-500/20">
                                <Info size={24} className="text-purple-600 mr-4" />
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Historial Social, Sexual y Obstétrico</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">9. Recreación y Vida social</label>
                                    <input type="text" name="recreacion_vida_social" value={formData.recreacion_vida_social} onChange={handleChange} placeholder="Amigos, salidas, actividades grupales..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">10. Vida Sexual</label>
                                    <input type="text" name="vida_sexual" value={formData.vida_sexual} onChange={handleChange} placeholder="Inicio, orientación, dificultades..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">11. Eventos importantes y estresores psicosociales</label>
                                    <input type="text" name="estresores_psicosociales" value={formData.estresores_psicosociales} onChange={handleChange} placeholder="Muertes de familiares, divorcio, estrés laboral..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">12. Antecedentes Socio-culturales y económicos</label>
                                    <input type="text" name="antecedentes_socio_culturales" value={formData.antecedentes_socio_culturales} onChange={handleChange} placeholder="Clase socioeconómica, vivienda, nivel de cultura..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Actitud frente a la enfermedad</label>
                                    <input type="text" name="actitud_enfermedad" value={formData.actitud_enfermedad} onChange={handleChange} placeholder="Negación, aceptación, preocupación excesiva..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">13. Antecedentes Gineco-obstétricos</label>
                                    <input type="text" name="antecedentes_gineco_obstetricos" value={formData.antecedentes_gineco_obstetricos} onChange={handleChange} placeholder="Menarquía, ciclos, embarazos, partos, abortos..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Medical conditions checkboxes */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
                            <div className="flex items-center pb-2 border-b border-purple-500/20">
                                <Activity size={24} className="text-purple-600 mr-4" />
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">14. Antecedentes Patológicos (Enfermedades no psiquiátricas)</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'patologia_diabetes', label: 'Diabetes Mellitus' },
                                    { id: 'patologia_post_parto', label: 'Post parto' },
                                    { id: 'patologia_cardiovascular_hta', label: 'Enfermedad Cardiovascular (HTA)' },
                                    { id: 'patologia_inmunodeficiencia_vih', label: 'Inmunodeficiencia (VIH)' },
                                    { id: 'patologia_hepatica', label: 'Enfermedad Hepática' },
                                    { id: 'patologia_renal', label: 'Enfermedad Renal' },
                                    { id: 'patologia_neurologica', label: 'Enfermedad Crónica neurológica – neuromuscular' },
                                    { id: 'patologia_metabolica', label: 'Enfermedades Metabólicas' },
                                    { id: 'patologia_embarazo', label: 'Embarazo', detailId: 'patologia_embarazo_trimestre', placeholder: 'Especificar Trimestre' },
                                    { id: 'patologia_cancer', label: 'Cáncer' }
                                ].map(item => (
                                    <div key={item.id} className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100/50 dark:border-purple-900/20 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{item.label}</span>
                                            <div className="flex gap-4">
                                                <label className="flex items-center cursor-pointer group">
                                                    <input type="radio" checked={formData[item.id as keyof typeof formData] === true} onChange={() => setFormData({ ...formData, [item.id]: true })} className="hidden peer" />
                                                    <div className="w-10 h-6 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center px-1 peer-checked:bg-purple-500 transition-all after:w-4 after:h-4 after:bg-white after:rounded-full peer-checked:after:translate-x-4 shadow-inner"></div>
                                                    <span className="ml-2 text-xs font-black text-gray-400 peer-checked:text-purple-500">SÍ</span>
                                                </label>
                                                <label className="flex items-center cursor-pointer group">
                                                    <input type="radio" checked={formData[item.id as keyof typeof formData] === false} onChange={() => setFormData({ ...formData, [item.id]: false })} className="hidden peer" />
                                                    <div className="w-10 h-6 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center px-1 peer-checked:bg-gray-400 transition-all after:w-4 after:h-4 after:bg-white after:rounded-full shadow-inner"></div>
                                                    <span className="ml-2 text-xs font-black text-gray-400 peer-checked:text-gray-500">NO</span>
                                                </label>
                                            </div>
                                        </div>
                                        {item.detailId && formData[item.id as keyof typeof formData] === true && (
                                            <div className="relative animate-in fade-in slide-in-from-top-1">
                                                <Edit size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                                                <input 
                                                    type="text" 
                                                    name={item.detailId} 
                                                    value={formData[item.detailId as keyof typeof formData] as string} 
                                                    onChange={handleChange} 
                                                    placeholder={item.placeholder}
                                                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 text-gray-800 dark:text-white outline-none focus:ring-4 focus:ring-purple-500/10 transition-all font-medium" 
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Otros antecedentes patológicos</label>
                                    <input type="text" name="patologia_otros" value={formData.patologia_otros} onChange={handleChange} placeholder="Especificar otras patologías..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Traumatismos allergies surgeries and psicopatológicos */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
                            <div className="flex items-center pb-2 border-b border-purple-500/20">
                                <Info size={24} className="text-purple-600 mr-4" />
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Historial Clínico y Psicológico</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">15. Traumatismo y Accidentes</label>
                                    <input type="text" name="traumatismo_accidentes" value={formData.traumatismo_accidentes} onChange={handleChange} placeholder="Fracturas, golpes fuertes, accidentes graves..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">16. Alergias</label>
                                    <input type="text" name="alergias_ficha" value={formData.alergias_ficha} onChange={handleChange} placeholder="Alergias generales (polvo, ácaros, alimentos)..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">17. Hospitalizaciones</label>
                                    <input type="text" name="hospitalizaciones" value={formData.hospitalizaciones} onChange={handleChange} placeholder="Fechas y motivos de hospitalización..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">18. Transfusiones</label>
                                    <input type="text" name="transfusiones" value={formData.transfusiones} onChange={handleChange} placeholder="Fechas, motivos, reacciones..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">19. Quirúrgicos</label>
                                    <input type="text" name="quirurgicos" value={formData.quirurgicos} onChange={handleChange} placeholder="Operaciones previas, anestesia, complicaciones..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">20. Antecedentes psicopatológicos</label>
                                    <input type="text" name="antecedentes_psicopatologicos" value={formData.antecedentes_psicopatologicos} onChange={handleChange} placeholder="Tratamiento psiquiátrico previo, ansiedad, depresión..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===================== TAB 4: ANTECEDENTES FAMILIARES & GENERALES ===================== */}
                {activeTabForm === 'antecedentes_familiares' && (
                    <div className="space-y-6">
                        {/* IV. ANTECEDENTES FAMILIARES */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 animate-slide-up space-y-6">
                            <div className="flex items-center pb-2 border-b border-indigo-500/20">
                                <Users size={24} className="text-indigo-600 mr-4" />
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">IV. Antecedentes Familiares</h2>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400">1. Familia de Origen:</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Padre</label>
                                        <input 
                                            type="text" 
                                            name="ant_fam_padre" 
                                            value={formData.ant_fam_padre} 
                                            onChange={handleChange} 
                                            placeholder="Detalles sobre el padre (edad, salud, etc.)" 
                                            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Madre</label>
                                        <input 
                                            type="text" 
                                            name="ant_fam_madre" 
                                            value={formData.ant_fam_madre} 
                                            onChange={handleChange} 
                                            placeholder="Detalles sobre la madre (edad, salud, etc.)" 
                                            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Hermanos</label>
                                        <input 
                                            type="text" 
                                            name="ant_fam_hermanos" 
                                            value={formData.ant_fam_hermanos} 
                                            onChange={handleChange} 
                                            placeholder="Detalles sobre hermanos (número, estado, etc.)" 
                                            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                        2. Dinámica Familiar <span className="text-xs font-normal text-gray-400">(Tipo de familia, progenitores, hermanos, ocupación de los familiares)</span>
                                    </label>
                                    <textarea 
                                        name="ant_fam_dinamica" 
                                        value={formData.ant_fam_dinamica} 
                                        onChange={handleChange} 
                                        rows={3} 
                                        placeholder="Describa la dinámica y relaciones familiares..." 
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-y text-sm" 
                                    />
                                </div>
                                <div className="pt-2">
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                        a. Estructura Familiar <span className="text-xs font-normal text-gray-400">(Árbol genealógico, genograma, etc.)</span>
                                    </label>
                                    <textarea 
                                        name="ant_fam_estructura" 
                                        value={formData.ant_fam_estructura} 
                                        onChange={handleChange} 
                                        rows={3} 
                                        placeholder="Detalles sobre el genograma o árbol familiar..." 
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-y text-sm" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* V. ANTECEDENTES GENERALES */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
                            <div className="flex items-center pb-2 border-b border-blue-500/20">
                                <Info size={24} className="text-blue-600 mr-4" />
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">V. Antecedentes Generales</h2>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                    Condiciones de Vida <span className="text-xs font-normal text-gray-400">(Tipo de vivienda, material, servicios básicos, mascotas, etc.)</span>
                                </label>
                                <textarea 
                                    name="ant_generales" 
                                    value={formData.ant_generales} 
                                    onChange={handleChange} 
                                    rows={3} 
                                    placeholder="Describa el tipo de vivienda, acceso a servicios básicos, presencia de mascotas..." 
                                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm" 
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ===================== TAB 5: EXAMEN FÍSICO ===================== */}
                {activeTabForm === 'examen_fisico' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 animate-slide-up space-y-6">
                            <div className="flex items-center pb-2 border-b border-purple-500/20">
                                <Activity size={24} className="text-purple-600 mr-4" />
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">VI. Examen Físico</h2>
                            </div>

                            {/* 1. Funciones Biológicas */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400">1. Funciones Biológicas:</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Apetito</label>
                                        <input type="text" name="examen_bio_apetito" value={formData.examen_bio_apetito} onChange={handleChange} placeholder="Ej: Conservado" className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Sed</label>
                                        <input type="text" name="examen_bio_sed" value={formData.examen_bio_sed} onChange={handleChange} placeholder="Ej: Normal" className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Orina</label>
                                        <input type="text" name="examen_bio_orina" value={formData.examen_bio_orina} onChange={handleChange} placeholder="Ej: Conservado" className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Deposiciones</label>
                                        <input type="text" name="examen_bio_deposiciones" value={formData.examen_bio_deposiciones} onChange={handleChange} placeholder="Ej: Conservado" className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Sueño</label>
                                        <input type="text" name="examen_bio_sueno" value={formData.examen_bio_sueno} onChange={handleChange} placeholder="Ej: 8 horas / Normal" className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Alimentación Diaria</label>
                                    <textarea name="examen_bio_alimentacion" value={formData.examen_bio_alimentacion} onChange={handleChange} rows={2} placeholder="Describa la dieta diaria del paciente..." className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y text-sm" />
                                </div>
                            </div>

                            {/* 2. Funciones Vitales */}
                            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400">2. Funciones Vitales:</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">FC (lpm)</label>
                                        <input type="text" name="examen_vit_fc" value={formData.examen_vit_fc} onChange={handleChange} placeholder="Ej: 72" className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">FR (rpm)</label>
                                        <input type="text" name="examen_vit_fr" value={formData.examen_vit_fr} onChange={handleChange} placeholder="Ej: 16" className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">T° (°C)</label>
                                        <input type="text" name="examen_vit_temp" value={formData.examen_vit_temp} onChange={handleChange} placeholder="Ej: 36.5" className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">SAT (%)</label>
                                        <input type="text" name="examen_vit_sat" value={formData.examen_vit_sat} onChange={handleChange} placeholder="Ej: 98" className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">PA (mmHg)</label>
                                        <input type="text" name="examen_vit_pa" value={formData.examen_vit_pa} onChange={handleChange} placeholder="Ej: 120/80" className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Peso (kg)</label>
                                        <input type="text" name="examen_vit_peso" value={formData.examen_vit_peso} onChange={handleChange} placeholder="Ej: 70" className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Talla (m/cm)</label>
                                        <input type="text" name="examen_vit_talla" value={formData.examen_vit_talla} onChange={handleChange} placeholder="Ej: 1.70" className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">IMC (Auto)</label>
                                        <input type="text" name="examen_vit_imc" value={formData.examen_vit_imc} readOnly placeholder="Auto" className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-purple-600 dark:text-purple-400 font-bold outline-none cursor-not-allowed" />
                                    </div>
                                </div>
                            </div>

                            {/* Aspectos Generales y Sistemas */}
                            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400">Aspectos Generales y Sistemas:</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">3. Aspecto General</label>
                                        <textarea name="examen_aspecto_general" value={formData.examen_aspecto_general} onChange={handleChange} rows={2} placeholder="Describa el aspecto general..." className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">4. Piel y Faneras</label>
                                        <textarea name="examen_piel_faneras" value={formData.examen_piel_faneras} onChange={handleChange} rows={2} placeholder="Describa piel y faneras..." className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">5. Cabeza</label>
                                        <textarea name="examen_cabeza" value={formData.examen_cabeza} onChange={handleChange} rows={2} placeholder="Describa la cabeza..." className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">6. Ojos</label>
                                        <textarea name="examen_ojos" value={formData.examen_ojos} onChange={handleChange} rows={2} placeholder="Describa los ojos..." className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">7. Nariz</label>
                                        <textarea name="examen_nariz" value={formData.examen_nariz} onChange={handleChange} rows={2} placeholder="Describa la nariz..." className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">8. Oídos</label>
                                        <textarea name="examen_oidos" value={formData.examen_oidos} onChange={handleChange} rows={2} placeholder="Describa los oídos..." className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">9. Boca</label>
                                        <textarea name="examen_boca" value={formData.examen_boca} onChange={handleChange} rows={2} placeholder="Describa la boca..." className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">10. Cuello</label>
                                        <textarea name="examen_cuello" value={formData.examen_cuello} onChange={handleChange} rows={2} placeholder="Describa el cuello..." className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">11. Tórax</label>
                                        <textarea name="examen_torax" value={formData.examen_torax} onChange={handleChange} rows={2} placeholder="Describa el tórax..." className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">12. Cardiovascular</label>
                                        <textarea name="examen_cardiovascular" value={formData.examen_cardiovascular} onChange={handleChange} rows={2} placeholder="Describa el sistema cardiovascular..." className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">13. Abdomen</label>
                                        <textarea name="examen_abdomen" value={formData.examen_abdomen} onChange={handleChange} rows={2} placeholder="Describa el abdomen..." className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">14. Urogenital</label>
                                        <textarea name="examen_urogenital" value={formData.examen_urogenital} onChange={handleChange} rows={2} placeholder="Describa el sistema urogenital..." className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">15. Extremidades y Columnas</label>
                                        <textarea name="examen_extremidades_columnas" value={formData.examen_extremidades_columnas} onChange={handleChange} rows={2} placeholder="Describa extremidades y columna..." className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">16. Neurológicos</label>
                                        <textarea name="examen_neurologicos" value={formData.examen_neurologicos} onChange={handleChange} rows={2} placeholder="Describa examen neurológico..." className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">17. Linfáticos</label>
                                        <textarea name="examen_linfaticos" value={formData.examen_linfaticos} onChange={handleChange} rows={2} placeholder="Describa sistema linfático..." className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===================== TAB 7: EXAMEN MENTAL ===================== */}
                {activeTabForm === 'examen_mental' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 animate-slide-up space-y-6">
                            <div className="flex items-center pb-2 border-b border-purple-500/20">
                                <Activity size={24} className="text-purple-600 mr-4" />
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider font-sans font-bold">VI. Examen Mental</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                        1. Apariencia General y Comportamiento 
                                        <span className="text-xs font-normal text-gray-400 block mt-0.5">(Movimientos, posturas, estereotipas, tics, manierismos, negativismo, ecopraxia, relación con el entrevistador, coopera durante la entrevista o no lo hace)</span>
                                    </label>
                                    <textarea 
                                        name="examen_mental_apariencia" 
                                        value={formData.examen_mental_apariencia} 
                                        onChange={handleChange} 
                                        rows={3} 
                                        placeholder="Describa la apariencia y el comportamiento general..." 
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y text-sm" 
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">2. Lenguaje</label>
                                    <textarea 
                                        name="examen_mental_lenguaje" 
                                        value={formData.examen_mental_lenguaje} 
                                        onChange={handleChange} 
                                        rows={2} 
                                        placeholder="Describa el lenguaje (tono, fluidez, coherencia, velocidad)..." 
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y text-sm" 
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                        3. Afecto
                                        <span className="text-xs font-normal text-gray-400 block mt-0.5">(Síntomas depresivos, maniacos, irritabilidad, agresividad, disociación ideo-afectiva, aplanamiento, otros)</span>
                                    </label>
                                    <textarea 
                                        name="examen_mental_afecto" 
                                        value={formData.examen_mental_afecto} 
                                        onChange={handleChange} 
                                        rows={3} 
                                        placeholder="Describa el estado afectivo y de ánimo..." 
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y text-sm" 
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">4. Pensamiento</label>
                                    <textarea 
                                        name="examen_mental_pensamiento" 
                                        value={formData.examen_mental_pensamiento} 
                                        onChange={handleChange} 
                                        rows={3} 
                                        placeholder="Describa el curso, forma y contenido del pensamiento (ideas delirantes, obsesiones)..." 
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y text-sm" 
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                        5. Percepción
                                        <span className="text-xs font-normal text-gray-400 block mt-0.5">(Ilusiones, alucinaciones visuales, olfativas, auditivas, táctiles, cinestésicas, cenestésicas, macropsias, micropsias, otros)</span>
                                    </label>
                                    <textarea 
                                        name="examen_mental_percepcion" 
                                        value={formData.examen_mental_percepcion} 
                                        onChange={handleChange} 
                                        rows={3} 
                                        placeholder="Describa alteraciones de la percepción..." 
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y text-sm" 
                                    />
                                </div>

                                {/* Funciones Cognoscitivas Block */}
                                <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-150 dark:border-gray-700">
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">6. Funciones Cognoscitivas</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                                                Conciencia y Orientación
                                                <span className="text-[10px] font-normal text-gray-400 block mt-0.5 font-sans capitalize">(Clara, obnubilación, confusión, estupor, coma, estrechamiento del campo de la conciencia, otros)</span>
                                            </label>
                                            <textarea 
                                                name="examen_mental_cognicion_conciencia" 
                                                value={formData.examen_mental_cognicion_conciencia} 
                                                onChange={handleChange} 
                                                rows={2} 
                                                placeholder="Conciencia y orientación..." 
                                                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" 
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                                                Atención
                                                <span className="text-[10px] font-normal text-gray-400 block mt-0.5 font-sans capitalize">(Hipoprosexia, hiperprosexia, distractibilidad, otras)</span>
                                            </label>
                                            <textarea 
                                                name="examen_mental_cognicion_atencion" 
                                                value={formData.examen_mental_cognicion_atencion} 
                                                onChange={handleChange} 
                                                rows={2} 
                                                placeholder="Atención..." 
                                                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" 
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                                                Memoria
                                                <span className="text-[10px] font-normal text-gray-400 block mt-0.5 font-sans capitalize">(Reciente y remota, amnesia, confabulación, falsos reconocimientos, otros)</span>
                                            </label>
                                            <textarea 
                                                name="examen_mental_cognicion_memoria" 
                                                value={formData.examen_mental_cognicion_memoria} 
                                                onChange={handleChange} 
                                                rows={2} 
                                                placeholder="Memoria..." 
                                                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" 
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                                                Inteligencia
                                                <span className="text-[10px] font-normal text-gray-400 block mt-0.5 font-sans capitalize">(Estimación clínica, rasgos de deterioro, capacidad de abstracción)</span>
                                            </label>
                                            <textarea 
                                                name="examen_mental_cognicion_inteligencia" 
                                                value={formData.examen_mental_cognicion_inteligencia} 
                                                onChange={handleChange} 
                                                rows={2} 
                                                placeholder="Inteligencia..." 
                                                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" 
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                                                Juicio
                                                <span className="text-[10px] font-normal text-gray-400 block mt-0.5 font-sans capitalize">(Conservado, parcial, no tiene juicio de enfermedad)</span>
                                            </label>
                                            <textarea 
                                                name="examen_mental_cognicion_juicio" 
                                                value={formData.examen_mental_cognicion_juicio} 
                                                onChange={handleChange} 
                                                rows={2} 
                                                placeholder="Juicio..." 
                                                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 pt-4 border-t border-gray-150 dark:border-gray-700">
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">7. Funciones Ejecutivas</label>
                                    <textarea 
                                        name="examen_mental_funciones_ejecutivas" 
                                        value={formData.examen_mental_funciones_ejecutivas} 
                                        onChange={handleChange} 
                                        rows={2} 
                                        placeholder="Describa la planificación, toma de decisiones, control inhibitorio..." 
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y text-sm" 
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">8. Conciencia de la Enfermedad</label>
                                    <textarea 
                                        name="examen_mental_conciencia_enfermedad" 
                                        value={formData.examen_mental_conciencia_enfermedad} 
                                        onChange={handleChange} 
                                        rows={2} 
                                        placeholder="Paciente reconoce su estado de salud/enfermedad y necesidad de tratamiento..." 
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y text-sm" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===================== TAB 8: IMPRESIÓN DIAGNÓSTICA ===================== */}
                {activeTabForm === 'impresion_diagnostica' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 animate-slide-up space-y-6">
                            <div className="flex items-center pb-2 border-b border-green-500/20">
                                <Stethoscope size={24} className="text-green-600 mr-4" />
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider font-sans font-bold">VII. Impresión Diagnóstica</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Diagnóstico Presuntivo</label>
                                    <textarea 
                                        name="diagnostico_presuntivo" 
                                        value={formData.diagnostico_presuntivo} 
                                        onChange={handleChange} 
                                        rows={3} 
                                        placeholder="Escriba el o los diagnósticos presuntivos..." 
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none resize-y text-sm font-semibold" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Código CIE 10</label>
                                    <input 
                                        type="text" 
                                        name="diagnostico_cie10" 
                                        value={formData.diagnostico_cie10} 
                                        onChange={handleChange} 
                                        placeholder="Ej: F32.9 / F41.1" 
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none text-sm font-bold uppercase" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ACCIONES --- */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-t border-gray-200 dark:border-gray-700 flex justify-center gap-6 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                    <button 
                        type="submit" 
                        className="px-10 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2 transform hover:-translate-y-1 transition-all shadow-lg active:scale-95"
                    >
                        <Save size={20} />
                        {isEditing ? 'Actualizar' : 'Guardar'}
                    </button>
                    <button 
                        type="button" 
                        onClick={handleVolver} 
                        className="px-10 py-3 rounded-xl bg-gray-500 hover:bg-gray-600 text-white font-bold flex items-center gap-2 transform hover:-translate-y-1 transition-all shadow-lg active:scale-95"
                    >
                        <X size={20} />
                        Cancelar
                    </button>
                </div>
            </form>

            <SignatureModal 
                isOpen={showSignatureModal} 
                onClose={() => {
                    setShowSignatureModal(false);
                    handleVolver();
                }} 
                documentoId={id ? parseInt(id) : (newPatientId || 0)}
                tipoDocumento="paciente"
                rolFirmante="paciente"
            />


            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Ayuda"
                sections={manualSections}
            />
        </div>
    );
};

export default PacienteForm;
