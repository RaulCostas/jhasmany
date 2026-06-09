import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { Paciente, HistoriaClinica, HistoriaClinicaDiagnostico, Medicamento, RecetaDetalle } from '../types';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import { getLocalDateString, formatDate } from '../utils/dateUtils';
import { CIE10_DISORDERS } from '../constants/cie10';
import { Calendar, Info, Stethoscope, Plus, Trash2, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import SearchableMedicamentoSelect from './SearchableMedicamentoSelect';
import SignatureModal from './SignatureModal';

const viasAdministracion = [
    'Oral', 'Sublingual', 'Rectal', 'Intravenosa', 'Intramoscular', 
    'Subcutanea', 'Dermica', 'Nasal', 'Oftalmologica', 'Inhalatoria', 
    'Epidural', 'Intratecal', 'Vaginal', 'Intraarticular', 'Parenteral', 'Otros'
];

interface HistoriaClinicaFormProps {
    pacienteId: number;
    paciente?: Paciente | null;
    historiaList?: HistoriaClinica[] | null;
    onSuccess: () => void;
    historiaToEdit: HistoriaClinica | null;
    onCancelEdit: () => void;
}

const HistoriaClinicaForm: React.FC<HistoriaClinicaFormProps> = ({
    pacienteId,
    paciente,
    historiaList,
    onSuccess,
    historiaToEdit,
    onCancelEdit,
}) => {
    const [formData, setFormData] = useState({
        fecha: getLocalDateString(),
        modalidad: 'Presencial',
        servicio: 'Psiquiatria',
        motivo_visita: '',
        examen_fisico: '',
        examen_mental: '',
        examenes_auxiliares: '',
        plan_trabajo: '',
        derivar_consulta: 'NO',
        derivar_consulta_detalle: ''
    });

    const [diagnosticosList, setDiagnosticosList] = useState<HistoriaClinicaDiagnostico[]>([]);
    const [searchTerms, setSearchTerms] = useState<Record<number, string>>({});
    const [showManual, setShowManual] = useState(false);
    const [medicamentosCatalog, setMedicamentosCatalog] = useState<Medicamento[]>([]);
    const [emitirReceta, setEmitirReceta] = useState(false);
    const [hasRegisteredSignature, setHasRegisteredSignature] = useState(false);
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
    const [showUserSignatureModal, setShowUserSignatureModal] = useState(false);
    const [estaFirmado, setEstaFirmado] = useState(false);

    const checkRegisteredSignature = async (userIdToCheck: number) => {
        if (!userIdToCheck) return;
        try {
            const response = await api.get(`/firmas/documento/usuario/${userIdToCheck}`);
            const signatures = response.data;
            if (signatures && signatures.length > 0) {
                const latestSignature = signatures[signatures.length - 1];
                setHasRegisteredSignature(true);
                setSignaturePreview(latestSignature.firmaData);
                setEstaFirmado(true);
            } else {
                setHasRegisteredSignature(false);
                setSignaturePreview(null);
                setEstaFirmado(false);
            }
        } catch (error) {
            console.error('Error checking user signature:', error);
        }
    };

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.id) {
                    checkRegisteredSignature(user.id);
                }
            } catch (e) {
                console.error("Error parsing user", e);
            }
        }
    }, []);
    const [recetaDetalles, setRecetaDetalles] = useState<RecetaDetalle[]>([{
        id: 0,
        recetaId: 0,
        medicamentoId: 0,
        tiempo: '',
        via: 'Oral',
        posologia: '',
        cantidad: ''
    }]);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    useEffect(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    }, [historiaToEdit]);

    const handleSpeak = (text: string) => {
        if ('speechSynthesis' in window) {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
            } else {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'es-ES';
                utterance.onend = () => {
                    setIsSpeaking(false);
                };
                utterance.onerror = () => {
                    setIsSpeaking(false);
                };
                setIsSpeaking(true);
                window.speechSynthesis.speak(utterance);
            }
        } else {
            alert('Su navegador no soporta la función de lectura de voz.');
        }
    };

    useEffect(() => {
        api.get('/medicamento?limit=9999')
            .then(res => {
                setMedicamentosCatalog(res.data.data || []);
            })
            .catch(err => {
                console.error('Error loading medicines catalog:', err);
            });
    }, []);

    const manualSections: ManualSection[] = [
        {
            title: 'Nuevo Registro Clínico',
            content: 'Guarde las notas de evolución del paciente. Seleccione modalidad y servicio, detalle anamnesis, cargue exámenes físicos, agregue múltiples diagnósticos CIE-10 y defina el plan de trabajo.'
        },
        {
            title: 'Sección Diagnósticos',
            content: 'Use "Agregar Diagnóstico" para cargar uno o más diagnósticos CIE-10. Escriba en la caja para buscar y autocompletar códigos de trastornos mentales (F00-F99).'
        },
        {
            title: 'Derivación',
            content: 'Si marca "Derivar consulta" como SÍ, se activará una caja de texto adicional para detallar el centro, especialista o motivo de la derivación.'
        }
    ];

    useEffect(() => {
        if (historiaToEdit) {
            setFormData({
                fecha: historiaToEdit.fecha.split('T')[0],
                modalidad: historiaToEdit.modalidad || 'Presencial',
                servicio: historiaToEdit.servicio || 'Psiquiatria',
                motivo_visita: historiaToEdit.motivo_visita || '',
                examen_fisico: historiaToEdit.examen_fisico || '',
                examen_mental: historiaToEdit.examen_mental || '',
                examenes_auxiliares: historiaToEdit.examenes_auxiliares || '',
                plan_trabajo: historiaToEdit.plan_trabajo || '',
                derivar_consulta: historiaToEdit.derivar_consulta || 'NO',
                derivar_consulta_detalle: historiaToEdit.derivar_consulta_detalle || ''
            });
            setDiagnosticosList(historiaToEdit.diagnosticos || []);
            
            if (historiaToEdit.receta) {
                setEmitirReceta(true);
                setRecetaDetalles(historiaToEdit.receta.detalles || []);
                setEstaFirmado(Boolean(historiaToEdit.receta.esta_firmado));
            } else {
                setEmitirReceta(false);
                setRecetaDetalles([{
                    id: 0,
                    recetaId: 0,
                    medicamentoId: 0,
                    tiempo: '',
                    via: 'Oral',
                    posologia: '',
                    cantidad: ''
                }]);
            }
        } else {
            resetForm();
        }
    }, [historiaToEdit]);

    const getPreviousEncounter = () => {
        if (!paciente) return null;

        const list = historiaList || [];
        let prevRecord: HistoriaClinica | null = null;

        if (!historiaToEdit) {
            if (list.length > 0) {
                const sorted = [...list].sort((a, b) => b.id - a.id);
                prevRecord = sorted[0];
            }
        } else {
            const candidates = list.filter(item => item.id < historiaToEdit.id);
            if (candidates.length > 0) {
                const sorted = candidates.sort((a, b) => b.id - a.id);
                prevRecord = sorted[0];
            }
        }

        if (prevRecord) {
            const diags = (prevRecord.diagnosticos || []).map(d => ({
                diagnostico: d.diagnostico,
                tipo: d.tipo
            }));

            const details = (prevRecord.receta?.detalles || []).map(d => ({
                medicamentoNombre: d.medicamento?.medicamento || 'Medicamento',
                tiempo: d.tiempo,
                via: d.via,
                posologia: d.posologia,
                cantidad: d.cantidad
            }));

            return {
                sourceName: `Seguimiento Clínico del ${formatDate(prevRecord.fecha)}`,
                diagnosticos: diags,
                recetaDetalles: details
            };
        } else if (paciente.fichaClinica) {
            const diags = (paciente.fichaClinica.diagnosticos || []).map(d => ({
                diagnostico: d.diagnostico,
                tipo: d.tipo
            }));


            const details = (paciente.fichaClinica.receta?.detalles || []).map(d => ({
                medicamentoNombre: d.medicamento?.medicamento || 'Medicamento',
                tiempo: d.tiempo,
                via: d.via,
                posologia: d.posologia,
                cantidad: d.cantidad
            }));

            return {
                sourceName: 'Ficha Médica (Registro Inicial)',
                diagnosticos: diags,
                recetaDetalles: details
            };
        }

        return null;
    };

    const prevEncounter = getPreviousEncounter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData({
            fecha: getLocalDateString(),
            modalidad: 'Presencial',
            servicio: 'Psiquiatria',
            motivo_visita: '',
            examen_fisico: '',
            examen_mental: '',
            examenes_auxiliares: '',
            plan_trabajo: '',
            derivar_consulta: 'NO',
            derivar_consulta_detalle: ''
        });
        setDiagnosticosList([]);
        setSearchTerms({});
        setEmitirReceta(false);
        setRecetaDetalles([{
            id: 0,
            recetaId: 0,
            medicamentoId: 0,
            tiempo: '',
            via: 'Oral',
            posologia: '',
            cantidad: ''
        }]);
    };

    // Diagnoses methods
    const handleAddDiagnostico = () => {
        setDiagnosticosList(prev => [...prev, { diagnostico: '', tipo: 'Presuntivo' }]);
    };

    const handleRemoveDiagnostico = (index: number) => {
        setDiagnosticosList(prev => prev.filter((_, i) => i !== index));
        setSearchTerms(prev => {
            const copy = { ...prev };
            delete copy[index];
            return copy;
        });
    };

    const handleUpdateDiagnosticoType = (index: number, tipo: 'Definitivo' | 'Repetitivo' | 'Presuntivo') => {
        setDiagnosticosList(prev => prev.map((item, i) => i === index ? { ...item, tipo } : item));
    };

    const handleSelectDiagnostico = (index: number, val: string) => {
        setDiagnosticosList(prev => prev.map((item, i) => i === index ? { ...item, diagnostico: val } : item));
        setSearchTerms(prev => {
            const copy = { ...prev };
            delete copy[index];
            return copy;
        });
    };

    const addRecetaDetalle = () => {
        setRecetaDetalles(prev => [...prev, {
            id: 0,
            recetaId: 0,
            medicamentoId: 0,
            tiempo: '',
            via: 'Oral',
            posologia: '',
            cantidad: ''
        }]);
    };

    const removeRecetaDetalle = (index: number) => {
        setRecetaDetalles(prev => prev.filter((_, i) => i !== index));
    };

    const handleRecetaDetalleChange = (index: number, field: keyof RecetaDetalle, value: any) => {
        setRecetaDetalles(prev => {
            const newDetalles = [...prev];
            newDetalles[index] = { ...newDetalles[index], [field]: value };
            return newDetalles;
        });
    };

    const handleSave = async () => {
        // Validate diagnoses
        const hasEmptyDiag = diagnosticosList.some(d => !d.diagnostico.trim());
        if (hasEmptyDiag) {
            Swal.fire({
                icon: 'warning',
                title: 'Diagnósticos incompletos',
                text: 'Por favor complete o elimine las filas de diagnóstico vacías.',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            return;
        }

        // Validate recipe if enabled
        let validRecetaDetalles: any[] = [];
        if (emitirReceta) {
            validRecetaDetalles = recetaDetalles.filter(d => d.medicamentoId > 0);
            if (validRecetaDetalles.length === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Receta incompleta',
                    text: 'Por favor seleccione al menos un medicamento válido si desea emitir una receta, o desmarque la casilla de receta.',
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
                return;
            }
        }

        try {
            const payload: any = {
                ...formData,
                pacienteId: Number(pacienteId),
                diagnosticos: diagnosticosList,
                receta: emitirReceta ? { detalles: validRecetaDetalles, esta_firmado: estaFirmado } : { detalles: [] }
            };

            // Add user ID for auditing
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    payload.usuarioId = JSON.parse(userStr).id;
                } catch (e) {
                    console.error("Error parsing user for auditing", e);
                }
            }

            if (historiaToEdit) {
                await api.patch(`/historia-clinica/${historiaToEdit.id}`, payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Seguimiento Actualizado',
                    text: 'Historia Clínica actualizada exitosamente',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            } else {
                await api.post('/historia-clinica', payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Seguimiento Guardado',
                    text: 'Historia Clínica guardada exitosamente',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
            onSuccess();
            onCancelEdit();
            resetForm();
        } catch (error) {
            console.error('Error saving historia clinica:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al guardar el registro',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSave();
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <span className={`p-2 rounded-lg ${historiaToEdit ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300' : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300'}`}>
                        <Stethoscope size={24} />
                    </span>
                    {historiaToEdit ? 'Editar Seguimiento Clínico' : 'Nuevo Seguimiento Clínico'}
                </h3>
                <button
                    type="button"
                    onClick={() => setShowManual(true)}
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Ayuda / Manual"
                >
                    ?
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                {/* --- DATOS GENERALES --- */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide border-b dark:border-gray-600 pb-2">Datos Generales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Fecha */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="date"
                                    name="fecha"
                                    value={formData.fecha}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Modalidad */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Modalidad</label>
                            <select
                                name="modalidad"
                                value={formData.modalidad}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Presencial">Presencial</option>
                                <option value="Virtual">Virtual</option>
                            </select>
                        </div>

                        {/* Servicio */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Servicio</label>
                            <select
                                name="servicio"
                                value={formData.servicio}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Psiquiatria">Psiquiatría</option>
                                <option value="Neuropsiquiatria">Neuropsiquiatría</option>
                                <option value="Psicologia">Psicología</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* --- ANAMNESIS --- */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide border-b dark:border-gray-600 pb-2">Anamnesis</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tiempo de Enfermedad (jalar de Ficha) */}
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                            <span className="block text-xs font-bold text-gray-400 uppercase">Tiempo / Tipo de Enfermedad (Ficha Médica)</span>
                            <span className="text-sm text-gray-800 dark:text-gray-200 font-medium whitespace-pre-wrap">
                                {paciente?.fichaClinica?.enf_actual_te || <span className="text-gray-400 italic">No registrado en Ficha</span>}
                            </span>
                        </div>

                        {/* Relato Cronológico (jalar de Ficha) */}
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="block text-xs font-bold text-gray-400 uppercase">Relato Cronológico (Ficha Médica)</span>
                                {paciente?.fichaClinica?.enf_actual_relato && (
                                    <button
                                        type="button"
                                        onClick={() => handleSpeak(paciente?.fichaClinica?.enf_actual_relato || '')}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-50 hover:bg-blue-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-blue-600 dark:text-blue-400 transition-all shadow-sm border border-gray-200 dark:border-gray-600 hover:scale-105 active:scale-95"
                                        title={isSpeaking ? "Detener lectura" : "Escuchar relato"}
                                    >
                                        {isSpeaking ? (
                                            <>
                                                <VolumeX size={12} className="text-red-500 dark:text-red-400 animate-pulse" />
                                                <span>Detener</span>
                                            </>
                                        ) : (
                                            <>
                                                <Volume2 size={12} />
                                                <span>Escuchar</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            <span className="text-sm text-gray-800 dark:text-gray-200 font-medium whitespace-pre-wrap">
                                {paciente?.fichaClinica?.enf_actual_relato || <span className="text-gray-400 italic">No registrado en Ficha</span>}
                            </span>
                        </div>
                    </div>

                    {prevEncounter && (
                        <div className="p-4 bg-blue-50/30 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/50 space-y-3">
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider">
                                <Info size={14} className="shrink-0" />
                                <span>Historial de Diagnósticos y Receta - {prevEncounter.sourceName}</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                {/* Diagnósticos */}
                                <div className="space-y-1.5">
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Diagnósticos Previos</span>
                                    {prevEncounter.diagnosticos.length > 0 ? (
                                        <div className="space-y-1">
                                            {prevEncounter.diagnosticos.map((diag, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                                    <span className="text-gray-700 dark:text-gray-300 font-medium">{diag.diagnostico}</span>
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ml-2 shrink-0 ${
                                                        diag.tipo === 'Definitivo' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                                        diag.tipo === 'Repetitivo' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                                                        'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                                    }`}>
                                                        {diag.tipo}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Ningún diagnóstico registrado en el encuentro previo</span>
                                    )}
                                </div>

                                {/* Receta */}
                                <div className="space-y-1.5">
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Receta Emitida</span>
                                    {prevEncounter.recetaDetalles.length > 0 ? (
                                        <div className="space-y-1.5">
                                            {prevEncounter.recetaDetalles.map((det, idx) => (
                                                <div key={idx} className="text-[11px] p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 space-y-1">
                                                    <div className="font-bold text-gray-800 dark:text-gray-200 flex justify-between">
                                                        <span>{det.medicamentoNombre}</span>
                                                        <span className="text-[9px] text-gray-400 font-normal">{det.via}</span>
                                                    </div>
                                                    <div className="text-gray-500 dark:text-gray-400 grid grid-cols-2 gap-x-2 gap-y-0.5">
                                                        <span><strong className="text-[9px] uppercase text-gray-400">Posología:</strong> {det.posologia}</span>
                                                        <span><strong className="text-[9px] uppercase text-gray-400">Cantidad:</strong> {det.cantidad}</span>
                                                        {det.tiempo && <span className="col-span-2"><strong className="text-[9px] uppercase text-gray-400">Tiempo:</strong> {det.tiempo}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Ningún medicamento recetado en el encuentro previo</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Motivo de Visita</label>
                        <textarea
                            name="motivo_visita"
                            value={formData.motivo_visita}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Describa el motivo de la consulta actual..."
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                        />
                    </div>
                </div>

                {/* --- EXAMEN FISICO Y MENTAL --- */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide border-b dark:border-gray-600 pb-2">Examen Físico y Mental</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Examen Físico</label>
                            <textarea
                                name="examen_fisico"
                                value={formData.examen_fisico}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Escriba los resultados del examen físico..."
                                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Examen Mental</label>
                            <textarea
                                name="examen_mental"
                                value={formData.examen_mental}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Escriba los resultados del examen mental..."
                                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Exámenes Auxiliares</label>
                        <textarea
                            name="examenes_auxiliares"
                            value={formData.examenes_auxiliares}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Ingrese resultados de exámenes auxiliares, de laboratorio o de imagen..."
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                        />
                    </div>
                </div>

                {/* --- DIAGNOSTICOS --- */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4">
                    <div className="flex justify-between items-center border-b dark:border-gray-600 pb-2">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Diagnósticos</h4>
                        <button
                            type="button"
                            onClick={handleAddDiagnostico}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-sm transition-all"
                        >
                            <Plus size={14} />
                            Agregar Diagnóstico
                        </button>
                    </div>

                    {diagnosticosList.length === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-gray-400 italic bg-white dark:bg-gray-800 p-4 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                            <AlertCircle size={16} />
                            <span>No se han agregado diagnósticos para esta consulta. Haga clic en "Agregar Diagnóstico".</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {diagnosticosList.map((item, idx) => {
                                const activeSearch = searchTerms[idx] !== undefined;
                                const currentSearchVal = searchTerms[idx] || '';
                                
                                const filteredDisorders = CIE10_DISORDERS.filter(d => 
                                    d.code.toLowerCase().includes(currentSearchVal.toLowerCase()) ||
                                    d.description.toLowerCase().includes(currentSearchVal.toLowerCase())
                                );

                                return (
                                    <div key={idx} className="flex flex-col md:flex-row gap-4 items-start bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm relative">
                                        
                                        {/* Diagnosis Select Auto-complete */}
                                        <div className="flex-1 w-full relative">
                                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Diagnóstico</label>
                                            <input
                                                type="text"
                                                placeholder="Escriba código o nombre para buscar (ej: F00)..."
                                                value={searchTerms[idx] !== undefined ? searchTerms[idx] : item.diagnostico}
                                                onFocus={() => setSearchTerms(prev => ({ ...prev, [idx]: item.diagnostico || '' }))}
                                                onBlur={() => setTimeout(() => {
                                                    setSearchTerms(prev => {
                                                        const copy = { ...prev };
                                                        delete copy[idx];
                                                        return copy;
                                                    });
                                                }, 200)}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setSearchTerms(prev => ({ ...prev, [idx]: val }));
                                                }}
                                                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            />
                                            
                                            {/* Dropdown list */}
                                            {activeSearch && (
                                                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 divide-y divide-gray-100 dark:divide-gray-700">
                                                    {filteredDisorders.length === 0 ? (
                                                        <div className="p-3 text-xs text-gray-400 italic">No se encontraron resultados</div>
                                                    ) : (
                                                        filteredDisorders.map(d => (
                                                            <button
                                                                key={d.code}
                                                                type="button"
                                                                onMouseDown={() => handleSelectDiagnostico(idx, `${d.code} ${d.description}`)}
                                                                className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2 border-0 shadow-none focus:outline-none"
                                                            >
                                                                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded text-[10px]">{d.code}</span>
                                                                <span className="font-medium truncate">{d.description}</span>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Diagnostic Type Select */}
                                        <div className="w-full md:w-56">
                                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Tipo</label>
                                            <select
                                                value={item.tipo}
                                                onChange={(e) => handleUpdateDiagnosticoType(idx, e.target.value as any)}
                                                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            >
                                                <option value="Definitivo">Definitivo</option>
                                                <option value="Repetitivo">Repetitivo</option>
                                                <option value="Presuntivo">Presuntivo</option>
                                            </select>
                                        </div>

                                        {/* Delete Diagnosis */}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveDiagnostico(idx)}
                                            className="p-2 text-red-500 bg-transparent border-0 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg md:self-end mt-1 shadow-none focus:outline-none"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* --- PLAN DE TRABAJO --- */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-200 dark:border-gray-600 space-y-6">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide border-b dark:border-gray-600 pb-2">Plan de Trabajo</h4>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Plan de Trabajo</label>
                        <textarea
                            name="plan_trabajo"
                            value={formData.plan_trabajo}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Describa el plan de trabajo terapéutico o medicación..."
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                        />
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                        <div>
                            <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">¿Derivar Consulta?</span>
                            <div className="flex gap-6">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="derivar_consulta"
                                        value="SI"
                                        checked={formData.derivar_consulta === 'SI'}
                                        onChange={handleChange}
                                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 font-bold">SÍ</span>
                                </label>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="derivar_consulta"
                                        value="NO"
                                        checked={formData.derivar_consulta === 'NO'}
                                        onChange={handleChange}
                                        className="form-radio text-gray-500 focus:ring-gray-400 h-4 w-4"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 font-bold">NO</span>
                                </label>
                            </div>
                        </div>

                        {formData.derivar_consulta === 'SI' && (
                            <div className="animate-in fade-in slide-in-from-top-1">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Detalle de Derivación</label>
                                <textarea
                                    name="derivar_consulta_detalle"
                                    value={formData.derivar_consulta_detalle}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="Indique a qué especialidad, doctor o centro deriva al paciente y el motivo..."
                                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* --- RECETA MEDICA (OPCIONAL) --- */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-gray-600 pb-3">
                        <div>
                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                <span>📋</span> Receta Médica (Opcional)
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Active esta opción para adjuntar una receta médica a esta consulta.
                            </p>
                        </div>
                        <div className="flex items-center">
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={emitirReceta}
                                    onChange={(e) => setEmitirReceta(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                                <span className="ml-3 text-xs font-bold text-gray-700 dark:text-gray-300">
                                    {emitirReceta ? 'Emitir Receta: SÍ' : 'Emitir Receta: NO'}
                                </span>
                            </label>
                        </div>
                    </div>

                    {emitirReceta && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Configure los medicamentos a prescribir en esta consulta.</span>
                                <button 
                                    type="button" 
                                    onClick={addRecetaDetalle} 
                                    className="p-1.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-lg flex items-center gap-1.5 shadow transition-all text-xs font-semibold transform hover:-translate-y-0.5"
                                >
                                    <Plus size={14} />
                                    Agregar Medicamento
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {recetaDetalles.map((detalle, idx) => (
                                    <div key={idx} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm relative">
                                        {/* Header Row */}
                                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100 dark:border-gray-700">
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                                Medicamento #{idx + 1}
                                            </span>
                                            {!(recetaDetalles.length === 1 && idx === 0) && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRecetaDetalle(idx)}
                                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Select Medicamento */}
                                        <div className="mb-3">
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Medicamento</label>
                                            <SearchableMedicamentoSelect
                                                medicamentosCatalog={medicamentosCatalog}
                                                selectedId={detalle.medicamentoId}
                                                onSelect={(val) => handleRecetaDetalleChange(idx, 'medicamentoId', val)}
                                                required
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Grid fields */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tiempo</label>
                                                <input
                                                    type="text"
                                                    value={detalle.tiempo}
                                                    onChange={(e) => handleRecetaDetalleChange(idx, 'tiempo', e.target.value)}
                                                    placeholder="Ej: 5 días"
                                                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Vía</label>
                                                <select
                                                    value={detalle.via}
                                                    onChange={(e) => handleRecetaDetalleChange(idx, 'via', e.target.value)}
                                                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                >
                                                    {viasAdministracion.map(v => (
                                                        <option key={v} value={v}>{v}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Posología</label>
                                                <input
                                                    type="text"
                                                    value={detalle.posologia}
                                                    onChange={(e) => handleRecetaDetalleChange(idx, 'posologia', e.target.value)}
                                                    placeholder="Ej: 1 tableta"
                                                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Cantidad</label>
                                                <input
                                                    type="text"
                                                    value={detalle.cantidad}
                                                    onChange={(e) => handleRecetaDetalleChange(idx, 'cantidad', e.target.value)}
                                                    placeholder="Ej: 15"
                                                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Firma Digital de la Receta */}
                            <div className="mt-6 border p-4 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                    <span>✍️</span> Firma Digital de la Receta
                                </h3>
                                {hasRegisteredSignature ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-gray-700 border border-green-200 dark:border-green-800 rounded-xl shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-800 w-[140px] h-[70px] flex items-center justify-center overflow-hidden">
                                                <img src={signaturePreview || undefined} alt="Firma registrada" className="max-w-full max-h-full object-contain" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                                    <span>✓</span> Firma digital registrada
                                                </p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Se aplicará automáticamente a esta receta.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={estaFirmado}
                                                    onChange={(e) => setEstaFirmado(e.target.checked)}
                                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                                                />
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                    Firmar receta al guardar
                                                </span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowUserSignatureModal(true)}
                                                className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg text-[10px] font-bold transition-colors"
                                            >
                                                Actualizar Firma
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-gray-700 border border-yellow-200 dark:border-yellow-800/50 rounded-xl shadow-sm">
                                        <div>
                                            <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5">
                                                <span>⚠️</span> No tienes una firma digital registrada
                                            </p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                Registra tu firma para poder emitir recetas firmadas automáticamente.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowUserSignatureModal(true)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 text-xs shadow transition-all transform hover:-translate-y-0.5"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                            Registrar Firma Digital
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-start gap-3 rounded-b-xl -mx-6 -mb-6">
                    <button
                        type="submit"
                        className="px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        {historiaToEdit ? 'Actualizar Seguimiento' : 'Guardar Seguimiento'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onCancelEdit();
                            resetForm();
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        Cancelar
                    </button>
                </div>
            </form>

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Evolución y Seguimiento Clínico"
                sections={manualSections}
            />

            {showUserSignatureModal && (
                <SignatureModal
                    isOpen={showUserSignatureModal}
                    onClose={() => setShowUserSignatureModal(false)}
                    tipoDocumento="usuario"
                    documentoId={JSON.parse(localStorage.getItem('user') || '{}').id}
                    rolFirmante="doctor"
                    onSuccess={() => {
                        const userStr = localStorage.getItem('user');
                        if (userStr) {
                            try {
                                const user = JSON.parse(userStr);
                                if (user.id) {
                                    checkRegisteredSignature(user.id);
                                }
                            } catch (e) {
                                console.error("Error parsing user", e);
                            }
                        }
                    }}
                />
            )}
        </div>
    );
};

export default HistoriaClinicaForm;
