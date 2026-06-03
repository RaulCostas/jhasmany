import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import type { Paciente } from '../types';
import { formatDate } from '../utils/dateUtils';
import { Heart, User, Stethoscope, Shield, Info, Activity, Calendar, MapPin, Phone, Users, FileText, Briefcase } from 'lucide-react';
import ManualModal, { type ManualSection } from './ManualModal';

interface PacienteTabFichaProps {
    tipo: 'particular' | 'seguro';
}

const PacienteTabFicha: React.FC<PacienteTabFichaProps> = ({ tipo }) => {
    const { id } = useParams<{ id: string }>();
    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [loading, setLoading] = useState(true);
    const [showManual, setShowManual] = useState(false);
    const [activeTab, setActiveTab] = useState<'filiacion' | 'enfermedad_actual' | 'antecedentes' | 'antecedentes_familiares' | 'examen_fisico' | 'examen_mental' | 'impresion_diagnostica'>('filiacion');

    const manualSections: ManualSection[] = [
        {
            title: 'Ficha Clínica del Paciente',
            content: 'Navegue a través de las pestañas para ver la filiación, enfermedad actual, antecedentes (Antecedentes I y II), antecedentes familiares y generales, examen físico, examen mental e impresión diagnóstica.'
        },
        {
            title: 'Antecedentes Importantes',
            content: 'Las condiciones médicas o rasgos psicopatológicos positivos se muestran con colores de alerta para llamar la atención del clínico.'
        },
        {
            title: 'Editar Información',
            content: 'Si desea modificar los datos de cualquier sección, haga clic en el botón "Editar" en la parte superior del perfil.'
        }
    ];

    useEffect(() => {
        if (!id) return;
        const url = tipo === 'particular' ? `/pacientes/${id}` : `/pacientes-seguro/${id}`;
        api.get(url)
            .then(r => setPaciente(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id, tipo]);

    if (loading) return (
        <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!paciente) return <div className="text-center py-10 text-gray-400">No se pudo cargar la ficha.</div>;

    const ficha = paciente.fichaClinica;

    const calcEdad = (fecha?: string) => {
        if (!fecha) return '—';
        const hoy = new Date(); const nac = new Date(fecha);
        let edad = hoy.getFullYear() - nac.getFullYear();
        const m = hoy.getMonth() - nac.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
        return `${edad} años`;
    };

    const Field = ({ label, value }: { label: string; value?: string | number | null | boolean }) => (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</span>
            <span className="text-sm text-gray-800 dark:text-gray-100 font-medium border-b border-dashed border-gray-200 dark:border-gray-700 pb-1 min-h-[22px]">
                {value === true ? 'SÍ' : value === false ? 'NO' : (value ?? <span className="text-gray-400 font-normal italic">—</span>)}
            </span>
        </div>
    );

    const FieldCard = ({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) => (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200/80 dark:border-gray-700/80">
            <div className="flex items-center gap-2 mb-2 text-gray-400 dark:text-gray-500">
                {icon}
                <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200 font-medium whitespace-pre-wrap">
                {value || <span className="text-gray-400 font-normal italic">Sin registrar</span>}
            </p>
        </div>
    );

    const CheckBadge = ({ label, value }: { label: string; value?: boolean }) => (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${value
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
            : 'bg-gray-50 dark:bg-gray-700/30 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-gray-700/50'
        }`}>
            <span>{value ? '☑' : '☐'}</span> {label}
        </div>
    );

    const traits = [
        { key: 'rasgo_aislamiento', label: 'Aislamiento' },
        { key: 'rasgo_pavor_nocturno', label: 'Pavor Nocturno' },
        { key: 'rasgo_encopresis', label: 'Encopresis' },
        { key: 'rasgo_tricotilomania', label: 'Tricotilomanía' },
        { key: 'rasgo_piromania', label: 'Piromanía' },
        { key: 'rasgo_succion_dedo', label: 'Succión del dedo' },
        { key: 'rasgo_crueldad', label: 'Crueldad' },
        { key: 'rasgo_tendencia_mentir', label: 'Tendencia a mentir' },
        { key: 'rasgo_tics', label: 'Tics' },
        { key: 'rasgo_sonambulismo', label: 'Sonambulismo' },
        { key: 'rasgo_enuresis', label: 'Enuresis' },
        { key: 'rasgo_somniloquia', label: 'Somniloquia' },
        { key: 'rasgo_tartamudez', label: 'Tartamudez' },
        { key: 'rasgo_hiperactividad', label: 'Hiperactividad' },
        { key: 'rasgo_rabietas', label: 'Rabietas' },
        { key: 'rasgo_pesadillas', label: 'Pesadillas' },
        { key: 'rasgo_fobia', label: 'Fobias' },
        { key: 'rasgo_pica', label: 'Pica' }
    ];

    return (
        <div className="space-y-6">
            {/* Main Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-1 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Heart size={22} className="text-blue-500" />
                        Ficha Médica del Paciente
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Datos de filiación, antecedentes, examen físico, mental e impresión diagnóstica.
                    </p>
                </div>
                <button
                    onClick={() => setShowManual(true)}
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm ml-2 shrink-0 md:mt-0 mt-3"
                    title="Ayuda / Manual"
                >
                    ?
                </button>
            </div>

            {/* Header / Tabs */}
            <div className="flex justify-between items-center px-1">
                {/* Navigation Tabs */}
                <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-gray-700/60 rounded-xl border border-gray-200/50 dark:border-gray-600/50 overflow-x-auto no-scrollbar shadow-inner max-w-full">
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
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`py-2 px-3.5 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200/20'
                                    : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-200/40 dark:hover:bg-gray-700/40'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="content-card bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 transition-colors">
                
                {/* ===================== TAB 1: FILIACIÓN ===================== */}
                {activeTab === 'filiacion' && (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2">
                                <User size={16} className="text-blue-500" /> Datos Personales
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <Field label="Ap. Paterno" value={paciente.paterno} />
                                <Field label="Ap. Materno" value={paciente.materno} />
                                <Field label="Nombres" value={paciente.nombre} />
                                <Field label="Fecha Nacimiento" value={paciente.fecha_nacimiento ? `${formatDate(paciente.fecha_nacimiento)} (${calcEdad(paciente.fecha_nacimiento)})` : undefined} />
                                <Field label="Lugar de Nacimiento" value={paciente.lugar_nacimiento} />
                                <Field label="Sexo (Género)" value={paciente.genero === 'M' ? 'Masculino' : paciente.genero === 'F' ? 'Femenino' : paciente.genero} />
                                <Field label="D.N.I. / Documento" value={paciente.dni} />
                                <Field label="Raza" value={paciente.raza} />
                                <Field label="Estado Civil" value={paciente.estado_civil} />
                                <Field label="Idioma" value={paciente.idioma === 'Otro' ? `Otro (${paciente.idioma_otro || '—'})` : paciente.idioma} />
                                <Field label="Religión" value={paciente.religion} />
                                <Field label="Grado de Instrucción" value={paciente.grado_instruccion} />
                                <Field label="Ocupación" value={paciente.ocupacion} />
                                <Field label="Vive con" value={paciente.vive_con === 'Otros' || paciente.vive_con === 'Otros parientes' ? `${paciente.vive_con} (${paciente.vive_con_otros || '—'})` : paciente.vive_con} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2">
                                <MapPin size={16} className="text-blue-500" /> Domicilio y Contacto
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <Field label="Domicilio (Dirección)" value={paciente.direccion} />
                                </div>
                                <Field label="Tiempo de Residencia en Lima" value={paciente.tiempo_residencia_lima} />
                                <Field label="Celular" value={paciente.telefono_celular} />
                                <Field label="Email" value={paciente.email} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2">
                                <Calendar size={16} className="text-blue-500" /> Información de Ingreso y Responsable
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <Field label="Fecha Ingreso" value={paciente.fecha_ingreso ? formatDate(paciente.fecha_ingreso) : undefined} />
                                <Field label="Hora Ingreso" value={paciente.hora_ingreso} />
                                <Field label="Tipo de Anamnesis" value={paciente.tipo_anamnesis} />
                                <Field label="Persona Responsable" value={paciente.responsable_nombre || paciente.tutor_nombre} />
                                <Field label="Teléfono Responsable" value={paciente.responsable_telefono || paciente.tutor_dni} />
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mt-6">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-2">Observaciones Generales</span>
                            <p className="text-sm text-gray-800 dark:text-gray-200 font-medium whitespace-pre-wrap">{paciente.observaciones || <span className="text-gray-400 font-normal italic">Ninguna</span>}</p>
                        </div>
                    </div>
                )}

                {/* ===================== TAB 2: ENFERMEDAD ACTUAL ===================== */}
                {activeTab === 'enfermedad_actual' && (
                    !ficha ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400">
                            <Stethoscope size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No se ha registrado ficha médica.</p>
                            <p className="text-sm mt-1">Edite el paciente para registrar la Enfermedad Actual.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2">
                                <Activity size={16} className="text-blue-500" /> II. Enfermedad Actual
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Field label="Tiempo de Enfermedad" value={ficha.enf_actual_tiempo} />
                                <Field label="Tiempo de Evolución (TE actual)" value={ficha.enf_actual_te} />
                                <Field label="Inicio" value={ficha.enf_actual_inicio} />
                                <Field label="Curso" value={ficha.enf_actual_curso} />
                            </div>
                            <div>
                                <Field label="Síntomas Principales" value={ficha.enf_actual_sintomas} />
                            </div>
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 block mb-2">Relato Cronológico</span>
                                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                                    {ficha.enf_actual_relato || <span className="text-gray-400 font-normal italic">Sin relato registrado</span>}
                                </p>
                            </div>
                        </div>
                    )
                )}

                {/* ===================== TAB 3: ANTECEDENTES ===================== */}
                {activeTab === 'antecedentes' && (
                    !ficha ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400">
                            <Stethoscope size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No se ha registrado ficha médica.</p>
                            <p className="text-sm mt-1">Edite el paciente para registrar los Antecedentes.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2">
                                    <Heart size={16} className="text-red-500" /> 1. Rasgos Psicopatológicos de la Infancia
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {traits.map(trait => {
                                        const isPresent = (ficha as any)[trait.key] === true;
                                        const detail = (ficha as any)[`${trait.key}_detalle`] as string;
                                        return (
                                            <div key={trait.key} className={`p-3 rounded-xl border transition-all duration-200 ${
                                                isPresent 
                                                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50' 
                                                    : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-700/50 opacity-60'
                                            }`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-xs font-bold ${isPresent ? 'text-amber-800 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        {trait.label}
                                                    </span>
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                                        isPresent ? 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                                    }`}>
                                                        {isPresent ? 'SÍ' : 'NO'}
                                                    </span>
                                                </div>
                                                {isPresent && detail && (
                                                    <p className="text-xs text-gray-600 dark:text-gray-300 italic border-t border-amber-200/50 dark:border-amber-900/30 pt-1 mt-1">
                                                        {detail}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2 mt-6">
                                    <FileText size={16} className="text-blue-500" /> Antecedentes de Desarrollo e Historia de Vida
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FieldCard label="2. Historia Perinatal" value={ficha.perinatal} icon={<Users size={14} />} />
                                    <FieldCard label="3. Desarrollo Psicomotor" value={ficha.desarrollo_psicomotor} icon={<Activity size={14} />} />
                                    <FieldCard label="4. Escolaridad" value={ficha.escolaridad} icon={<FileText size={14} />} />
                                    <FieldCard label="5. Personalidad Previa" value={ficha.personalidad_previa} icon={<User size={14} />} />
                                    <FieldCard label="6. Historia Laboral" value={ficha.historia_laboral} icon={<Briefcase size={14} />} />
                                    <FieldCard label="7. Hábitos o Intereses" value={ficha.habitos_intereses} icon={<Heart size={14} />} />
                                </div>
                            </div>
                            {/* Antecedentes II content merged natively within the same container block */}
                            {/* Hábitos Nocivos */}
                            <div>
                                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2">
                                    <Heart size={16} className="text-red-500" /> 8. Hábitos Nocivos
                                </h3>
                                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700/80 rounded-xl">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold text-xs uppercase border-b border-gray-200 dark:border-gray-700">
                                                <th className="p-3">Hábito Nocivo</th>
                                                <th className="p-3">Consumo / Uso</th>
                                                <th className="p-3">Frecuencia</th>
                                                <th className="p-3">Cantidad</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/80 dark:text-gray-200">
                                            <tr>
                                                <td className="p-3 font-semibold text-gray-600 dark:text-gray-300">Tabaco</td>
                                                <td className="p-3">{ficha.habito_tabaco_consumo || <span className="text-gray-400 italic">No registra</span>}</td>
                                                <td className="p-3">{ficha.habito_tabaco_frecuencia || <span className="text-gray-400">—</span>}</td>
                                                <td className="p-3">{ficha.habito_tabaco_cantidad || <span className="text-gray-400">—</span>}</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 font-semibold text-gray-600 dark:text-gray-300">Alcohol</td>
                                                <td className="p-3">{ficha.habito_alcohol_consumo || <span className="text-gray-400 italic">No registra</span>}</td>
                                                <td className="p-3">{ficha.habito_alcohol_frecuencia || <span className="text-gray-400">—</span>}</td>
                                                <td className="p-3">{ficha.habito_alcohol_cantidad || <span className="text-gray-400">—</span>}</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 font-semibold text-gray-600 dark:text-gray-300">Drogas</td>
                                                <td className="p-3">{ficha.habito_drogas_consumo || <span className="text-gray-400 italic">No registra</span>}</td>
                                                <td className="p-3">{ficha.habito_drogas_frecuencia || <span className="text-gray-400">—</span>}</td>
                                                <td className="p-3">{ficha.habito_drogas_cantidad || <span className="text-gray-400">—</span>}</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 font-semibold text-gray-600 dark:text-gray-300">Juegos</td>
                                                <td className="p-3">{ficha.habito_juegos_consumo || <span className="text-gray-400 italic">No registra</span>}</td>
                                                <td className="p-3">{ficha.habito_juegos_frecuencia || <span className="text-gray-400">—</span>}</td>
                                                <td className="p-3">{ficha.habito_juegos_cantidad || <span className="text-gray-400">—</span>}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Patologías no psiquiátricas */}
                            <div>
                                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2 mt-6">
                                    <Shield size={16} className="text-red-500" /> 14. Antecedentes Patológicos (Enfermedades no psiquiátricas)
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                                    <CheckBadge label="Diabetes" value={ficha.patologia_diabetes} />
                                    <CheckBadge label="Post-Parto" value={ficha.patologia_post_parto} />
                                    <CheckBadge label="Cardiovascular / HTA" value={ficha.patologia_cardiovascular_hta} />
                                    <CheckBadge label="Inmunodeficiencia / VIH" value={ficha.patologia_inmunodeficiencia_vih} />
                                    <CheckBadge label="Hepática" value={ficha.patologia_hepatica} />
                                    <CheckBadge label="Renal" value={ficha.patologia_renal} />
                                    <CheckBadge label="Neurológica" value={ficha.patologia_neurologica} />
                                    <CheckBadge label="Metabólica" value={ficha.patologia_metabolica} />
                                    <CheckBadge label="Embarazo" value={ficha.patologia_embarazo} />
                                    <CheckBadge label="Cáncer" value={ficha.patologia_cancer} />
                                </div>
                                {ficha.patologia_embarazo && ficha.patologia_embarazo_trimestre && (
                                    <div className="mt-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-3 rounded-xl text-xs max-w-md">
                                        <strong className="text-red-800 dark:text-red-300">Trimestre de Embarazo: </strong>
                                        <span className="text-gray-700 dark:text-gray-300 font-bold">{ficha.patologia_embarazo_trimestre}</span>
                                    </div>
                                )}
                                {ficha.patologia_otros && (
                                    <div className="mt-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Otras Patologías</span>
                                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium whitespace-pre-wrap">{ficha.patologia_otros}</p>
                                    </div>
                                )}
                            </div>

                            {/* Otros Antecedentes */}
                            <div>
                                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2 mt-6">
                                    <FileText size={16} className="text-blue-500" /> Antecedentes Psicosociales, Médicos y Estilo de Vida
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FieldCard label="9. Recreación y Vida Social" value={ficha.recreacion_vida_social} icon={<Users size={14} />} />
                                    <FieldCard label="10. Vida Sexual" value={ficha.vida_sexual} icon={<Heart size={14} />} />
                                    <FieldCard label="11. Eventos Importantes y Estresores" value={ficha.estresores_psicosociales} icon={<Info size={14} />} />
                                    <FieldCard label="12. Antecedentes Socio-Culturales" value={ficha.antecedentes_socio_culturales} icon={<Users size={14} />} />
                                    <FieldCard label="12. Actitud ante la Enfermedad" value={ficha.actitud_enfermedad} icon={<Info size={14} />} />
                                    <FieldCard label="13. Gineco-Obstétricos" value={ficha.antecedentes_gineco_obstetricos} icon={<User size={14} />} />
                                    <FieldCard label="15. Traumatismo y Accidentes" value={ficha.traumatismo_accidentes} icon={<Shield size={14} />} />
                                    <FieldCard label="16. Alergias" value={ficha.alergias_ficha} icon={<Shield size={14} />} />
                                    <FieldCard label="17. Hospitalizaciones" value={ficha.hospitalizaciones} icon={<Info size={14} />} />
                                    <FieldCard label="18. Transfusiones" value={ficha.transfusiones} icon={<Activity size={14} />} />
                                    <FieldCard label="19. Quirúrgicos" value={ficha.quirurgicos} icon={<Activity size={14} />} />
                                    <FieldCard label="20. Antecedentes Psicopatológicos" value={ficha.antecedentes_psicopatologicos} icon={<FileText size={14} />} />
                                </div>
                            </div>
                        </div>
                    )
                )}

                {/* ===================== TAB 5: ANTECEDENTES FAMILIARES & GENERALES ===================== */}
                {activeTab === 'antecedentes_familiares' && (
                    !ficha ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400">
                            <Stethoscope size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No se ha registrado ficha médica.</p>
                            <p className="text-sm mt-1">Edite el paciente para registrar los Antecedentes Familiares.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2">
                                    <Users size={16} className="text-blue-500" /> IV. Antecedentes Familiares
                                </h3>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">1. Familia de Origen</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FieldCard label="Padre" value={ficha.ant_fam_padre} icon={<User size={14} />} />
                                        <FieldCard label="Madre" value={ficha.ant_fam_madre} icon={<User size={14} />} />
                                        <FieldCard label="Hermanos" value={ficha.ant_fam_hermanos} icon={<Users size={14} />} />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <FieldCard 
                                            label="2. Dinámica Familiar" 
                                            value={ficha.ant_fam_dinamica} 
                                            icon={<Activity size={14} />} 
                                        />
                                        <FieldCard 
                                            label="a. Estructura Familiar (Genograma, etc.)" 
                                            value={ficha.ant_fam_estructura} 
                                            icon={<FileText size={14} />} 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2 mt-6">
                                    <Info size={16} className="text-blue-500" /> V. Antecedentes Generales
                                </h3>
                                <FieldCard 
                                    label="Condiciones de Vida (Vivienda, Servicios Básicos, Mascotas)" 
                                    value={ficha.ant_generales} 
                                    icon={<Info size={14} />} 
                                />
                            </div>
                        </div>
                    )
                )}

                {/* ===================== TAB 6: EXAMEN FÍSICO ===================== */}
                {activeTab === 'examen_fisico' && (
                    !ficha ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400">
                            <Stethoscope size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No se ha registrado ficha médica.</p>
                            <p className="text-sm mt-1">Edite el paciente para registrar el Examen Físico.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* 1. Funciones Biológicas */}
                            <div>
                                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2">
                                    <Activity size={16} className="text-blue-500" /> 1. Funciones Biológicas
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
                                    <Field label="Apetito" value={ficha.examen_bio_apetito} />
                                    <Field label="Sed" value={ficha.examen_bio_sed} />
                                    <Field label="Orina" value={ficha.examen_bio_orina} />
                                    <Field label="Deposiciones" value={ficha.examen_bio_deposiciones} />
                                    <Field label="Sueño" value={ficha.examen_bio_sueno} />
                                </div>
                                <FieldCard 
                                    label="Alimentación Diaria" 
                                    value={ficha.examen_bio_alimentacion} 
                                    icon={<FileText size={14} />} 
                                />
                            </div>

                            {/* 2. Funciones Vitales */}
                            <div>
                                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2 mt-6">
                                    <Heart size={16} className="text-red-500" /> 2. Funciones Vitales
                                </h3>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* FC Card */}
                                    <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl flex flex-col justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400">Frecuencia Cardíaca</span>
                                        <div className="mt-2 flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{ficha.examen_vit_fc || '—'}</span>
                                            {ficha.examen_vit_fc && <span className="text-xs font-semibold text-gray-500">lpm</span>}
                                        </div>
                                    </div>

                                    {/* FR Card */}
                                    <div className="bg-teal-50/50 dark:bg-teal-950/10 border border-teal-100 dark:border-teal-900/30 p-4 rounded-xl flex flex-col justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-500 dark:text-teal-400">Frecuencia Respiratoria</span>
                                        <div className="mt-2 flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{ficha.examen_vit_fr || '—'}</span>
                                            {ficha.examen_vit_fr && <span className="text-xs font-semibold text-gray-500">rpm</span>}
                                        </div>
                                    </div>

                                    {/* Temp Card */}
                                    <div className="bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30 p-4 rounded-xl flex flex-col justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500 dark:text-orange-400">Temperatura</span>
                                        <div className="mt-2 flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{ficha.examen_vit_temp || '—'}</span>
                                            {ficha.examen_vit_temp && <span className="text-xs font-semibold text-gray-500">°C</span>}
                                        </div>
                                    </div>

                                    {/* Sat Card */}
                                    <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl flex flex-col justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400">Saturación O₂</span>
                                        <div className="mt-2 flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{ficha.examen_vit_sat || '—'}</span>
                                            {ficha.examen_vit_sat && <span className="text-xs font-semibold text-gray-500">%</span>}
                                        </div>
                                    </div>

                                    {/* PA Card */}
                                    <div className="bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/30 p-4 rounded-xl flex flex-col justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 dark:text-purple-400">Presión Arterial</span>
                                        <div className="mt-2 flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{ficha.examen_vit_pa || '—'}</span>
                                            {ficha.examen_vit_pa && <span className="text-xs font-semibold text-gray-500">mmHg</span>}
                                        </div>
                                    </div>

                                    {/* Peso Card */}
                                    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-xl flex flex-col justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Peso</span>
                                        <div className="mt-2 flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{ficha.examen_vit_peso || '—'}</span>
                                            {ficha.examen_vit_peso && <span className="text-xs font-semibold text-gray-500">kg</span>}
                                        </div>
                                    </div>

                                    {/* Talla Card */}
                                    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-xl flex flex-col justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Talla (Altura)</span>
                                        <div className="mt-2 flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{ficha.examen_vit_talla || '—'}</span>
                                            {ficha.examen_vit_talla && <span className="text-xs font-semibold text-gray-500">{parseFloat(ficha.examen_vit_talla) > 3 ? 'cm' : 'm'}</span>}
                                        </div>
                                    </div>

                                    {/* IMC Highlight Card */}
                                    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-xl flex flex-col justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">IMC (Índice Masa Corporal)</span>
                                        <div className="mt-2 flex flex-col gap-1">
                                            {(() => {
                                                const imcVal = parseFloat(ficha.examen_vit_imc || '');
                                                if (!imcVal) return <span className="text-gray-400 font-normal italic">Sin registrar</span>;
                                                let badgeColor = '';
                                                let label = '';
                                                if (imcVal < 18.5) {
                                                    badgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
                                                    label = 'Bajo Peso';
                                                } else if (imcVal >= 18.5 && imcVal < 25.0) {
                                                    badgeColor = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800';
                                                    label = 'Normal';
                                                } else if (imcVal >= 25.0 && imcVal < 30.0) {
                                                    badgeColor = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-450 border border-orange-200 dark:border-orange-800';
                                                    label = 'Sobrepeso';
                                                } else {
                                                    badgeColor = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800';
                                                    label = 'Obesidad';
                                                }
                                                return (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{imcVal.toFixed(2)}</span>
                                                        <span className={`inline-self-start text-[10px] font-black px-2 py-0.5 rounded-full ${badgeColor}`}>
                                                            {label}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Examen Físico Regional (Sistemas) */}
                            <div>
                                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2 mt-6">
                                    <Stethoscope size={16} className="text-blue-500" /> 3. Examen Regional y Sistemas
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <FieldCard label="Aspecto General" value={ficha.examen_aspecto_general} icon={<User size={14} />} />
                                    <FieldCard label="Piel y Faneras" value={ficha.examen_piel_faneras} icon={<Activity size={14} />} />
                                    <FieldCard label="Cabeza" value={ficha.examen_cabeza} icon={<Activity size={14} />} />
                                    <FieldCard label="Ojos" value={ficha.examen_ojos} icon={<Activity size={14} />} />
                                    <FieldCard label="Nariz" value={ficha.examen_nariz} icon={<Activity size={14} />} />
                                    <FieldCard label="Oídos" value={ficha.examen_oidos} icon={<Activity size={14} />} />
                                    <FieldCard label="Boca" value={ficha.examen_boca} icon={<Activity size={14} />} />
                                    <FieldCard label="Cuello" value={ficha.examen_cuello} icon={<Activity size={14} />} />
                                    <FieldCard label="Tórax" value={ficha.examen_torax} icon={<Activity size={14} />} />
                                    <FieldCard label="Cardiovascular" value={ficha.examen_cardiovascular} icon={<Heart size={14} />} />
                                    <FieldCard label="Abdomen" value={ficha.examen_abdomen} icon={<Activity size={14} />} />
                                    <FieldCard label="Urogenital" value={ficha.examen_urogenital} icon={<Activity size={14} />} />
                                    <FieldCard label="Extremidades y Columnas" value={ficha.examen_extremidades_columnas} icon={<Activity size={14} />} />
                                    <FieldCard label="Neurológicos" value={ficha.examen_neurologicos} icon={<Shield size={14} />} />
                                    <FieldCard label="Linfáticos" value={ficha.examen_linfaticos} icon={<Activity size={14} />} />
                                </div>
                            </div>
                        </div>
                    )
                )}

                {/* ===================== TAB 7: EXAMEN MENTAL ===================== */}
                {activeTab === 'examen_mental' && (
                    !ficha ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400">
                            <Stethoscope size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No se ha registrado ficha médica.</p>
                            <p className="text-sm mt-1">Edite el paciente para registrar el Examen Mental.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2">
                                    <Activity size={16} className="text-blue-500" /> VII. Examen Mental
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <FieldCard 
                                            label="1. Apariencia General y Comportamiento" 
                                            value={ficha.examen_mental_apariencia} 
                                            icon={<User size={14} />} 
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <FieldCard 
                                            label="2. Lenguaje" 
                                            value={ficha.examen_mental_lenguaje} 
                                            icon={<FileText size={14} />} 
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <FieldCard 
                                            label="3. Afecto" 
                                            value={ficha.examen_mental_afecto} 
                                            icon={<Heart size={14} />} 
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <FieldCard 
                                            label="4. Pensamiento" 
                                            value={ficha.examen_mental_pensamiento} 
                                            icon={<FileText size={14} />} 
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <FieldCard 
                                            label="5. Percepción" 
                                            value={ficha.examen_mental_percepcion} 
                                            icon={<FileText size={14} />} 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Funciones Cognoscitivas Block */}
                            <div>
                                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2 mt-6">
                                    <Activity size={16} className="text-blue-500" /> 6. Funciones Cognoscitivas
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <FieldCard label="Conciencia y Orientación" value={ficha.examen_mental_cognicion_conciencia} icon={<Activity size={14} />} />
                                    <FieldCard label="Atención" value={ficha.examen_mental_cognicion_atencion} icon={<Activity size={14} />} />
                                    <FieldCard label="Memoria" value={ficha.examen_mental_cognicion_memoria} icon={<Activity size={14} />} />
                                    <FieldCard label="Inteligencia" value={ficha.examen_mental_cognicion_inteligencia} icon={<Activity size={14} />} />
                                    <FieldCard label="Juicio" value={ficha.examen_mental_cognicion_juicio} icon={<Activity size={14} />} />
                                </div>
                            </div>

                            {/* Ejecutivas & Conciencia */}
                            <div>
                                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2 mt-6">
                                    <Shield size={16} className="text-blue-500" /> Funciones Ejecutivas y Conciencia de Enfermedad
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FieldCard label="7. Funciones Ejecutivas" value={ficha.examen_mental_funciones_ejecutivas} icon={<FileText size={14} />} />
                                    <FieldCard label="8. Conciencia de la Enfermedad" value={ficha.examen_mental_conciencia_enfermedad} icon={<FileText size={14} />} />
                                </div>
                            </div>
                        </div>
                    )
                )}

                {/* ===================== TAB 8: IMPRESIÓN DIAGNÓSTICA ===================== */}
                {activeTab === 'impresion_diagnostica' && (
                    !ficha ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400">
                            <Stethoscope size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No se ha registrado ficha médica.</p>
                            <p className="text-sm mt-1">Edite el paciente para registrar la Impresión Diagnóstica.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2">
                                <Stethoscope size={16} className="text-green-500" /> VIII. Impresión Diagnóstica
                            </h3>

                            <div className="bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 p-6 rounded-2xl">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 block mb-2">Diagnóstico Presuntivo</span>
                                        <p className="text-base text-gray-800 dark:text-gray-105 font-semibold whitespace-pre-wrap leading-relaxed">
                                            {ficha.diagnostico_presuntivo || <span className="text-gray-400 font-normal italic">Sin registrar</span>}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-green-250 dark:border-green-800 p-4 rounded-xl flex flex-col items-center justify-center shrink-0 min-w-[150px] shadow-sm">
                                        <span className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Código CIE 10</span>
                                        <span className="text-xl font-black text-gray-800 dark:text-white mt-1 uppercase tracking-wider">
                                            {ficha.diagnostico_cie10 || <span className="text-gray-400 font-normal italic">—</span>}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                )}

            </div>

            <ManualModal 
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Ficha Clínica"
                sections={manualSections}
            />
        </div>
    );
};

export default PacienteTabFicha;
